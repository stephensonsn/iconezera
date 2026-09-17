import { getIconData, iconToHTML, iconToSVG, replaceIDs } from "@iconify/utils";
import type { IconifyIcon, IconifyJSON } from "@iconify/types";
import { isAttributionFree } from "./licenses";

// API pública + espelhos oficiais do Iconify, tentados em ordem quando um host falha ou limita (429).
// A lista real vem de `services.json` (raiz do repo) via `configureIconHosts`; esta é só o padrão.
let iconHosts = ["https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"];

/** Aceita apenas origens HTTPS sem caminho/credenciais; devolve a origem normalizada. */
export function parseHttpsOrigin(value: unknown): string {
  const url = new URL(String(value));
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`Host inválido: ${String(value)}`);
  }
  return url.origin;
}

/** Troca os servidores de ícones (qualquer API compatível com o Iconify). */
export function configureIconHosts(hosts: unknown): void {
  if (!Array.isArray(hosts) || hosts.length === 0 || hosts.length > 5) {
    throw new Error("iconHosts deve ter de 1 a 5 hosts");
  }
  iconHosts = hosts.map(parseHttpsOrigin);
}

const MAX_ICONS_QUERY_LENGTH = 480;
const MAX_PARALLEL_REQUESTS = 4;

export interface IconResult {
  /** "prefix:name", ex.: "mdi:home" */
  id: string;
  prefix: string;
  name: string;
  collection: string;
  license: string;
  /** true para ícones multicoloridos (a cor não deve ser sobrescrita) */
  palette: boolean;
}

interface SearchResponse {
  icons: string[];
  collections: Record<
    string,
    { name: string; palette?: boolean; license?: { title?: string; spdx?: string } }
  >;
}

export interface SvgOptions {
  color?: string;
  height?: number;
}

export function searchPath(query: string, limit = 999): string {
  return `/search?${new URLSearchParams({ query, limit: String(limit) })}`;
}

export function iconDataPath(prefix: string, names: string[]): string {
  return `/${prefix}.json?icons=${names.map(encodeURIComponent).join(",")}`;
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let lastError: unknown;
  for (const host of iconHosts) {
    try {
      const response = await fetch(host + path, { signal });
      if (response.ok) return (await response.json()) as T;
      lastError = new Error(`Iconify respondeu ${response.status}`);
    } catch (error) {
      if ((error as Error).name === "AbortError") throw error;
      lastError = error;
    }
  }
  throw lastError;
}

/** Busca ícones e mantém apenas coleções cuja licença dispensa atribuição. */
export async function searchIcons(query: string, signal?: AbortSignal): Promise<IconResult[]> {
  const data = await fetchJson<SearchResponse>(searchPath(query), signal);

  const results: IconResult[] = [];
  for (const id of data.icons ?? []) {
    const separator = id.indexOf(":");
    const prefix = id.slice(0, separator);
    const info = data.collections?.[prefix];
    if (!info || !isAttributionFree(info.license?.spdx)) continue;
    results.push({
      id,
      prefix,
      name: id.slice(separator + 1),
      collection: info.name,
      license: info.license?.title ?? info.license?.spdx ?? "",
      palette: info.palette === true,
    });
  }
  return results;
}

/** Agrupa por coleção para pedir vários ícones por requisição (um pedido por SVG estoura o limite da API). */
export function batchByPrefix(icons: IconResult[]): { prefix: string; names: string[] }[] {
  const batches: { prefix: string; names: string[] }[] = [];
  const open = new Map<string, { prefix: string; names: string[]; length: number }>();
  for (const { prefix, name } of icons) {
    let batch = open.get(prefix);
    if (!batch || batch.length + name.length + 1 > MAX_ICONS_QUERY_LENGTH) {
      batch = { prefix, names: [], length: 0 };
      open.set(prefix, batch);
      batches.push(batch);
    }
    batch.names.push(name);
    batch.length += name.length + 1;
  }
  return batches.map(({ prefix, names }) => ({ prefix, names }));
}

/** Baixa os dados vetoriais dos ícones; ícones que falharem simplesmente ficam fora do mapa. */
export async function fetchIconData(
  icons: IconResult[],
  signal?: AbortSignal,
): Promise<Map<string, IconifyIcon>> {
  const loaded = new Map<string, IconifyIcon>();
  const queue = batchByPrefix(icons);

  async function worker(): Promise<void> {
    for (let batch = queue.shift(); batch; batch = queue.shift()) {
      try {
        const json = await fetchJson<IconifyJSON>(iconDataPath(batch.prefix, batch.names), signal);
        for (const name of batch.names) {
          const data = getIconData(json, name);
          if (data) loaded.set(`${batch.prefix}:${name}`, data);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") throw error;
      }
    }
  }

  await Promise.all(Array.from({ length: MAX_PARALLEL_REQUESTS }, worker));
  return loaded;
}

/** Monta o SVG final. `color` substitui `currentColor`, que PowerPoint/Photoshop não resolvem. */
export function buildSvg(data: IconifyIcon, options: SvgOptions = {}): string {
  const { attributes, body } = iconToSVG(data, { height: options.height ?? "auto" });
  const svg = iconToHTML(replaceIDs(body), attributes);
  return options.color ? svg.split("currentColor").join(options.color) : svg;
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

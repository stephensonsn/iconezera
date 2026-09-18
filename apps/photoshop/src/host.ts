/** O que o painel precisa do aplicativo hospedeiro. Implementado pelo Photoshop e por um simulador de navegador. */
export interface Host {
  /** Locale da interface do host, ex.: "pt_BR". */
  uiLocale(): string;
  /** Cor de primeiro plano em hex (#rrggbb) — cor que o ícone recebe. */
  foregroundColor(): string;
  /** Texto da camada de texto ativa, ou "" se não houver. */
  selectedText(): Promise<string>;
  /** Chamado quando a seleção de camadas muda. */
  onSelectionChanged(handler: () => void): void;
  /** Insere o SVG (já dimensionado em `sizePx`) no documento ativo e garante esse tamanho em pixels. */
  insertSvg(svg: string, sizePx: number): Promise<"inserted" | "copied">;
  /** true quando não há documento aberto. */
  hasDocument(): boolean;
}

export class NoDocumentError extends Error {}

/**
 * Módulos nativos do UXP (`photoshop`, `uxp`) só existem dentro do host e chegam por `require`.
 * Lidos de `globalThis` em runtime para o bundler não tentar resolvê-los.
 */
export function hostModule<T>(name: "photoshop" | "uxp"): T | undefined {
  const uxpRequire = (globalThis as { require?: (module: string) => unknown }).require;
  try {
    return uxpRequire?.(name) as T | undefined;
  } catch {
    return undefined;
  }
}

function isPhotoshop(): boolean {
  return Boolean(hostModule<{ host?: unknown }>("uxp")?.host);
}

export async function loadHost(): Promise<Host> {
  if (isPhotoshop()) return (await import("./host-photoshop")).photoshopHost();
  return (await import("./host-browser")).browserHost();
}

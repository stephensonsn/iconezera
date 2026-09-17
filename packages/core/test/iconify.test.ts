import { afterEach, describe, expect, it, vi } from "vitest";
import {
  batchByPrefix,
  configureIconHosts,
  buildSvg,
  fetchIconData,
  iconDataPath,
  searchIcons,
  searchPath,
  type IconResult,
} from "../src/iconify";
import { isAttributionFree } from "../src/licenses";

const searchPayload = {
  icons: ["mdi:home", "fa:home", "noto:house", "ghost:home"],
  collections: {
    mdi: { name: "Material Design Icons", license: { title: "Apache 2.0", spdx: "Apache-2.0" } },
    fa: { name: "Font Awesome 4", license: { title: "CC BY 4.0", spdx: "CC-BY-4.0" } },
    noto: { name: "Noto Emoji", palette: true, license: { title: "Apache 2.0", spdx: "Apache-2.0" } },
  },
};

const mdiPayload = {
  prefix: "mdi",
  width: 24,
  height: 24,
  icons: { home: { body: '<path fill="currentColor" d="M0 0h24v24z"/>' } },
  aliases: { house: { parent: "home" } },
  not_found: ["nope"],
};

const icon = (id: string): IconResult => {
  const [prefix, name] = id.split(":");
  return { id, prefix, name, collection: "", license: "", palette: false };
};

function mockFetch(...responses: { body?: unknown; status?: number }[]) {
  const fn = vi.fn();
  for (const { body = {}, status = 200 } of responses) {
    fn.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body });
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("licenses", () => {
  it("aceita só licenças sem atribuição", () => {
    expect(isAttributionFree("MIT")).toBe(true);
    expect(isAttributionFree("CC-BY-4.0")).toBe(false);
    expect(isAttributionFree("GPL-3.0")).toBe(false);
    expect(isAttributionFree(undefined)).toBe(false);
  });
});

describe("paths", () => {
  it("busca", () => {
    expect(searchPath("credit card")).toBe("/search?query=credit+card&limit=999");
  });
  it("dados de ícones em lote", () => {
    expect(iconDataPath("mdi", ["home", "account"])).toBe("/mdi.json?icons=home,account");
  });
});

describe("searchIcons", () => {
  it("filtra coleções com atribuição e coleções desconhecidas", async () => {
    mockFetch({ body: searchPayload });
    const icons = await searchIcons("home");
    expect(icons.map((result) => result.id)).toEqual(["mdi:home", "noto:house"]);
    expect(icons[0]).toMatchObject({ prefix: "mdi", name: "home", license: "Apache 2.0", palette: false });
    expect(icons[1].palette).toBe(true);
  });
  it("cai para o espelho quando o host principal limita (429)", async () => {
    const fetchMock = mockFetch({ status: 429 }, { body: searchPayload });
    expect(await searchIcons("home")).toHaveLength(2);
    expect(fetchMock.mock.calls.map(([url]) => new URL(url).host)).toEqual([
      "api.iconify.design",
      "api.simplesvg.com",
    ]);
  });
  it("lança erro quando todos os hosts falham", async () => {
    mockFetch({ status: 503 }, { status: 503 }, { status: 503 });
    await expect(searchIcons("home")).rejects.toThrow("503");
  });
});

describe("batchByPrefix", () => {
  it("uma requisição por coleção", () => {
    expect(batchByPrefix([icon("mdi:home"), icon("tabler:home"), icon("mdi:account")])).toEqual([
      { prefix: "mdi", names: ["home", "account"] },
      { prefix: "tabler", names: ["home"] },
    ]);
  });
  it("quebra lotes grandes para não estourar a URL", () => {
    const many = Array.from({ length: 100 }, (_, index) => icon(`mdi:some-long-icon-name-${index}`));
    const batches = batchByPrefix(many);
    expect(batches.length).toBeGreaterThan(1);
    expect(batches.flatMap((batch) => batch.names)).toHaveLength(100);
  });
});

describe("fetchIconData", () => {
  it("resolve ícones e aliases, ignora os não encontrados", async () => {
    const fetchMock = mockFetch({ body: mdiPayload });
    const data = await fetchIconData([icon("mdi:home"), icon("mdi:house"), icon("mdi:nope")]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect([...data.keys()]).toEqual(["mdi:home", "mdi:house"]);
    expect(data.get("mdi:house")?.body).toContain("M0 0h24v24z");
  });
});

describe("buildSvg", () => {
  const data = { body: '<path fill="currentColor" d="M0 0h24v24z"/>', width: 24, height: 24 };
  it("aplica cor e altura", () => {
    const svg = buildSvg(data, { color: "#000000", height: 256 });
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('height="256"');
    expect(svg).toContain('fill="#000000"');
    expect(svg).not.toContain("currentColor");
  });
  it("sem cor mantém o original", () => {
    expect(buildSvg(data)).toContain("currentColor");
  });
});

describe("configureIconHosts", () => {
  afterEach(() =>
    configureIconHosts(["https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"]),
  );
  it("usa os hosts configurados", async () => {
    configureIconHosts(["https://icons.example.com/"]);
    const fetchMock = mockFetch({ body: searchPayload });
    await searchIcons("home");
    expect(new URL(fetchMock.mock.calls[0][0]).origin).toBe("https://icons.example.com");
  });
  it("rejeita host inseguro ou malformado", () => {
    for (const bad of [["http://icons.example.com"], ["https://user:pw@example.com"], ["https://example.com/path"], ["javascript:alert(1)"], [], "https://example.com"]) {
      expect(() => configureIconHosts(bad)).toThrow();
    }
  });
});

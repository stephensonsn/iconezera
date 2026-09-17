import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveLanguage } from "../src/languages";
import { translateQuery, type TranslationCache } from "../src/translate";

function mockMyMemory(translatedText: string, extra: Record<string, unknown> = {}) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ responseStatus: 200, responseData: { translatedText }, ...extra }),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function memoryCache(): TranslationCache & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return { store, get: (key) => store.get(key), set: (key, value) => void store.set(key, value) };
}

afterEach(() => vi.unstubAllGlobals());

describe("resolveLanguage", () => {
  it("mapeia locales do Office", () => {
    expect(resolveLanguage("pt-BR").code).toBe("pt");
    expect(resolveLanguage("es-MX").code).toBe("es");
    expect(resolveLanguage("zh-TW").code).toBe("zh-TW");
    expect(resolveLanguage("zh-Hans-CN").code).toBe("zh-CN");
    expect(resolveLanguage("no").code).toBe("nb");
  });
  it("aceita idioma fora da lista curada", () => {
    expect(resolveLanguage("bg-BG")).toEqual({ code: "bg", name: "BG" });
  });
  it("cai para inglês em locale inválido", () => {
    expect(resolveLanguage(undefined).code).toBe("en");
    expect(resolveLanguage("??").code).toBe("en");
  });
});

describe("translateQuery", () => {
  it("inglês não traduz nem chama a rede", async () => {
    const fetchMock = mockMyMemory("x");
    expect(await translateQuery("  Rocket ", "en")).toEqual({ query: "rocket", translated: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("português coberto pelo dicionário não chama a rede", async () => {
    const fetchMock = mockMyMemory("x");
    expect(await translateQuery("Cartão de crédito", "pt")).toEqual({ query: "credit card", translated: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("português fora do dicionário usa o tradutor online", async () => {
    mockMyMemory("Wheelbarrow.");
    expect(await translateQuery("carriola", "pt")).toEqual({ query: "wheelbarrow", translated: true });
  });
  it("outros idiomas vão ao tradutor sem remover marcas do texto", async () => {
    const fetchMock = mockMyMemory("key");
    await translateQuery("かぎ", "ja");
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("q")).toBe("かぎ");
    expect(url.searchParams.get("langpair")).toBe("ja|en");
  });
  it("usa e alimenta o cache", async () => {
    const cache = memoryCache();
    const fetchMock = mockMyMemory("umbrella");
    await translateQuery("parapluie", "fr", { cache });
    await translateQuery("parapluie", "fr", { cache });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cache.store.get("fr:parapluie")).toBe("umbrella");
  });
  it("cota esgotada ou falha de rede: segue com o melhor resultado local", async () => {
    mockMyMemory("MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS", { quotaFinished: true });
    expect(await translateQuery("casa carriola", "pt")).toEqual({ query: "home carriola", translated: true });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    expect(await translateQuery("parapluie", "fr")).toEqual({ query: "parapluie", translated: false });
  });
  it("propaga cancelamento", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(new Error("x"), { name: "AbortError" })));
    await expect(translateQuery("parapluie", "fr")).rejects.toThrow();
  });
});

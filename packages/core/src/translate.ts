import dictionary from "./dictionary.pt.json";
import { parseHttpsOrigin } from "./iconify";

const DICTIONARY = dictionary as Record<string, string>;

export interface Translation {
  /** Termo enviado à API. */
  query: string;
  /** true quando algum termo foi traduzido do português. */
  translated: boolean;
}

/** minúsculas, sem acentos, espaços colapsados */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function lookup(term: string): string | undefined {
  if (term in DICTIONARY) return DICTIONARY[term];
  // plural simples: "casas" → "casa", "flores" → "flor"
  if (term.endsWith("es") && term.slice(0, -2) in DICTIONARY) return DICTIONARY[term.slice(0, -2)];
  if (term.endsWith("s") && term.slice(0, -1) in DICTIONARY) return DICTIONARY[term.slice(0, -1)];
  return undefined;
}

const STOPWORDS = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "para", "com", "em"]);

interface DictionaryResult extends Translation {
  /** true quando todos os termos relevantes estavam no dicionário. */
  complete: boolean;
}

/** Traduz PT→EN pelo dicionário embutido; o que não for encontrado segue como foi digitado. */
export function translate(input: string): Translation {
  const { query, translated } = translateWithDictionary(input);
  return { query, translated };
}

function translateWithDictionary(input: string): DictionaryResult {
  const normalized = normalize(input);
  if (!normalized) return { query: "", translated: false, complete: true };

  const whole = lookup(normalized);
  if (whole) return { query: whole, translated: whole !== normalized, complete: true };

  let translated = false;
  let complete = true;
  const words = normalized
    .split(" ")
    .filter((word, _, all) => all.length === 1 || !STOPWORDS.has(word))
    .map((word) => {
      const hit = lookup(word);
      if (hit && hit !== word) translated = true;
      if (!hit) complete = false;
      return hit ?? word;
    });
  return { query: words.join(" "), translated, complete };
}

let translationHost = "https://api.mymemory.translated.net";
const MAX_QUERY_LENGTH = 80;

/** Troca o servidor de tradução (API compatível com o MyMemory). */
export function configureTranslationHost(host: unknown): void {
  translationHost = parseHttpsOrigin(host);
}

/** Cache opcional de traduções (ex.: localStorage) para não repetir chamadas ao tradutor online. */
export interface TranslationCache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

export interface TranslateOptions {
  signal?: AbortSignal;
  cache?: TranslationCache;
}

interface MyMemoryResponse {
  responseStatus?: number | string;
  quotaFinished?: boolean;
  responseData?: { translatedText?: string };
}

async function translateOnline(text: string, language: string, signal?: AbortSignal): Promise<string> {
  const params = new URLSearchParams({ q: text, langpair: `${language}|en` });
  const response = await fetch(`${translationHost}/get?${params}`, { signal });
  if (!response.ok) throw new Error(`MyMemory respondeu ${response.status}`);
  const data = (await response.json()) as MyMemoryResponse;
  const translatedText = data.responseData?.translatedText ?? "";
  // cota esgotada e erros chegam como texto "traduzido" em maiúsculas
  if (Number(data.responseStatus) !== 200 || data.quotaFinished || !translatedText || /MYMEMORY WARNING|INVALID|QUERY LENGTH/.test(translatedText)) {
    throw new Error("MyMemory não traduziu");
  }
  // resposta de terceiro: só texto curto segue adiante
  return translatedText.toLowerCase().replace(/[.!?。…]+$/u, "").trim().slice(0, MAX_QUERY_LENGTH);
}

/**
 * Traduz a busca do idioma do usuário para inglês (idioma do índice do Iconify).
 * Português usa o dicionário embutido; o que ele não cobre e os demais idiomas vão ao tradutor online.
 * Se o tradutor falhar, a busca segue com o melhor resultado local — nunca lança (exceto cancelamento).
 */
export async function translateQuery(
  input: string,
  language: string,
  options: TranslateOptions = {},
): Promise<Translation> {
  // Sem `normalize` aqui: remover marcas NFD corrompe japonês, hindi, árabe etc.
  const text = input.trim().replace(/\s+/g, " ").toLowerCase().slice(0, MAX_QUERY_LENGTH);
  if (!text || language === "en") return { query: text, translated: false };

  let fallback: Translation = { query: text, translated: false };
  if (language === "pt") {
    const local = translateWithDictionary(text);
    if (local.complete) return { query: local.query, translated: local.translated };
    fallback = { query: local.query, translated: local.translated };
  }

  const cacheKey = `${language}:${text}`;
  const cached = options.cache?.get(cacheKey);
  if (cached) return { query: cached, translated: cached !== text };

  try {
    const query = await translateOnline(text, language, options.signal);
    options.cache?.set(cacheKey, query);
    return { query, translated: query !== text };
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    return fallback;
  }
}

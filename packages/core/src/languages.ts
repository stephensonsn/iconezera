export interface Language {
  /** Código aceito pelo MyMemory em `langpair`. */
  code: string;
  /** Nome no próprio idioma, como aparece no seletor. */
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: "pt", name: "Português" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "sv", name: "Svenska" },
  { code: "da", name: "Dansk" },
  { code: "nb", name: "Norsk" },
  { code: "fi", name: "Suomi" },
  { code: "cs", name: "Čeština" },
  { code: "ro", name: "Română" },
  { code: "hu", name: "Magyar" },
  { code: "el", name: "Ελληνικά" },
  { code: "tr", name: "Türkçe" },
  { code: "ru", name: "Русский" },
  { code: "uk", name: "Українська" },
  { code: "ar", name: "العربية" },
  { code: "he", name: "עברית" },
  { code: "hi", name: "हिन्दी" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "th", name: "ไทย" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh-CN", name: "简体中文" },
  { code: "zh-TW", name: "繁體中文" },
];

/**
 * Converte um locale do Office/navegador ("pt-BR", "zh-Hant-TW", "no") em um idioma de busca.
 * Locales fora da lista curada são aceitos mesmo assim (o tradutor online cobre), usando o código base.
 */
export function resolveLanguage(locale: string | undefined): Language {
  const [base = "", ...rest] = (locale ?? "").toLowerCase().split(/[-_]/);
  if (!/^[a-z]{2,3}$/.test(base)) return LANGUAGES.find((language) => language.code === "en")!;

  let code = base;
  if (base === "zh") code = rest.some((part) => ["tw", "hk", "mo", "hant"].includes(part)) ? "zh-TW" : "zh-CN";
  if (base === "no" || base === "nn") code = "nb";

  return LANGUAGES.find((language) => language.code === code) ?? { code, name: code.toUpperCase() };
}

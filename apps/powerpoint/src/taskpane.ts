import {
  buildSvg,
  configureIconHosts,
  configureTranslationHost,
  fetchIconData,
  LANGUAGES,
  resolveLanguage,
  searchIcons,
  setUiLanguage,
  suggestions,
  svgDataUri,
  t,
  translateQuery,
  type IconResult,
  type Language,
  type TranslationCache,
} from "@iconezera/core";
import type { IconifyIcon } from "@iconify/types";
import services from "../../../services.json";
import { getSelectedText, insertSvg, isOfficeDark, onSelectionChanged, waitForOffice } from "./office";

const PAGE_SIZE = 60;
const INSERT_COLOR = "#000000"; // PowerPoint não resolve `currentColor`
const INSERT_HEIGHT = 256;
const PREVIEW_COLOR = "#242424"; // no tema escuro o CSS inverte a miniatura
const MAX_SELECTION_WORDS = 3;
const SKELETON_CELLS = 15;
const LANGUAGE_KEY = "iconezera.language";
const TRANSLATION_KEY = "iconezera.translation.";

const form = document.querySelector<HTMLFormElement>("#search-form")!;
const input = document.querySelector<HTMLInputElement>("#search-input")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const grid = document.querySelector<HTMLUListElement>("#grid")!;
const more = document.querySelector<HTMLButtonElement>("#more")!;
const loader = document.querySelector<HTMLDivElement>("#loader")!;
const toast = document.querySelector<HTMLDivElement>("#toast")!;
const searchButton = document.querySelector<HTMLButtonElement>("#search-button")!;
const footer = document.querySelector<HTMLElement>("#footer")!;
const languageButton = document.querySelector<HTMLButtonElement>("#language-button")!;
const languageCode = document.querySelector<HTMLSpanElement>("#language-code")!;
const languageMenu = document.querySelector<HTMLDivElement>("#language-menu")!;
const languageList = document.querySelector<HTMLUListElement>("#language-list")!;
const languageHint = document.querySelector<HTMLSpanElement>("#language-hint")!;
const suggestionsSection = document.querySelector<HTMLElement>("#suggestions")!;
const suggestionsTitle = document.querySelector<HTMLHeadingElement>("#suggestions-title")!;
const suggestionList = document.querySelector<HTMLUListElement>("#suggestion-list")!;

configureIconHosts(services.iconHosts);
configureTranslationHost(services.translationHost);

loader.replaceChildren(
  ...Array.from({ length: SKELETON_CELLS }, (_, index) => {
    const cell = document.createElement("span");
    cell.style.setProperty("--i", String(index));
    return cell;
  }),
);

let inOffice = false;
let results: IconResult[] = [];
let shown = 0;
let pending: AbortController | undefined;
let toastTimer: number | undefined;
let language: Language = resolveLanguage(navigator.language);

// localStorage pode estar bloqueado no webview do Office; sem ele só se perde o cache.
function readStorage(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignorado de propósito
  }
}

const translationCache: TranslationCache = {
  get: (key) => readStorage(TRANSLATION_KEY + key),
  set: (key, value) => writeStorage(TRANSLATION_KEY + key, value),
};

function renderLanguageList(): void {
  const options = LANGUAGES.some(({ code }) => code === language.code) ? LANGUAGES : [language, ...LANGUAGES];
  languageList.replaceChildren(
    ...options.map((option) => {
      const item = document.createElement("li");
      item.role = "option";
      item.tabIndex = 0;
      item.lang = option.code;
      item.textContent = option.name;
      item.setAttribute("aria-selected", String(option.code === language.code));
      const choose = () => {
        toggleLanguageMenu(false);
        if (option.code === language.code) return;
        writeStorage(LANGUAGE_KEY, option.code);
        applyLanguage(option);
        if (input.value.trim()) void search(input.value);
      };
      item.addEventListener("click", choose);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") choose();
      });
      return item;
    }),
  );
}

function applyLanguage(next: Language): void {
  language = next;
  document.documentElement.lang = setUiLanguage(next.code);

  input.placeholder = t("searchPlaceholder");
  input.setAttribute("aria-label", t("searchLabel"));
  searchButton.setAttribute("aria-label", t("searchButton"));
  searchButton.title = t("searchButton");
  grid.setAttribute("aria-label", t("results"));
  loader.setAttribute("aria-label", t("loading"));
  more.textContent = t("loadMore");
  languageButton.title = t("language");
  languageButton.setAttribute("aria-label", `${t("language")}: ${next.name}`);
  languageCode.textContent = next.code.slice(0, 2);
  languageHint.textContent = t("languageHint");

  const [before, after] = t("footer").split("{iconify}");
  const link = document.createElement("a");
  link.href = "https://iconify.design";
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Iconify";
  footer.replaceChildren(before, link, after);

  suggestionsTitle.textContent = t("suggestionsTitle");
  suggestionList.replaceChildren(
    ...suggestions().terms.map((term) => {
      const item = document.createElement("li");
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = term;
      chip.addEventListener("click", () => {
        input.value = term;
        void search(term, suggestions().language);
      });
      item.append(chip);
      return item;
    }),
  );

  setStatus("");
  renderLanguageList();
}

function toggleLanguageMenu(open: boolean): void {
  languageMenu.hidden = !open;
  languageButton.setAttribute("aria-expanded", String(open));
}

function setStatus(message: string, isError = false): void {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function showToast(message: string, isError = false): void {
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.hidden = true), 2500);
}

async function renderNextPage(): Promise<void> {
  const signal = pending?.signal;
  const page = results.slice(shown, shown + PAGE_SIZE);
  shown += page.length;
  more.hidden = true;
  loader.hidden = false;

  let data: Map<string, IconifyIcon>;
  try {
    data = await fetchIconData(page, signal);
  } catch {
    return; // busca substituída por outra
  }
  if (signal?.aborted) return; // a nova busca controla o loader

  const fragment = document.createDocumentFragment();
  let index = 0;
  for (const icon of page) {
    const iconData = data.get(icon.id);
    if (!iconData) continue;
    const item = document.createElement("li");
    item.style.setProperty("--i", String(index++));
    const button = document.createElement("button");
    button.type = "button";
    button.classList.toggle("palette", icon.palette);
    button.title = `${icon.name} — ${icon.collection} (${icon.license})`;
    button.setAttribute("aria-label", t("insertIcon", { name: icon.name }));
    // <img> com data URI: o SVG de terceiros nunca é interpretado como HTML do painel
    const image = document.createElement("img");
    image.alt = "";
    image.src = svgDataUri(buildSvg(iconData, { color: PREVIEW_COLOR }));
    button.append(image);
    button.addEventListener("click", () => void insert(icon, iconData, button));
    item.append(button);
    fragment.append(item);
  }
  grid.append(fragment);
  loader.hidden = true;
  more.hidden = shown >= results.length;
  if (grid.childElementCount === 0 && more.hidden) {
    setStatus(t("loadError"), true);
  }
}

async function search(term: string, from = language.code): Promise<void> {
  if (!term.trim()) return;
  suggestionsSection.hidden = true;

  pending?.abort();
  const { signal } = (pending = new AbortController());
  grid.replaceChildren();
  more.hidden = true;
  loader.hidden = false;
  setStatus(t("searching"));

  let query: string;
  let translated: boolean;
  try {
    ({ query, translated } = await translateQuery(term, from, { signal, cache: translationCache }));
    results = await searchIcons(query, signal);
  } catch (error) {
    if ((error as Error).name === "AbortError") return;
    loader.hidden = true;
    setStatus(t("searchError"), true);
    return;
  }

  shown = 0;
  if (results.length === 0) {
    loader.hidden = true;
    setStatus(translated ? t("emptyFor", { query }) : t("empty"));
    return;
  }
  const count = results.length;
  setStatus(translated ? t("countFor", { count, query }) : t("count", { count }));
  await renderNextPage();
}

async function insert(icon: IconResult, data: IconifyIcon, button: HTMLButtonElement): Promise<void> {
  button.setAttribute("aria-busy", "true");
  try {
    const svg = buildSvg(data, { color: icon.palette ? undefined : INSERT_COLOR, height: INSERT_HEIGHT });
    if (inOffice) {
      const format = await insertSvg(svg);
      showToast(t(format === "svg" ? "inserted" : "insertedPng"));
    } else {
      await navigator.clipboard.writeText(svg);
      showToast(t("copied"));
    }
  } catch {
    showToast(t("insertError"), true);
  } finally {
    button.removeAttribute("aria-busy");
  }
}

async function searchFromSelection(): Promise<void> {
  const text = await getSelectedText();
  if (!text || text.split(/\s+/).length > MAX_SELECTION_WORDS || text === input.value) return;
  input.value = text;
  await search(text);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void search(input.value);
});
// Alguns webviews do Office não disparam o submit implícito do Enter.
input.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  void search(input.value);
});
more.addEventListener("click", () => void renderNextPage());

languageButton.addEventListener("click", () => toggleLanguageMenu(languageMenu.hidden));
document.addEventListener("click", (event) => {
  if (!(event.target as Element).closest(".language")) toggleLanguageMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") toggleLanguageMenu(false);
});

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

/** Tema do Office quando disponível; senão, o do sistema. */
function applyTheme(): void {
  const dark = (inOffice ? isOfficeDark() : undefined) ?? systemDark.matches;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

systemDark.addEventListener("change", applyTheme);
applyTheme();
applyLanguage(resolveLanguage(readStorage(LANGUAGE_KEY) ?? navigator.language));

void waitForOffice().then((ready) => {
  inOffice = ready;
  if (!ready) return;
  applyTheme();
  // escolha salva do usuário > idioma da instalação do Office
  if (!readStorage(LANGUAGE_KEY)) applyLanguage(resolveLanguage(Office.context.displayLanguage));
  void searchFromSelection();
  let debounce: number | undefined;
  onSelectionChanged(() => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => void searchFromSelection(), 400);
  });
});

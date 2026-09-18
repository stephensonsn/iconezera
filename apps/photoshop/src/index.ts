import "./styles.css";
import {
  LANGUAGES,
  buildSvg,
  configureIconHosts,
  configureTranslationHost,
  fetchIconData,
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
import { NoDocumentError, loadHost, type Host } from "./host";

const PAGE_SIZE = 60;
const SKELETON_CELLS = 15;
const INSERT_HEIGHT = 512; // tamanho nominal do SVG; o host reescala para a fração do documento
const INSERT_SIZE_RATIO = 0.25;
const MAX_SELECTION_WORDS = 3;
const LANGUAGE_KEY = "iconezera.language";
const TRANSLATION_KEY = "iconezera.translation.";

configureIconHosts(__ICONEZERA_SERVICES__.iconHosts);
configureTranslationHost(__ICONEZERA_SERVICES__.translationHost);

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const input = $<HTMLInputElement>("#search-input");
const searchButton = $<HTMLButtonElement>("#search-button");
const status = $("#status");
const grid = $("#grid");
const loader = $("#loader");
const more = $<HTMLButtonElement>("#more");
const toast = $("#toast");
const footer = $("#footer");
const languageButton = $<HTMLButtonElement>("#language-button");
const languageCode = $("#language-code");
const languageMenu = $("#language-menu");
const languageList = $("#language-list");
const languageHint = $("#language-hint");
const suggestionsSection = $("#suggestions");
const suggestionsTitle = $("#suggestions-title");
const suggestionList = $("#suggestion-list");

let host: Host;
let language: Language = resolveLanguage("en");
let results: IconResult[] = [];
let shown = 0;
let pending: AbortController | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

// localStorage pode não existir em algumas versões do UXP; sem ele só se perde o cache.
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

function setStatus(message: string, isError = false): void {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function showToast(message: string, isError = false): void {
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2500);
}

/** Miniaturas na cor do texto do painel, para funcionar em qualquer tema do Photoshop. */
function previewColor(): string {
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(document.body).color ?? "");
  if (!match) return "#cccccc";
  return "#" + match.slice(1, 4).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("");
}

function toggleLanguageMenu(open: boolean): void {
  languageMenu.hidden = !open;
}

function renderLanguageList(): void {
  const options = LANGUAGES.some(({ code }) => code === language.code) ? LANGUAGES : [language, ...LANGUAGES];
  languageList.replaceChildren(
    ...options.map((option) => {
      const item = document.createElement("div");
      item.className = "language-item" + (option.code === language.code ? " selected" : "");
      const check = document.createElement("span");
      check.className = "check";
      check.textContent = option.code === language.code ? "✓" : "";
      item.append(check, option.name);
      item.addEventListener("click", () => {
        toggleLanguageMenu(false);
        if (option.code === language.code) return;
        writeStorage(LANGUAGE_KEY, option.code);
        applyLanguage(option);
        if (input.value.trim()) void search(input.value);
      });
      return item;
    }),
  );
}

function applyLanguage(next: Language): void {
  language = next;
  setUiLanguage(next.code);

  input.placeholder = t("searchPlaceholder");
  searchButton.textContent = t("searchButton");
  more.textContent = t("loadMore");
  languageButton.title = t("language");
  languageCode.textContent = next.code.slice(0, 2);
  languageHint.textContent = t("languageHint");

  const [before, after] = t("footer").split("{iconify}");
  const link = document.createElement("a");
  link.href = "https://iconify.design";
  link.textContent = "Iconify";
  footer.replaceChildren(before, link, after);

  suggestionsTitle.textContent = t("suggestionsTitle");
  suggestionList.replaceChildren(
    ...suggestions().terms.map((term) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = term;
      chip.addEventListener("click", () => {
        input.value = term;
        void search(term, suggestions().language);
      });
      return chip;
    }),
  );

  setStatus("");
  renderLanguageList();
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
    return;
  }
  if (signal?.aborted) return;

  const color = previewColor();
  const fragment = document.createDocumentFragment();
  for (const icon of page) {
    const iconData = data.get(icon.id);
    if (!iconData) continue;
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.title = `${icon.name} — ${icon.collection} (${icon.license})`;
    const image = document.createElement("img");
    image.src = svgDataUri(buildSvg(iconData, { color: icon.palette ? undefined : color, height: 64 }));
    cell.append(image);
    cell.addEventListener("click", () => void insert(icon, iconData, cell));
    fragment.append(cell);
  }
  grid.append(fragment);
  loader.hidden = true;
  more.hidden = shown >= results.length;
  if (grid.childElementCount === 0 && more.hidden) setStatus(t("loadError"), true);
}

async function search(term: string, from = language.code): Promise<void> {
  if (!term.trim()) return;
  suggestionsSection.hidden = true;
  toggleLanguageMenu(false);

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

async function insert(icon: IconResult, data: IconifyIcon, cell: HTMLElement): Promise<void> {
  cell.classList.add("busy");
  try {
    const color = icon.palette ? undefined : host.foregroundColor();
    const svg = buildSvg(data, { color, height: INSERT_HEIGHT });
    const outcome = await host.insertSvg(svg, INSERT_SIZE_RATIO);
    showToast(t(outcome === "inserted" ? "insertedLayer" : "copied"));
  } catch (error) {
    showToast(t(error instanceof NoDocumentError ? "insertErrorNoDocument" : "insertErrorLayer"), true);
  } finally {
    cell.classList.remove("busy");
  }
}

async function searchFromSelection(): Promise<void> {
  const text = (await host.selectedText()).trim();
  if (!text || text.split(/\s+/).length > MAX_SELECTION_WORDS || text === input.value) return;
  input.value = text;
  await search(text);
}

searchButton.addEventListener("click", () => void search(input.value));
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") void search(input.value);
});
more.addEventListener("click", () => void renderNextPage());
languageButton.addEventListener("click", () => toggleLanguageMenu(languageMenu.hidden));

loader.replaceChildren(
  ...Array.from({ length: SKELETON_CELLS }, () => {
    const cell = document.createElement("div");
    cell.className = "skeleton";
    return cell;
  }),
);

void loadHost().then((loaded) => {
  host = loaded;
  applyLanguage(resolveLanguage(readStorage(LANGUAGE_KEY) ?? host.uiLocale()));
  void searchFromSelection();
  let debounce: ReturnType<typeof setTimeout> | undefined;
  host.onSelectionChanged(() => {
    clearTimeout(debounce);
    debounce = setTimeout(() => void searchFromSelection(), 400);
  });
});

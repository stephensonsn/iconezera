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
const DEFAULT_SIZE = 256;
const DEFAULT_COLOR = "#000000";
const FOREGROUND = "foreground"; // usa a cor de primeiro plano do Photoshop na hora de inserir
const SWATCHES = ["#000000", "#ffffff", "#808080", "#1473e6", "#e34850", "#2d9d78", "#f5a623"];
const MAX_SELECTION_WORDS = 3;
const LANGUAGE_KEY = "iconezera.language";
const COLOR_KEY = "iconezera.color";
const SIZE_KEY = "iconezera.size";
const ZOOM_KEY = "iconezera.zoom";
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
const colorLabel = $("#color-label");
const sizeLabel = $("#size-label");
const zoomLabel = $("#zoom-label");
const swatchForeground = $<HTMLButtonElement>("#swatch-foreground");
const swatches = $("#swatches");
const colorInput = $<HTMLInputElement>("#color-input");
const sizeInput = $<HTMLInputElement>("#size-input");
const zoomButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".zoom"));

let host: Host;
let language: Language = resolveLanguage("en");
let results: IconResult[] = [];
let shown = 0;
let pending: AbortController | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let color = DEFAULT_COLOR; // hex ou FOREGROUND
let size = DEFAULT_SIZE;

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

function isValidHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function isLight(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

/** Cor efetiva de inserção/miniatura: a escolhida, ou a de primeiro plano do Photoshop. */
function effectiveColor(): string {
  return color === FOREGROUND ? host.foregroundColor() : color;
}

function applyColorUi(): void {
  swatchForeground.classList.toggle("selected", color === FOREGROUND);
  swatchForeground.style.background = host.foregroundColor();
  for (const swatch of Array.from(swatches.children) as HTMLElement[]) {
    swatch.classList.toggle("selected", swatch.dataset.color === color);
  }
  colorInput.value = color === FOREGROUND ? "" : color;
  const preview = effectiveColor();
  const dark = isLight(preview);
  for (const cell of Array.from(grid.querySelectorAll<HTMLElement>(".cell"))) {
    cell.classList.toggle("dark", dark);
    const image = cell.querySelector("img");
    const iconData = cellData.get(cell);
    if (image && iconData && !cell.classList.contains("palette")) {
      image.src = svgDataUri(buildSvg(iconData, { color: preview, height: 64 }));
    }
  }
}

function setColor(next: string): void {
  color = next;
  writeStorage(COLOR_KEY, next);
  applyColorUi();
}

function setSize(next: number): void {
  size = Math.min(4096, Math.max(8, Math.round(next) || DEFAULT_SIZE));
  sizeInput.value = String(size);
  writeStorage(SIZE_KEY, String(size));
}

function setZoom(next: string): void {
  document.body.classList.remove("zoom-s", "zoom-l");
  if (next !== "m") document.body.classList.add(`zoom-${next}`);
  for (const button of zoomButtons) button.classList.toggle("selected", button.dataset.zoom === next);
  writeStorage(ZOOM_KEY, next);
}

const cellData = new WeakMap<HTMLElement, IconifyIcon>();

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
  colorLabel.textContent = t("colorLabel");
  sizeLabel.textContent = t("sizeLabel");
  zoomLabel.textContent = t("zoomLabel");
  swatchForeground.title = t("foregroundColor");
  colorInput.placeholder = "#000000";
  colorInput.title = t("customColor");

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

  const preview = effectiveColor();
  const dark = isLight(preview);
  const fragment = document.createDocumentFragment();
  for (const icon of page) {
    const iconData = data.get(icon.id);
    if (!iconData) continue;
    const cell = document.createElement("div");
    cell.className = "cell" + (dark ? " dark" : "") + (icon.palette ? " palette" : "");
    cell.title = `${icon.name} — ${icon.collection} (${icon.license})`;
    cellData.set(cell, iconData);
    const image = document.createElement("img");
    image.src = svgDataUri(buildSvg(iconData, { color: icon.palette ? undefined : preview, height: 64 }));
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
    const svg = buildSvg(data, { color: icon.palette ? undefined : effectiveColor(), height: size });
    const outcome = await host.insertSvg(svg, size);
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

swatches.replaceChildren(
  ...SWATCHES.map((hex) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "swatch";
    swatch.dataset.color = hex;
    swatch.title = hex;
    swatch.style.background = hex;
    swatch.addEventListener("click", () => setColor(hex));
    return swatch;
  }),
);
swatchForeground.addEventListener("click", () => setColor(FOREGROUND));
colorInput.addEventListener("change", () => {
  const value = colorInput.value.trim().toLowerCase();
  const hex = value.startsWith("#") ? value : `#${value}`;
  if (isValidHex(hex)) setColor(hex);
  else applyColorUi();
});
sizeInput.addEventListener("change", () => setSize(Number(sizeInput.value)));
for (const button of zoomButtons) button.addEventListener("click", () => setZoom(button.dataset.zoom ?? "m"));

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
  const savedColor = readStorage(COLOR_KEY);
  setColor(savedColor === FOREGROUND || (savedColor && isValidHex(savedColor)) ? savedColor : DEFAULT_COLOR);
  setSize(Number(readStorage(SIZE_KEY)) || DEFAULT_SIZE);
  setZoom(readStorage(ZOOM_KEY) ?? "m");
  void searchFromSelection();
  let debounce: ReturnType<typeof setTimeout> | undefined;
  host.onSelectionChanged(() => {
    clearTimeout(debounce);
    debounce = setTimeout(() => void searchFromSelection(), 400);
  });
});

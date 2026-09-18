const pt = {
  searchPlaceholder: "Buscar ícone… ex.: casa, foguete",
  searchLabel: "Buscar ícone",
  searchButton: "Buscar",
  results: "Resultados",
  loading: "Carregando ícones",
  loadMore: "Carregar mais",
  footer: "Ícones open source via {iconify} — só licenças que dispensam crédito.",
  language: "Idioma da busca",
  languageHint: "Quer um novo idioma? Contate-nos:",
  suggestionsTitle: "Experimente",
  searching: "Buscando…",
  searchError: "Não foi possível buscar agora. Verifique a conexão e tente de novo.",
  loadError: "Não foi possível carregar os ícones agora. Tente de novo em instantes.",
  count: "{count} ícones",
  countFor: "{count} ícones para “{query}”",
  empty: "Nenhum ícone encontrado. Tente outro termo.",
  emptyFor: "Nenhum ícone encontrado para “{query}”. Tente outro termo.",
  insertIcon: "Inserir {name}",
  inserted: "Ícone inserido no slide",
  insertedPng: "Inserido como imagem (PNG)",
  insertedLayer: "Ícone inserido como camada vetorial",
  copied: "SVG copiado (fora do aplicativo)",
  insertError: "Não foi possível inserir o ícone. Clique no slide e tente de novo.",
  insertErrorNoDocument: "Abra um documento no Photoshop para inserir o ícone.",
  insertErrorLayer: "Não foi possível inserir o ícone. Tente de novo.",
};

type Messages = typeof pt;
export type MessageKey = keyof Messages;

const en: Messages = {
  searchPlaceholder: "Search icons… e.g. home, rocket",
  searchLabel: "Search icons",
  searchButton: "Search",
  results: "Results",
  loading: "Loading icons",
  loadMore: "Load more",
  footer: "Open source icons via {iconify} — only licenses that need no attribution.",
  language: "Search language",
  languageHint: "Want a new language? Contact us:",
  suggestionsTitle: "Try",
  searching: "Searching…",
  searchError: "Couldn’t search right now. Check your connection and try again.",
  loadError: "Couldn’t load the icons right now. Try again in a moment.",
  count: "{count} icons",
  countFor: "{count} icons for “{query}”",
  empty: "No icons found. Try another term.",
  emptyFor: "No icons found for “{query}”. Try another term.",
  insertIcon: "Insert {name}",
  inserted: "Icon inserted into the slide",
  insertedPng: "Inserted as an image (PNG)",
  insertedLayer: "Icon inserted as a vector layer",
  copied: "SVG copied (outside the app)",
  insertError: "Couldn’t insert the icon. Click the slide and try again.",
  insertErrorNoDocument: "Open a document in Photoshop to insert the icon.",
  insertErrorLayer: "Couldn’t insert the icon. Try again.",
};

const es: Messages = {
  searchPlaceholder: "Buscar icono… ej.: casa, cohete",
  searchLabel: "Buscar icono",
  searchButton: "Buscar",
  results: "Resultados",
  loading: "Cargando iconos",
  loadMore: "Cargar más",
  footer: "Iconos open source vía {iconify} — solo licencias que no exigen atribución.",
  language: "Idioma de búsqueda",
  languageHint: "¿Quieres un nuevo idioma? Contáctanos:",
  suggestionsTitle: "Prueba",
  searching: "Buscando…",
  searchError: "No se pudo buscar ahora. Revisa la conexión e inténtalo de nuevo.",
  loadError: "No se pudieron cargar los iconos ahora. Inténtalo de nuevo en un momento.",
  count: "{count} iconos",
  countFor: "{count} iconos para “{query}”",
  empty: "No se encontraron iconos. Prueba con otro término.",
  emptyFor: "No se encontraron iconos para “{query}”. Prueba con otro término.",
  insertIcon: "Insertar {name}",
  inserted: "Icono insertado en la diapositiva",
  insertedPng: "Insertado como imagen (PNG)",
  insertedLayer: "Icono insertado como capa vectorial",
  copied: "SVG copiado (fuera de la aplicación)",
  insertError: "No se pudo insertar el icono. Haz clic en la diapositiva e inténtalo de nuevo.",
  insertErrorNoDocument: "Abre un documento en Photoshop para insertar el icono.",
  insertErrorLayer: "No se pudo insertar el icono. Inténtalo de nuevo.",
};

const MESSAGES: Record<string, Messages> = { pt, en, es };

const SUGGESTIONS: Record<string, string[]> = {
  pt: ["foguete", "coração", "gráfico", "equipe", "calendário", "dinheiro", "ideia", "seta"],
  en: ["rocket", "heart", "chart", "team", "calendar", "money", "idea", "arrow"],
  es: ["cohete", "corazón", "gráfico", "equipo", "calendario", "dinero", "idea", "flecha"],
};


let current: Messages = en;
let currentUi = "en";

/** Interface em PT, EN ou ES; qualquer outro idioma de busca usa a interface em inglês. */
export function setUiLanguage(code: string): string {
  const ui = code in MESSAGES ? code : "en";
  current = MESSAGES[ui];
  currentUi = ui;
  return ui;
}

export function t(key: MessageKey, values: Record<string, string | number> = {}): string {
  return current[key].replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}

/** Termos de exemplo no idioma da interface (o painel os busca no idioma correspondente). */
export function suggestions(): { language: string; terms: string[] } {
  return { language: currentUi, terms: SUGGESTIONS[currentUi] };
}

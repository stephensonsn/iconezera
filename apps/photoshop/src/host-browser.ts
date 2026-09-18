import type { Host } from "./host";

/** Simulador para abrir o painel num navegador comum durante o desenvolvimento. */
export function browserHost(): Host {
  return {
    uiLocale: () => navigator.language.replace("-", "_"),
    hasDocument: () => true,
    foregroundColor: () => "#1473e6",
    selectedText: async () => "",
    onSelectionChanged: () => {},
    async insertSvg(svg) {
      await navigator.clipboard.writeText(svg);
      return "copied";
    },
  };
}

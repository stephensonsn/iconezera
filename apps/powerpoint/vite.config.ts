import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import { getHttpsServerOptions } from "office-addin-dev-certs";

const services = JSON.parse(readFileSync(new URL("../../services.json", import.meta.url), "utf8")) as {
  iconHosts: string[];
  translationHost: string;
};

const OFFICE_CDN = "https://appsforoffice.microsoft.com";

// GitHub Pages não permite cabeçalhos HTTP, então a CSP vai em <meta> — só no build, porque o
// dev server do Vite depende de scripts inline e WebSocket. `connect-src` sai de services.json:
// trocar um servidor lá atualiza o código e a CSP juntos.
function contentSecurityPolicy(): Plugin {
  const policy = [
    "default-src 'none'",
    `script-src 'self' ${OFFICE_CDN}`,
    "style-src 'self' 'unsafe-inline'", // office.js injeta estilos inline
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${OFFICE_CDN} ${[...services.iconHosts, services.translationHost].join(" ")}`,
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
    "frame-src https://telemetryservice.firstpartyapps.oaspapps.com", // telemetria do próprio office.js
  ].join("; ");
  return {
    name: "iconezera-csp",
    apply: "build",
    transformIndexHtml: () => [
      { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: policy }, injectTo: "head-prepend" },
      { tag: "meta", attrs: { name: "referrer", content: "no-referrer" }, injectTo: "head-prepend" },
    ],
  };
}

// O Office só carrega add-ins via HTTPS; usa o certificado local de `npm run certs`.
// ICONEZERA_HTTP=1 serve em HTTP puro, só para conferir o painel num navegador comum.
export default defineConfig(async ({ command }) => ({
  base: "./",
  plugins: [contentSecurityPolicy()],
  server: {
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
    https: command === "serve" && !process.env.ICONEZERA_HTTP ? await getHttpsServerOptions() : undefined,
  },
  build: { sourcemap: false, rollupOptions: { input: "taskpane.html" } },
}));

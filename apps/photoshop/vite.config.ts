import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const services = JSON.parse(readFileSync(new URL("../../services.json", import.meta.url), "utf8")) as {
  iconHosts: string[];
  translationHost: string;
};

// O UXP carrega um HTML estático + um script clássico (sem módulos ES). O build gera dist/index.js
// e dist/style.css; manifest, HTML e ícones vêm de public/. `photoshop` e `uxp` são módulos do host,
// resolvidos em runtime por require().
export default defineConfig({
  base: "./",
  publicDir: "public",
  define: { __ICONEZERA_SERVICES__: JSON.stringify(services) },
  server: { port: Number(process.env.PORT) || 3300, strictPort: true },
  build: {
    sourcemap: false,
    cssCodeSplit: false,
    lib: { entry: "src/index.ts", formats: ["iife"], name: "iconezera", fileName: () => "index.js", cssFileName: "style" },
    rollupOptions: { output: { assetFileNames: "[name][extname]" } },
  },
});

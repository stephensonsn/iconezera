// Gera o manifest de produção (URLs públicas) a partir do manifest de desenvolvimento (localhost).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const DEV_ORIGIN = "https://localhost:3000";
const baseUrl = new URL(process.env.ICONEZERA_BASE_URL ?? "https://stephensonsn.github.io/iconezera/");
if (baseUrl.protocol !== "https:") throw new Error("ICONEZERA_BASE_URL precisa ser https");
const base = baseUrl.href.replace(/\/$/, "");

const source = new URL("../apps/powerpoint/manifest.xml", import.meta.url);
const target = new URL("../apps/powerpoint/dist/manifest.xml", import.meta.url);

const devManifest = readFileSync(source, "utf8");
if (!devManifest.includes(DEV_ORIGIN)) {
  throw new Error("apps/powerpoint/manifest.xml deve ser o manifest de DESENVOLVIMENTO (localhost:3000). Restaure-o com git antes de gerar o de produção.");
}

const manifest = devManifest
  .replaceAll(DEV_ORIGIN, base)
  // Office faz cache do manifest por ID+versão: produção usa 4º segmento 100+ para nunca colidir com o de desenvolvimento
  .replace(/<Version>(\d+)\.(\d+)\.(\d+)\.(\d+)<\/Version>/, (_, a, b, c, d) => `<Version>${a}.${b}.${c}.${Number(d) + 100}</Version>`)
  .replace(/<SupportUrl DefaultValue="[^"]*"\/>/, `<SupportUrl DefaultValue="${base}/#suporte"/>`)
  .replace(/(<bt:Url id="GetStarted.LearnMoreUrl" DefaultValue=")[^"]*"/, `$1${base}/"`);

if (manifest.includes("localhost")) throw new Error("Sobrou referência a localhost no manifest de produção");

mkdirSync(new URL(".", target), { recursive: true });
writeFileSync(target, manifest);
console.log(`manifest de produção → ${target.pathname} (${base})`);

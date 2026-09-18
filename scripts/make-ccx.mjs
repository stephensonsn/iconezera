// Empacota o plugin do Photoshop como .ccx (é um zip com o manifest na raiz) e o coloca no site.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pluginDist = fileURLToPath(new URL("../apps/photoshop/dist/", import.meta.url));
const siteDownloads = fileURLToPath(new URL("../apps/powerpoint/dist/downloads/", import.meta.url));
const target = `${siteDownloads}iconezera-photoshop.ccx`;

if (!existsSync(`${pluginDist}manifest.json`)) throw new Error("Rode `npm run build:ps` antes");
mkdirSync(siteDownloads, { recursive: true });
rmSync(target, { force: true });
// -X: sem atributos estendidos; -x: sem lixo do macOS (.DS_Store, __MACOSX, ._*) — a Adobe rejeita o pacote com eles.
execFileSync("zip", ["-r", "-X", "-q", target, ".", "-x", ".DS_Store", "*/.DS_Store", "__MACOSX/*", "._*", "*/._*"], {
  cwd: pluginDist,
  stdio: "inherit",
});
console.log(`pacote → ${target}`);

import { NoDocumentError, hostModule, type Host } from "./host";
import type { Photoshop, Uxp } from "./uxp-types";

const MAX_TEXT_LENGTH = 80;

export function photoshopHost(): Host {
  const ps = hostModule<Photoshop>("photoshop")!;
  const uxp = hostModule<Uxp>("uxp")!;

  return {
    uiLocale: () => uxp.host.uiLocale,
    hasDocument: () => ps.app.activeDocument !== null,
    foregroundColor: () => `#${ps.app.foregroundColor.rgb.hexValue}`,

    async selectedText() {
      const layer = ps.app.activeDocument?.activeLayers[0];
      if (!layer || layer.kind !== ps.constants.LayerKind.TEXT) return "";
      return (layer.textItem?.contents ?? "").slice(0, MAX_TEXT_LENGTH);
    },

    onSelectionChanged(handler) {
      ps.action.addNotificationListener([{ event: "select" }], handler);
    },

    async insertSvg(svg, sizeRatio) {
      const document = ps.app.activeDocument;
      if (!document) throw new NoDocumentError();

      // O Photoshop só coloca arquivos por token de sessão: gravamos o SVG na pasta temporária do plugin.
      const folder = await uxp.storage.localFileSystem.getTemporaryFolder();
      const file = await folder.createFile(`iconezera-${Date.now()}.svg`, { overwrite: true });
      await file.write(svg);
      const token = uxp.storage.localFileSystem.createSessionToken(file);

      await ps.core.executeAsModal(
        async () => {
          await ps.action.batchPlay(
            [
              {
                _obj: "placeEvent",
                null: { _path: token, _kind: "local" },
                linked: false,
                freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" },
              },
            ],
            {},
          );
          // Smart Object vetorial entra centralizado; ajusta para a fração pedida do menor lado.
          const layer = document.activeLayers[0];
          const bounds = layer?.boundsNoEffects;
          if (!layer || !bounds) return;
          const current = Math.max(bounds.right - bounds.left, bounds.bottom - bounds.top);
          const target = Math.min(document.width, document.height) * sizeRatio;
          if (current > 0) {
            const percent = (target / current) * 100;
            await layer.scale(percent, percent);
          }
        },
        { commandName: "iconeZERA" },
      );
      return "inserted";
    },
  };
}

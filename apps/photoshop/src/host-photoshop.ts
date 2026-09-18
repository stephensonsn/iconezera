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

    async insertSvg(svg, sizePx) {
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
          // O Photoshop pode reinterpretar as dimensões do SVG (resolução do documento, preferência
          // "redimensionar ao colocar"); mede o resultado e corrige para o tamanho pedido em pixels.
          const bounds = document.activeLayers[0]?.boundsNoEffects;
          if (!bounds) return;
          const current = Math.max(bounds.right - bounds.left, bounds.bottom - bounds.top);
          if (current <= 0 || Math.abs(current - sizePx) < 1) return;
          const percent = (sizePx / current) * 100;
          await ps.action.batchPlay(
            [
              {
                _obj: "transform",
                _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" },
                width: { _unit: "percentUnit", _value: percent },
                height: { _unit: "percentUnit", _value: percent },
              },
            ],
            {},
          );
        },
        { commandName: "iconeZERA" },
      );
      return "inserted";
    },
  };
}

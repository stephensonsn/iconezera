/** Resolve true quando o painel está rodando dentro do PowerPoint (e não num navegador comum). */
export async function waitForOffice(): Promise<boolean> {
  if (typeof Office === "undefined") return false;
  const info = await Office.onReady();
  return info.host === Office.HostType.PowerPoint;
}

export function getSelectedText(): Promise<string> {
  return new Promise((resolve) => {
    Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
      const ok = result.status === Office.AsyncResultStatus.Succeeded;
      resolve(ok && typeof result.value === "string" ? result.value.trim() : "");
    });
  });
}

export function onSelectionChanged(handler: () => void): void {
  Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, handler);
}

function setSelectedData(data: string, coercionType: Office.CoercionType): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.document.setSelectedDataAsync(data, { coercionType }, (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) resolve();
      else reject(new Error(result.error.message));
    });
  });
}

async function svgToPngBase64(svg: string, size: number): Promise<string> {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  const canvas = document.createElement("canvas");
  const scale = size / Math.max(image.width, image.height);
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png").split(",")[1];
}

/** Insere como SVG editável; cai para PNG quando o host não suporta XmlSvg (ImageCoercion 1.2). */
export async function insertSvg(svg: string): Promise<"svg" | "png"> {
  if (Office.context.requirements.isSetSupported("ImageCoercion", "1.2")) {
    try {
      await setSelectedData(svg, Office.CoercionType.XmlSvg);
      return "svg";
    } catch {
      // segue para o fallback em PNG
    }
  }
  await setSelectedData(await svgToPngBase64(svg, 1024), Office.CoercionType.Image);
  return "png";
}

/** true/false conforme o tema do Office; undefined quando o host não informa (ex.: PowerPoint Web antigo). */
export function isOfficeDark(): boolean | undefined {
  const theme = Office.context.officeTheme as (Office.OfficeTheme & { isDarkTheme?: boolean }) | undefined;
  if (!theme) return undefined;
  if (typeof theme.isDarkTheme === "boolean") return theme.isDarkTheme;
  // hosts antigos só expõem as cores: fundo escuro = tema escuro
  const hex = /^#?([0-9a-f]{6})$/i.exec(theme.bodyBackgroundColor ?? "")?.[1];
  if (!hex) return undefined;
  const [r, g, b] = [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

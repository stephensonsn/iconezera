/* Subconjunto tipado das APIs do Photoshop/UXP que o plugin usa (as tipagens oficiais não são publicadas no npm). */

export interface Bounds { left: number; top: number; right: number; bottom: number }

export interface Layer {
  kind: string;
  name: string;
  textItem?: { contents: string };
  boundsNoEffects: Bounds;
  scale(width: number, height: number): Promise<void>;
}

export interface Document {
  width: number;
  height: number;
  activeLayers: Layer[];
}

export interface Photoshop {
  app: {
    activeDocument: Document | null;
    foregroundColor: { rgb: { hexValue: string } };
  };
  core: {
    executeAsModal<T>(fn: () => Promise<T>, options: { commandName: string }): Promise<T>;
  };
  action: {
    batchPlay(descriptors: object[], options: object): Promise<object[]>;
    addNotificationListener(events: { event: string }[], handler: () => void): void;
  };
  constants: { LayerKind: { TEXT: string } };
}

export interface UxpFile {
  write(data: string, options?: { append?: boolean }): Promise<void>;
}

export interface Uxp {
  host: { uiLocale: string };
  storage: {
    localFileSystem: {
      getTemporaryFolder(): Promise<{ createFile(name: string, options: { overwrite: boolean }): Promise<UxpFile> }>;
      createSessionToken(entry: UxpFile): string;
    };
  };
}

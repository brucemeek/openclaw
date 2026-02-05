declare module "mammoth" {
  export type ExtractResult = { value?: string };

  export function extractRawText(params: {
    buffer: Buffer | ArrayBuffer | Uint8Array;
  }): Promise<ExtractResult>;
}

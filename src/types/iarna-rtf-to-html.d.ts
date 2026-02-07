declare module "@iarna/rtf-to-html" {
  export type RtfToHtmlCallback = (err: unknown, html: string) => void;

  export function fromString(value: string, cb: RtfToHtmlCallback): void;
  export function fromString(
    value: string,
    opts: Record<string, unknown>,
    cb: RtfToHtmlCallback,
  ): void;

  const rtfToHtml: {
    (opts: Record<string, unknown>, cb: RtfToHtmlCallback): NodeJS.WritableStream;
    fromString: typeof fromString;
    fromStream: (stream: NodeJS.ReadableStream, cb: RtfToHtmlCallback) => void;
    fromStream: (
      stream: NodeJS.ReadableStream,
      opts: Record<string, unknown>,
      cb: RtfToHtmlCallback,
    ) => void;
  };

  export default rtfToHtml;
}

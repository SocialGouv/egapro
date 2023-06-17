import { renderToBuffer, renderToFile, renderToStream } from "@react-pdf/renderer";

import { type IJsxPdfService } from "../IJsxPdfService";

type Document = Parameters<typeof renderToBuffer>[0];

/**
 * `@react-pdf/renderer` impl of the {@link IJsxPdfService}.
 */
export class ReactPdfService implements IJsxPdfService {
  public async buffer(document: Document): Promise<Buffer> {
    return renderToBuffer(document);
  }

  public async save(document: Document, path: string): Promise<void> {
    await renderToFile(document, path);
  }

  public async stream(document: Document): Promise<NodeJS.ReadableStream> {
    return renderToStream(document);
  }
}

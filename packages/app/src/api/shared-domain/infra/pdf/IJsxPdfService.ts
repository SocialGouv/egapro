import { type Service } from "@common/shared-domain";
import { type pvoid } from "@common/utils/types";

/**
 * Generic pdf service interface. Use JSX as input. Implement it for a specific domain.
 */
export interface IJsxPdfService extends Service {
  /**
   * Returns a pdf as a buffer based on a given jsx document.
   */
  buffer(document: JSX.Element): Promise<Buffer>;

  /**
   * Save a pdf to a given file path based on a given jsx document.
   */
  save(document: JSX.Element, path: string): pvoid;

  /**
   * Stream a pdf file stream based on a given jsx document.
   *
   * @returns A pdf file stream
   */
  stream(document: JSX.Element): Promise<NodeJS.ReadableStream>;
}

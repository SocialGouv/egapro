import { type Readable } from "stream";

/**
 * Converts a Node.js Readable stream to a Web ReadableStream.
 */
export function nodeToWebStream(nodeStream: Readable): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", chunk => {
        controller.enqueue(chunk);
      });
      nodeStream.on("end", () => {
        controller.close();
      });
      nodeStream.on("error", err => {
        controller.error(err);
      });
    },
  });
}

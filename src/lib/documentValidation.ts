import { Worker } from "node:worker_threads";
import sharp from "sharp";
import { MAX_DOCUMENT_BYTES } from "./documents";
import { DOCUMENT_PDF_WORKER } from "./documentPdfWorker";

export class DocumentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function readDocumentBody(request: Request) {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_DOCUMENT_BYTES)) {
    throw new DocumentError("Choose a file smaller than 3 MB.", 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new DocumentError("Choose a file to upload.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_DOCUMENT_BYTES) {
        await reader.cancel();
        throw new DocumentError("Choose a file smaller than 3 MB.", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!size) throw new DocumentError("Empty files cannot be uploaded.");
  return Buffer.concat(chunks, size);
}

// Reject active PDF content rather than rendering untrusted documents in our origin.
export async function validateDocument(bytes: Buffer, filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension === "pdf" && bytes.subarray(0, 5).toString("ascii") === "%PDF-") {
    try {
      if (!bytes.subarray(-1024).includes(Buffer.from("%%EOF"))) throw new Error("Incomplete PDF");
      await new Promise<void>((resolve, reject) => {
        const worker = new Worker(DOCUMENT_PDF_WORKER, {
          eval: true, workerData: { bytes },
          resourceLimits: { maxOldGenerationSizeMb: 64, maxYoungGenerationSizeMb: 8, stackSizeMb: 2 },
        });
        const timer = setTimeout(() => { void worker.terminate(); reject(new Error("PDF validation timed out")); }, 5000);
        worker.once("message", valid => {
          clearTimeout(timer); void worker.terminate();
          if (valid === true) resolve(); else reject(new Error("PDF validation failed"));
        });
        worker.once("error", () => { clearTimeout(timer); reject(new Error("PDF validation failed")); });
        worker.once("exit", code => { if (code !== 0) { clearTimeout(timer); reject(new Error("PDF validation failed")); } });
      });
      return { bytes, mime: "application/pdf", extension: "pdf" };
    } catch {
      throw new DocumentError("Use a complete, unencrypted PDF with up to 200 pages and no interactive forms, attachments, or actions. A flattened PDF is supported.");
    }
  }
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if ((extension === "png" && png) || (["jpg", "jpeg"].includes(extension ?? "") && jpeg)) {
    try {
      const image = sharp(bytes, { limitInputPixels: 24000000, failOn: "warning", animated: false }).timeout({ seconds: 5 });
      const info = await image.metadata();
      if ((info.pages ?? 1) !== 1) throw new Error("Animated image");
      // Re-encoding removes EXIF/location metadata and appended payloads.
      const clean = await (png ? image.rotate().png() : image.rotate().jpeg({ quality: 95 })).toBuffer();
      if (clean.byteLength > MAX_DOCUMENT_BYTES) throw new Error("Image too large");
      return { bytes: clean, mime: png ? "image/png" : "image/jpeg", extension: png ? "png" : "jpg" };
    } catch { throw new DocumentError("This image could not be read safely. Choose a smaller, valid JPG or PNG image."); }
  }
  throw new DocumentError("Only PDF, JPG, and PNG files with matching file contents are supported.");
}

// @vitest-environment node
import { expect, test } from "vitest";
import { PDFDocument, PDFName, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { documentName, MAX_DOCUMENT_BYTES } from "@/lib/documents";
import { readDocumentBody, validateDocument } from "@/lib/documentValidation";

test("validates a real PDF without modifying its bytes", async () => {
  const pdf = await PDFDocument.create(); pdf.addPage();
  const bytes = Buffer.from(await pdf.save());
  const result = await validateDocument(bytes,"transcript.pdf");
  expect(result.mime).toBe("application/pdf"); expect(result.bytes).toEqual(bytes);
});
test("ordinary font resources named A are accepted without permitting JavaScript actions", async () => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.node.set(PDFName.of("Resources"), pdf.context.obj({ Font: { A: font.ref } }));
  expect((await validateDocument(Buffer.from(await pdf.save()), "transcript.pdf")).mime).toBe("application/pdf");
});
test("rejects active PDFs, forms, spoofed extensions, and incomplete PDFs", async () => {
  const pdf = await PDFDocument.create(); pdf.addPage();
  pdf.catalog.set(PDFName.of("OpenAction"), pdf.context.obj({S:"JavaScript",JS:"app.alert(1)"}));
  await expect(validateDocument(Buffer.from(await pdf.save()),"passport.pdf")).rejects.toThrow(/non-interactive|interactive/);
  const form = await PDFDocument.create(); form.addPage(); form.getForm().createTextField("name");
  await expect(validateDocument(Buffer.from(await form.save()),"form.pdf")).rejects.toThrow(/interactive/);
  await expect(validateDocument(Buffer.from("<script>steal()</script>"),"passport.pdf")).rejects.toThrow(/matching file contents/);
  await expect(validateDocument(Buffer.from("%PDF-1.7 broken"),"passport.pdf")).rejects.toThrow(/complete/);
  await expect(validateDocument(Buffer.from("%PDF-1.7"),"passport.svg")).rejects.toThrow(/Only PDF/);
});
test("re-encodes real images and strips embedded metadata and appended payloads", async () => {
  const original = await sharp({ create: { width: 20,height:20,channels:3,background:"green" } }).withMetadata({exif:{IFD0:{Artist:"PRIVATE PERSON"}}}).jpeg().toBuffer();
  const input = Buffer.concat([original,Buffer.from("INJECTED_TRAILING_PAYLOAD")]);
  const result = await validateDocument(input,"scan.jpg");
  expect(result.mime).toBe("image/jpeg");
  expect(result.bytes.includes(Buffer.from("INJECTED_TRAILING_PAYLOAD"))).toBe(false);
  expect((await sharp(result.bytes).metadata()).exif).toBeUndefined();
  await expect(validateDocument(original,"scan.png")).rejects.toThrow(/matching/);
});
test("enforces bounded streaming even without Content-Length", async () => {
  const body = new ReadableStream({start(controller) { controller.enqueue(new Uint8Array(MAX_DOCUMENT_BYTES)); controller.enqueue(new Uint8Array(1)); controller.close(); }});
  const request = new Request("https://example.test", {method:"POST",body,duplex:"half"} as RequestInit);
  await expect(readDocumentBody(request)).rejects.toThrow(/smaller than 3 MB/);
  await expect(readDocumentBody(new Request("https://example.test",{method:"POST",body:"a",headers:{"Content-Length":String(MAX_DOCUMENT_BYTES+1)}}))).rejects.toThrow(/smaller than/);
});
test("sanitizes display filenames; object paths never derive from names", () => {
  expect(documentName("../passport\r\n.pdf")).toBe(".._passport__.pdf");
  expect(documentName("test\u202e.pdf")).toBe("test_.pdf");
});

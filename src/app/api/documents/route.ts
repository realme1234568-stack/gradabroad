import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { DOCUMENT_BUCKET, documentName, isDocumentCategory } from "@/lib/documents";
import { DOCUMENT_COLUMNS, documentRequest, documentWriter } from "@/lib/documentServer";
import { DocumentError, readDocumentBody, validateDocument } from "@/lib/documentValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = documentRequest(request);
  try {
    const { client, userId } = await context.authenticate();
    const { data, error } = await client.from("student_documents").select(DOCUMENT_COLUMNS).eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return context.finish(NextResponse.json({ documents: data }));
  } catch (error) { return context.fail(error); }
}

export async function POST(request: NextRequest) {
  const context = documentRequest(request);
  try {
    const { userId } = await context.authenticate();
    const writer = documentWriter();
    const { error: attemptError } = await writer.rpc("document_upload_attempt", { p_user_id: userId });
    if (attemptError) {
      if (attemptError.message.includes("DOCUMENT_RATE_LIMIT")) throw new DocumentError("Upload limit reached. Please try again in an hour.", 429);
      throw attemptError;
    }
    const category = request.headers.get("x-document-category");
    if (!isDocumentCategory(category)) throw new DocumentError("Choose a document category.");
    let original: string;
    try { original = decodeURIComponent(request.headers.get("x-document-name") ?? ""); }
    catch { throw new DocumentError("Choose a file with a valid name."); }
    const name = documentName(original);
    if (!name || !name.includes(".")) throw new DocumentError("Choose a named PDF, JPG, or PNG file.");
    const checked = await validateDocument(await readDocumentBody(request), name);
    const id = randomUUID();
    const path = `${userId}/${id}.${checked.extension}`;
    const { error: reserveError } = await writer.rpc("reserve_student_document", {
      p_id: id, p_user_id: userId, p_name: name, p_category: category,
      p_mime: checked.mime, p_size: checked.bytes.byteLength, p_path: path,
    });
    if (reserveError) {
      if (reserveError.message.includes("DOCUMENT_QUOTA")) throw new DocumentError("Your document library is full. Delete an old document before uploading another.", 409);
      throw reserveError;
    }
    try {
      const { error: uploadError } = await writer.storage.from(DOCUMENT_BUCKET).upload(path, checked.bytes, { contentType: checked.mime, cacheControl: "0", upsert: false });
      if (uploadError) throw uploadError;
      const { data, error } = await writer.from("student_documents").update({ state: "ready" }).eq("id", id).eq("user_id", userId).eq("state", "pending").select(DOCUMENT_COLUMNS).single();
      if (error || !data) throw error ?? new Error("Could not confirm upload");
      return context.finish(NextResponse.json({ document: data }, { status: 201 }));
    } catch {
      // A failed request can still have stored bytes. Remove the object first;
      // retain the pending record if cleanup fails, so it stays visible/retryable.
      try {
        const { error } = await writer.storage.from(DOCUMENT_BUCKET).remove([path]);
        if (!error) await writer.from("student_documents").delete().eq("id", id).eq("user_id", userId);
      } catch { /* Pending uploads remain private and count against quota. */ }
      throw new DocumentError("Upload could not be confirmed. Refresh your library before retrying.", 503);
    }
  } catch (error) { return context.fail(error); }
}

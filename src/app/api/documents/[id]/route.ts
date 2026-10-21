import { NextResponse, type NextRequest } from "next/server";
import { DOCUMENT_BUCKET, isDocumentId } from "@/lib/documents";
import { documentRequest, documentWriter } from "@/lib/documentServer";
import { DocumentError } from "@/lib/documentValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const context = documentRequest(request);
  try {
    const { client, userId } = await context.authenticate();
    const { id } = await params;
    if (!isDocumentId(id)) throw new DocumentError("Document not found.", 404);
    const { data, error } = await client.from("student_documents").select("object_path,original_name,mime_type,state").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) throw new DocumentError("Document not found.", 404);
    if (data.state !== "ready") throw new DocumentError("This upload is incomplete. Refresh your library.", 409);
    // Download uses the student's JWT and Storage RLS, never the service key.
    const { data: file, error: downloadError } = await client.storage.from(DOCUMENT_BUCKET).download(data.object_path);
    if (downloadError || !file) throw new DocumentError("Could not download this document. Please retry.", 503);
    const name = encodeURIComponent(data.original_name).replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return context.finish(new NextResponse(file, { headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="document.${data.mime_type === "application/pdf" ? "pdf" : data.mime_type === "image/png" ? "png" : "jpg"}"; filename*=UTF-8''${name}`,
      "Content-Length": String(file.size),
    } }));
  } catch (error) { return context.fail(error); }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const context = documentRequest(request);
  try {
    const { client, userId } = await context.authenticate();
    const { id } = await params;
    if (!isDocumentId(id)) throw new DocumentError("Document not found.", 404);
    const { data, error } = await client.from("student_documents").select("object_path,state,created_at").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) throw new DocumentError("Document not found.", 404);
    if (data.state === "pending" && Date.now() - Date.parse(data.created_at) < 10 * 60 * 1000) {
      throw new DocumentError("This upload may still be processing. Wait 10 minutes before deleting an incomplete upload.", 409);
    }
    const writer = documentWriter();
    const { error: storageError } = await writer.storage.from(DOCUMENT_BUCKET).remove([data.object_path]);
    if (storageError) throw new DocumentError("Could not delete the file. It remains in your library; please retry.", 503);
    const { data: removed, error: removeError } = await writer.from("student_documents").delete().eq("id", id).eq("user_id", userId).select("id");
    if (removeError || !removed?.length) throw new DocumentError("The file was removed, but its entry could not be cleared. Retry deletion to finish.", 503);
    return context.finish(NextResponse.json({ deleted: true }));
  } catch (error) { return context.fail(error); }
}

export const DOCUMENT_BUCKET = "student-documents";
export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
export const MAX_DOCUMENTS = 50;
export const DOCUMENT_CATEGORIES = ["Passport", "Academic records", "Language tests", "APS", "Recommendations", "Statement of purpose", "Admission", "Visa", "Financial documents", "Other"] as const;
export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];
export type StudentDocument = {
  id: string;
  original_name: string;
  category: DocumentCategory;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  state: "pending" | "ready";
};
export function isDocumentCategory(value: unknown): value is DocumentCategory {
  return typeof value === "string" && DOCUMENT_CATEGORIES.includes(value as DocumentCategory);
}
export function isDocumentId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export function documentName(value: string) {
  // Names are display-only. Object keys always use generated UUIDs.
  return value.normalize("NFC").replace(/[\x00-\x1f\x7f/\\\u202a-\u202e\u2066-\u2069]/g, "_").trim().slice(0, 150);
}
export function documentSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

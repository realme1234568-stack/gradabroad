import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { DocumentError } from "./documentValidation";

export const DOCUMENT_COLUMNS = "id,original_name,category,mime_type,size_bytes,created_at,state";
export function documentRequest(request: NextRequest) {
  const changed = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const finish = (response: NextResponse) => {
    for (const cookie of changed.values()) response.cookies.set(cookie.name, cookie.value, cookie.options);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Vercel-CDN-Cache-Control", "no-store");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
    return response;
  };
  const fail = (error: unknown) => finish(NextResponse.json({ error: error instanceof DocumentError ? error.message : "Documents are temporarily unavailable. Please retry." }, { status: error instanceof DocumentError ? error.status : 503 }));
  const authenticate = async () => {
    const site = request.headers.get("sec-fetch-site");
    if (site === "cross-site") throw new DocumentError("Open Your Documents on GradAbroad to continue.", 403);
    // Next can construct request.url with its internal hostname. The Host
    // header identifies the browser's destination; never trust forwarded-host.
    const destination = new URL(request.url);
    const host = request.headers.get("host");
    if (host) destination.host = host;
    if (!["GET", "HEAD"].includes(request.method) && request.headers.get("origin") !== destination.origin) {
      throw new DocumentError("Reload this page before making changes.", 403);
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new DocumentError("Documents are temporarily unavailable.", 503);
    const client = createServerClient(url, key, { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach((cookie) => {
        request.cookies.set(cookie.name, cookie.value);
        changed.set(cookie.name, cookie);
      }),
    } });
    // getUser validates against Auth. Never trust a user ID supplied by the browser.
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new DocumentError("Your session has expired. Sign in again to access your documents.", 401);
    if (request.headers.get("x-document-account") !== data.user.id) throw new DocumentError("Your account changed. Refresh your library before continuing.", 409);
    if (data.user.is_anonymous || !data.user.email_confirmed_at) throw new DocumentError("Verify your email before using Your Documents.", 403);
    return { client, userId: data.user.id };
  };
  return { authenticate, finish, fail };
}

// Privileged writes stay on the server. No storage INSERT/UPDATE/DELETE policy
// is granted to browsers, so validation and quotas cannot be bypassed via REST.
export function documentWriter() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !key) throw new DocumentError("Document uploads are not configured yet. Please try again later.", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

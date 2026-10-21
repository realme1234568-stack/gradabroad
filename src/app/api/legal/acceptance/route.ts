import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LEGAL_PENDING_COOKIE, LEGAL_VERSION } from "@/lib/legal";

export const dynamic = "force-dynamic";
function context(request: NextRequest) {
  const changed: { name: string; value: string; options: CookieOptions }[] = [];
  const finish = (response: NextResponse) => {
    for (const cookie of changed) response.cookies.set(cookie.name, cookie.value, cookie.options);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Cookie");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  };
  const client = () => createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: cookies => cookies.forEach(cookie => { request.cookies.set(cookie.name, cookie.value); changed.push(cookie); }),
  } });
  return { finish, client };
}

export async function GET(request: NextRequest) {
  const { finish, client } = context(request);
  try {
    const supabase = client();
    const { data, error } = await supabase.auth.getUser();
    if (!data.user) return finish(NextResponse.json({ error: "Sign in to review your account agreement." }, { status: error && error.name !== "AuthSessionMissingError" ? 503 : 401 }));
    if (error) throw error;
    const { data: accepted, error: queryError } = await supabase.rpc("has_accepted_legal", { p_version: LEGAL_VERSION });
    if (queryError || typeof accepted !== "boolean") throw queryError ?? new Error("Missing receipt");
    return finish(NextResponse.json({ accepted, account: data.user.id, version: LEGAL_VERSION }));
  } catch { return finish(NextResponse.json({ error: "Could not check your agreement. Please retry." }, { status: 503 })); }
}

export async function POST(request: NextRequest) {
  const { finish, client } = context(request);
  const failure = (message: string, status: number) => finish(NextResponse.json({ error: message }, { status }));
  const destination = new URL(request.url);
  const host = request.headers.get("host");
  if (host) destination.host = host;
  if (request.headers.get("origin") !== destination.origin || request.headers.get("sec-fetch-site") === "cross-site") return failure("Reload GradAbroad before continuing.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return failure("Invalid acknowledgement.", 400);
  try {
    // Bound the actual stream, not a caller-supplied Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return failure("Invalid acknowledgement.", 400);
    let text = "", size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024) { await reader.cancel(); return failure("Acknowledgement is too large.", 413); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    let body;
    try { body = JSON.parse(text); } catch { return failure("Invalid acknowledgement.", 400); }
    if (!body || body.version !== LEGAL_VERSION || body.terms !== true || body.privacy !== true || !["prelogin", "onboarding"].includes(body.stage)) return failure("Accept the current Terms and acknowledge the Privacy Policy to continue.", 400);
    if (body.stage === "prelogin") {
      const response = finish(NextResponse.json({ pending: true }));
      response.cookies.set(LEGAL_PENDING_COOKIE, LEGAL_VERSION, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/auth/callback", maxAge: 15 * 60 });
      return response;
    }
    const supabase = client();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return failure("Sign in again before continuing.", 401);
    if (request.headers.get("x-legal-account") !== data.user.id) return failure("Your account changed. Reload before accepting.", 409);
    const { data: accepted, error: saveError } = await supabase.rpc("accept_legal", { p_version: LEGAL_VERSION, p_source: "onboarding" });
    if (saveError || accepted !== true) throw saveError ?? new Error("Receipt not saved");
    return finish(NextResponse.json({ accepted: true, account: data.user.id, version: LEGAL_VERSION }));
  } catch { return failure("Could not save your agreement. Please retry.", 503); }
}

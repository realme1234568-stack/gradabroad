import { LEGAL_PENDING_COOKIE, LEGAL_VERSION } from "@/lib/legal";
import { signInDestination } from "@/lib/signInDestination";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { rateLimit } from "@/utils/rateLimitEdge";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const changedCookies = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin));
    for (const { name, value, options } of changedCookies.values()) {
      response.cookies.set(name, value, options);
    }
    response.cookies.set(LEGAL_PENDING_COOKIE, "", { path: "/auth/callback", maxAge: 0, httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };

  try {
    if (await rateLimit(request)) return redirect("/auth/error?reason=rate-limited");
    if (searchParams.has("error")) {
      return redirect(searchParams.get("error") === "access_denied"
        ? "/auth/error?reason=cancelled" : "/auth/error?reason=failed");
    }
    const code = searchParams.get("code");
    if (!code) return redirect("/auth/error?reason=invalid-link");

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              changedCookies.set(name, { name, value, options });
            });
          },
        },
      }
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) return redirect("/auth/error?reason=invalid-link");
    const destination = signInDestination(searchParams.get("next"));
    // Never attach a pre-login acknowledgement to a user ID supplied by the browser.
    const { data: verified, error: verifyError } = await supabase.auth.getUser();
    if (verifyError || !verified.user) return redirect("/auth/error?reason=session");
    const agreementPath = `/legal/accept?next=${encodeURIComponent(destination)}`;
    const { data: accepted, error: checkError } = await supabase.rpc("has_accepted_legal", { p_version: LEGAL_VERSION });
    if (checkError) return redirect(agreementPath);
    if (accepted !== true) {
      if (request.cookies.get(LEGAL_PENDING_COOKIE)?.value !== LEGAL_VERSION) return redirect(agreementPath);
      const { data: saved, error: saveError } = await supabase.rpc("accept_legal", { p_version: LEGAL_VERSION, p_source: "prelogin" });
      if (saveError || saved !== true) return redirect(agreementPath);
    }
    return redirect(destination);
  } catch {
    return redirect("/auth/error?reason=unavailable");
  }
}

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
    return redirect(signInDestination(searchParams.get("next")));
  } catch {
    return redirect("/auth/error?reason=unavailable");
  }
}

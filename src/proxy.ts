import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/application-tracker" || pathname.startsWith("/application-tracker/") ||
    pathname === "/admin" || pathname.startsWith("/admin/");
  if (!protectedRoute) return NextResponse.next({ request });

  const changedCookies = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const finish = (response: NextResponse) => {
    for (const { name, value, options } of changedCookies.values()) {
      response.cookies.set(name, value, options);
    }
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
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
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      const signIn = new URL("/auth/error", request.url);
      signIn.searchParams.set("reason", error ? "session" : "signin");
      signIn.searchParams.set("next", pathname);
      return finish(NextResponse.redirect(signIn));
    }
  } catch {
    return finish(NextResponse.redirect(new URL("/auth/error?reason=unavailable", request.url)));
  }
  // Build the forwarded request after refresh so Server Components see the new cookies too.
  return finish(NextResponse.next({ request }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

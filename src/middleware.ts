import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Robust localhost bypass
  const host = request.headers.get("host") || "";
  const isLocalhost = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);

  if (isLocalhost) {
    // Always allow access on localhost
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Only allow your Google dev account email
  const allowedEmail = process.env.GOOGLE_DEV_EMAIL?.trim().toLowerCase();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow public access only to landing page
  const isLandingPage = request.nextUrl.pathname === "/";
  if (!isLandingPage) {
    const userEmail = user?.email?.toLowerCase() ?? "";
    if (!userEmail || userEmail !== allowedEmail) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}


export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

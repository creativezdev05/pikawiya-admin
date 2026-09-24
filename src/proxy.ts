import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

// Define public routes that unauthenticated users can access
const PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  
];

// Routes that ONLY guest/unauthenticated users should see (redirect logged-in users away)
const GUEST_ONLY_PATHS = [
  "/signin",
  "/signup",
  "/forgot-password",
];

const handleIntlRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Initialize Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Fetch active session user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Strip locale prefix (e.g. /en/signin -> /signin)
  const pathname = request.nextUrl.pathname;
  const pathnameWithoutLocale =
    pathname.replace(/^\/(en|es|fr|ar|de)/, "") || "/";

  const isPublicRoute = PUBLIC_PATHS.some((path) =>
    pathnameWithoutLocale.startsWith(path)
  );

  const isGuestOnlyRoute = GUEST_ONLY_PATHS.some((path) =>
    pathnameWithoutLocale.startsWith(path)
  );

  // 3. Redirect unauthenticated users away from private pages to /signin
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // 4. Redirect signed-in users away ONLY from guest-only pages (/signin, /signup, etc.)
  if (user && isGuestOnlyRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 5. Delegate request to next-intl middleware
  const intlResponse = handleIntlRouting(request);

  // Ensure refreshed Supabase cookies are passed through to the client
  response.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api/|_next|_vercel|.*\\..*).*)"],
};
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/specialist"];

// Public exceptions within protected prefixes (no auth required)
const PUBLIC_EXCEPTIONS = ["/specialist/register", "/api/account/register"];

// Routes that redirect authenticated users away (login, register)
const AUTH_REDIRECT_PATHS = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Dev mode: bypass all auth guards ─────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    const response = NextResponse.next();
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }

  // ── Auth route-guard ──────────────────────────────────────────────────────
  const isPublicException = PUBLIC_EXCEPTIONS.includes(pathname);
  const isProtected = !isPublicException && PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthPage = AUTH_REDIRECT_PATHS.includes(pathname);

  if (isProtected || isAuthPage) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (isProtected && !token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect users away from wrong dashboards
    if (isProtected && token) {
      const role = (token.role as string) ?? "";
      const isAdmin = ["SUPER_ADMIN", "ADMIN", "CONTENT_ADMIN"].includes(role);
      const isSpecialist = role === "SPECIALIST" || role === "SPECIALIST_ADMIN";

      if (pathname.startsWith("/dashboard") && (isAdmin || isSpecialist)) {
        return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/specialist", request.url));
      }
      if (pathname.startsWith("/specialist") && !isSpecialist && !isAdmin) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (pathname.startsWith("/admin") && !isAdmin) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (isAuthPage && token) {
      // Already authenticated — redirect to appropriate dashboard
      const role = (token.role as string) ?? "";
      const dest =
        role === "SUPER_ADMIN" || role === "ADMIN" || role === "CONTENT_ADMIN"
          ? "/admin"
          : role === "SPECIALIST" || role === "SPECIALIST_ADMIN"
          ? "/specialist"
          : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  // ── Security response headers ──────────────────────────────────────────────
  const response = NextResponse.next();

  // Strict-Transport-Security (HSTS)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Clickjacking protection
  response.headers.set("X-Frame-Options", "DENY");

  // Referrer leakage control
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — restrict powerful browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self), usb=()"
  );

  // Cross-Origin policies
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimisation endpoint)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff2?|ttf|otf|css)).*)",
  ],
};

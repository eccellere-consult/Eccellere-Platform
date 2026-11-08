import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/specialist"];

// Public exceptions within protected prefixes (no auth required)
const PUBLIC_EXCEPTIONS = ["/specialist/register", "/api/account/register"];

// Routes that redirect authenticated users away (login, register)
const AUTH_REDIRECT_PATHS = ["/login", "/register"];

/**
 * Pages may not be shown inside another page (clickjacking), with one exception: the admin "Preview as clients see it" shows the
 * client page for a form inside the admin page of the same site, so that page may be framed by our own site (and only by it).
 */
const frameOption = (pathname: string): string => (pathname.startsWith("/consulting/library/") ? "SAMEORIGIN" : "DENY");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Dev mode: bypass all auth guards ─────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    const response = NextResponse.next();
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", frameOption(pathname));
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
  response.headers.set("X-Frame-Options", frameOption(pathname));

  // Referrer leakage control
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — restrict powerful browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self), usb=()"
  );

  // Cross-Origin policies
  // NOTE: COEP "require-corp" blocks cross-origin scripts without CORP headers
  // (e.g. Razorpay checkout.js). Use "unsafe-none" to allow third-party
  // payment/embedding while keeping COOP for window isolation.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");
  response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  // ── Cache-Control override for HTML pages ─────────────────────────────────
  // Next.js sets `Cache-Control: s-maxage=31536000` on prerendered pages, which
  // makes upstream CDNs (like Hostinger HCDN) hold a stale HTML shell pointing
  // to old JS chunk hashes after a deploy. Force shells to revalidate so a new
  // build is picked up immediately. Static assets under /_next/static are
  // excluded by the matcher above and remain immutable.
  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate"
  );

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

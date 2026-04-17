/**
 * CSRF protection utilities for API routes.
 *
 * Uses the double-submit cookie pattern:
 * 1. Server generates a random token and sets it as an HttpOnly cookie
 * 2. Client reads a non-HttpOnly version and sends it in X-CSRF-Token header
 * 3. Server validates that both match
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_BYTES = 32;

/**
 * Generate a cryptographically secure CSRF token.
 */
function generateToken(): string {
  const array = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let mismatch = 0;
  for (let i = 0; i < bufA.length; i++) {
    mismatch |= bufA[i] ^ bufB[i];
  }
  return mismatch === 0;
}

/**
 * Issue a CSRF token — sets the cookie and returns the token value.
 * Call this in GET routes that serve forms.
 */
export async function issueCsrfToken(): Promise<string> {
  const token = generateToken();
  const jar = await cookies();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600, // 1 hour
  });
  return token;
}

/**
 * Validate the CSRF token from the request header against the cookie.
 * Returns true if valid.
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!headerToken) return false;

  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;

  return timingSafeEqual(headerToken, cookieToken);
}

/**
 * Middleware helper for POST/PUT/DELETE/PATCH routes.
 * Returns a 403 response if CSRF validation fails, or null if valid.
 */
export async function requireCsrf(request: Request): Promise<NextResponse | null> {
  // Skip CSRF for API-key authenticated requests (e.g. webhooks)
  if (request.headers.get("x-api-key")) return null;

  // Skip for GET/HEAD/OPTIONS (safe methods)
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return null;

  const valid = await validateCsrfToken(request);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 }
    );
  }

  return null;
}

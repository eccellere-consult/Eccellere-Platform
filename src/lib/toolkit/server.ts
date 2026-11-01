import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Blueprint } from "./engine";

export async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

export const unauthorized = () =>
  NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

/** Loads a kit only if it belongs to the user (tenant isolation). */
export async function loadOwnedKit(id: string, userId: string) {
  return prisma.customKit.findFirst({ where: { id, userId } });
}

export const asBlueprint = (v: unknown): Blueprint => v as Blueprint;

/**
 * Wraps a route handler so an unexpected failure (for example a database table
 * that has not been created yet) returns a readable JSON error instead of an
 * empty 500 response, which the browser cannot parse.
 */
export function guard<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      console.error("[toolkit] request failed:", code ?? "", e instanceof Error ? e.message : e);
      if (code === "P2021" || code === "P2022") {
        return NextResponse.json(
          {
            error:
              "The toolkit database tables are not set up on the server yet. Please tell the administrator to run the database sync and restart the app.",
            code,
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: "Something went wrong on the server. Please try again, and tell the administrator if it continues.", code: code ?? "ERR" },
        { status: 500 },
      );
    }
  };
}

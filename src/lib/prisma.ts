import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  var prismaClient: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient {
  if (global.prismaClient) {
    return global.prismaClient;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Configure it in Hostinger Node.js app settings."
    );
  }

  // Add connection_limit and socket_timeout to the URL to prevent idle
  // connection drops from causing request hangs on Hostinger's MariaDB.
  const url = new URL(process.env.DATABASE_URL);
  // Tuned for Hostinger Cloud Startup (shared MariaDB):
  // connection_limit=3  → small pool; allow modest concurrency without
  //                       overwhelming the shared DB
  // pool_timeout=3      → fail fast if all 3 connections are busy instead
  //                       of letting requests queue indefinitely
  // socket_timeout=10   → drop hung connections after 10 s
  // connect_timeout=5   → fail fast if DB is unreachable
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "3");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "3");
  }
  if (!url.searchParams.has("socket_timeout")) {
    url.searchParams.set("socket_timeout", "10");
  }
  if (!url.searchParams.has("connect_timeout")) {
    url.searchParams.set("connect_timeout", "5");
  }

  const adapter = new PrismaMariaDb(url.toString());
  const client = new PrismaClient({
    adapter,
    errorFormat: "minimal",
  });

  if (process.env.NODE_ENV !== "test") {
    global.prismaClient = client;
  }

  return client;
}

// Export a lazy getter to avoid initialization during build
let _prisma: PrismaClient | undefined;
export const prisma = new Proxy({} as PrismaClient, {
  get(target: PrismaClient, prop: string | symbol): unknown {
    if (!_prisma) {
      _prisma = getPrismaClient();
    }
    return ((_prisma as unknown) as Record<string, unknown>)[prop as string];
  },
});

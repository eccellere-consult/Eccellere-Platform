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

  const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
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

/**
 * maybe-migrate.mjs
 * Runs `prisma db push` to sync the schema to the live DB.
 * Uses db push (not migrate deploy) because the DB was originally bootstrapped
 * with db push and has no migrations history table.
 * If the database is unreachable (local dev), warns and exits 0 silently.
 */
import { spawnSync } from "child_process";

const result = spawnSync(
  "npx",
  ["prisma", "db", "push", "--accept-data-loss"],
  {
    stdio: ["inherit", "inherit", "pipe"],
    shell: true,
  }
);

const stderr = result.stderr ? result.stderr.toString() : "";

if (result.status === 0) {
  process.exit(0);
}

if (
  stderr.includes("P1001") ||
  stderr.includes("ECONNREFUSED") ||
  stderr.includes("Can't reach database")
) {
  console.warn(
    "[maybe-migrate] DB not reachable locally — skipping schema push. Will run on Hostinger deploy."
  );
  process.exit(0);
}

// Real error — print it and fail the build
console.error(stderr);
process.exit(result.status ?? 1);

/**
 * maybe-migrate.mjs
 * Runs `prisma migrate deploy`. If the database is unreachable (P1001 / ECONNREFUSED),
 * warns and exits 0 so local builds are not blocked.
 * In production (Hostinger) the DB is always reachable, so the migration runs normally.
 */
import { spawnSync } from "child_process";

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: ["inherit", "inherit", "pipe"],
  shell: true,
});

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
    "[maybe-migrate] DB not reachable locally — skipping migration. Will run on Hostinger deploy."
  );
  process.exit(0);
}

// Real migration error — print it and fail the build
console.error(stderr);
process.exit(result.status ?? 1);

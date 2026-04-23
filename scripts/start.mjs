/**
 * start.mjs — production startup wrapper for Next.js standalone
 *
 * Guards against starting without a build, and ensures PORT/HOSTNAME
 * are correctly set for Hostinger's Node.js environment.
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const serverPath = join(root, ".next", "standalone", "server.js");

if (!existsSync(serverPath)) {
  console.error(
    "\n[start] ERROR: .next/standalone/server.js does not exist.\n" +
    "       Run 'npm run build' before starting the server.\n"
  );
  process.exit(1);
}

// Next.js standalone reads PORT and HOSTNAME from env.
// Default to 3000 / 0.0.0.0 if not set by the host.
process.env.PORT = process.env.PORT || "3000";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

console.log(`[start] Starting Next.js on ${process.env.HOSTNAME}:${process.env.PORT}`);

// Load the standalone server
const require = createRequire(import.meta.url);
require(serverPath);

import path from "path";

/**
 * Returns the absolute path to the uploads directory.
 *
 * In production (Hostinger), uploads MUST live outside the deploy directory
 * so that Git deploys don't wipe them. Set UPLOADS_DIR to a persistent path
 * (e.g. /home/u911413127/eccellere-uploads).
 *
 * Falls back to <APP_ROOT>/public/uploads for local development.
 */
export function getUploadsDir(): string {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  const appRoot = process.env.APP_ROOT ?? process.cwd();
  return path.join(appRoot, "public", "uploads");
}

/**
 * Given a stored fileUrl like "/uploads/assets/123-foo.docx",
 * returns the absolute filesystem path inside the uploads dir.
 *
 * Throws if the result would escape the uploads directory.
 */
export function resolveUploadPath(fileUrl: string): string {
  if (!fileUrl.startsWith("/uploads/")) {
    throw new Error("fileUrl must start with /uploads/");
  }
  const relative = fileUrl.replace(/^\/uploads\//, "");
  const uploadsDir = getUploadsDir();
  const absPath = path.join(uploadsDir, relative);
  const normalized = path.normalize(absPath);
  if (!normalized.startsWith(path.normalize(uploadsDir))) {
    throw new Error("Invalid file path (traversal attempt)");
  }
  return normalized;
}

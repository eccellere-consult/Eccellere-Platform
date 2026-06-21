import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getStorage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const key = pathSegments.join("/");

  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  try {
    if (process.env.STORAGE_PROVIDER !== "s3") {
      const uploadsDir = path.join(process.cwd(), ".uploads");
      const absolutePath = path.join(uploadsDir, key);
      const normalizedUploads = path.resolve(uploadsDir);
      const normalizedFile = path.resolve(absolutePath);

      if (!normalizedFile.startsWith(normalizedUploads)) {
        return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
      }

      if (!fs.existsSync(normalizedFile)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      const stat = fs.statSync(normalizedFile);
      const ext = path.extname(normalizedFile).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".avif": "image/avif",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
      };

      const nodeStream = fs.createReadStream(normalizedFile);
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) =>
            controller.enqueue(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
          );
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (error) => controller.error(error));
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          "Content-Type": contentTypeMap[ext] ?? "application/octet-stream",
          "Content-Length": String(stat.size),
          "Cache-Control": "public, max-age=600",
        },
      });
    }

    const storage = getStorage();
    const { url, expiresAt } = await storage.getSignedUrl(key, 3600);

    const target = new URL(url, request.url);
    target.searchParams.set("expires", expiresAt.toISOString());
    return NextResponse.redirect(target);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

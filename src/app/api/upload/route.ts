import { NextResponse } from "next/server";
import { getStorage, validateFile } from "@/lib/storage";
import { uploadLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limit
  const ip = getClientIp(request);
  const { success, remaining, resetInSeconds } = uploadLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many upload requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(resetInSeconds),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  try {
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";
    const category = (formData.get("category") as "image" | "document" | "video") || "document";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    // Validate
    const validation = validateFile(file.type, file.size, category);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: { "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    // Sanitise filename — strip path traversal attempts
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "_");

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorage();
    const result = await storage.upload(buffer, safeName, file.type, safeFolder);

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        file: {
          key: result.key,
          url: result.url,
          size: result.size,
          contentType: result.contentType,
        },
      },
      {
        status: 201,
        headers: { "X-RateLimit-Remaining": String(remaining) },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }
}

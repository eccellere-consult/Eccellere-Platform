import { NextRequest, NextResponse } from "next/server";
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
    const storage = getStorage();
    const { url, expiresAt } = await storage.getSignedUrl(key, 3600);

    return NextResponse.json({
      url,
      expiresAt: expiresAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

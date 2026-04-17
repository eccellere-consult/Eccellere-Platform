/**
 * File storage service for Eccellere platform.
 *
 * Provides a storage abstraction layer with two implementations:
 * - LocalStorage: development — saves to .uploads/ directory
 * - S3Storage: production — uses AWS S3 with CloudFront signed URLs
 *
 * The active implementation is selected by the STORAGE_PROVIDER env var.
 */

import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
}

export interface StorageProvider {
  upload(
    file: Buffer,
    filename: string,
    contentType: string,
    folder?: string
  ): Promise<UploadResult>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<SignedUrlResult>;
  delete(key: string): Promise<void>;
}

// ─── Local Storage (Development) ──────────────────────────────────────────────

const UPLOADS_DIR = path.join(process.cwd(), ".uploads");

class LocalStorage implements StorageProvider {
  async upload(
    file: Buffer,
    filename: string,
    contentType: string,
    folder = "general"
  ): Promise<UploadResult> {
    const ext = path.extname(filename) || ".bin";
    const hash = crypto.randomBytes(8).toString("hex");
    const safeFilename = `${Date.now()}-${hash}${ext}`;
    const key = `${folder}/${safeFilename}`;
    const fullPath = path.join(UPLOADS_DIR, folder);

    await fs.mkdir(fullPath, { recursive: true });
    await fs.writeFile(path.join(UPLOADS_DIR, key), file);

    return {
      key,
      url: `/api/files/${key}`,
      size: file.byteLength,
      contentType,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<SignedUrlResult> {
    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    return {
      url: `/api/files/${key}?token=${token}&expires=${expiresAt.toISOString()}`,
      expiresAt,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(UPLOADS_DIR, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File may not exist — silently ignore
    }
  }
}

// ─── S3 Storage (Production) ──────────────────────────────────────────────────

class S3Storage implements StorageProvider {
  private bucket: string;
  private region: string;
  private cdnDomain: string | null;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || "eccellere-assets";
    this.region = process.env.AWS_REGION || "ap-south-1";
    this.cdnDomain = process.env.CDN_DOMAIN || null;
  }

  async upload(
    file: Buffer,
    filename: string,
    contentType: string,
    folder = "general"
  ): Promise<UploadResult> {
    const ext = path.extname(filename) || ".bin";
    const hash = crypto.randomBytes(8).toString("hex");
    const key = `${folder}/${Date.now()}-${hash}${ext}`;

    // Dynamic import to avoid loading AWS SDK when not needed
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({ region: this.region });
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        CacheControl: "max-age=31536000, immutable",
      })
    );

    const url = this.cdnDomain
      ? `https://${this.cdnDomain}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { key, url, size: file.byteLength, contentType };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<SignedUrlResult> {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl: s3Sign } = await import("@aws-sdk/s3-request-presigner");

    const client = new S3Client({ region: this.region });
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await s3Sign(client, command, { expiresIn: expiresInSeconds });
    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  async delete(key: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({ region: this.region });
    await client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _storage: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (_storage) return _storage;

  if (process.env.STORAGE_PROVIDER === "s3") {
    _storage = new S3Storage();
  } else {
    _storage = new LocalStorage();
  }

  return _storage;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
  document: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  video: ["video/mp4", "video/webm"],
};

const MAX_FILE_SIZES: Record<string, number> = {
  image: 5 * 1024 * 1024,      // 5 MB
  document: 25 * 1024 * 1024,   // 25 MB
  video: 100 * 1024 * 1024,     // 100 MB
};

export function validateFile(
  contentType: string,
  size: number,
  category: "image" | "document" | "video" = "document"
): { valid: boolean; error?: string } {
  const allowed = ALLOWED_TYPES[category];
  if (!allowed?.includes(contentType)) {
    return { valid: false, error: `File type '${contentType}' is not allowed for ${category} uploads` };
  }

  const maxSize = MAX_FILE_SIZES[category];
  if (size > maxSize) {
    return {
      valid: false,
      error: `File size (${(size / 1024 / 1024).toFixed(1)} MB) exceeds the ${(maxSize / 1024 / 1024).toFixed(0)} MB limit`,
    };
  }

  return { valid: true };
}

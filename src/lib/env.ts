/**
 * Environment variable validation.
 * Call `validateEnv()` in server-side code or next.config.ts to fail fast
 * when required variables are missing in production.
 */

interface EnvSchema {
  required: string[];
  optional: string[];
}

const schema: EnvSchema = {
  required: [
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "DATABASE_URL",
  ],
  optional: [
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_POSTHOG_HOST",
    "NEXT_PUBLIC_SENTRY_DSN",
    "SENTRY_DSN",
    "SENTRY_AUTH_TOKEN",
    "AWS_S3_BUCKET",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "CDN_DOMAIN",
    "EMAIL_PROVIDER",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
  ],
};

export function validateEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing = schema.required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nSet these in your .env or Vercel project settings.`
    );
  }
}

/**
 * Typed accessor for common env vars with defaults for development.
 */
export const env = {
  // Auth
  nextauthSecret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",
  nextauthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",

  // Analytics (optional)
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",

  // Sentry (optional)
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? "",

  // Storage (optional — defaults to local in dev)
  storageMode: process.env.STORAGE_MODE ?? "local",
  s3Bucket: process.env.AWS_S3_BUCKET ?? "",
  awsRegion: process.env.AWS_REGION ?? "ap-south-1",
  cdnDomain: process.env.CDN_DOMAIN ?? "",

  // Email (optional — defaults to console in dev)
  emailProvider: process.env.EMAIL_PROVIDER ?? "console",

  // Razorpay (optional)
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",

  // Runtime
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;

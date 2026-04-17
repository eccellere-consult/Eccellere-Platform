// Sentry browser-side initialisation.
// Install: npm install @sentry/nextjs
// Then run: npx @sentry/wizard@latest -i nextjs --saas --org <org> --project <project>
// This file is loaded automatically by Next.js when @sentry/nextjs is installed.
export {};

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.05,
      debug: false,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  });
}

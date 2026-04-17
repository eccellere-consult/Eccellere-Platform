// Eccellere Transactional Email Templates
// React components that render to static HTML for email delivery

export interface EmailTemplateProps {
  recipientName: string;
}

// ─── Shared Styles ──────────────────────────────────────────────────────────

const wrapper = `
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px; margin: 0 auto; background: #FAF8F4; color: #0E0E0D;
`;

const header = `
  background: #1A1428; padding: 32px 40px; text-align: center;
`;

const logo = `
  font-family: 'Cormorant Garamond', Georgia, serif; color: #FFFFFF;
  font-size: 24px; font-weight: 600; letter-spacing: 0.05em;
`;

const body = `padding: 40px;`;

const h1 = `
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px; font-weight: 300; color: #0E0E0D; margin: 0 0 16px 0;
`;

const paragraph = `
  font-size: 15px; line-height: 1.6; color: #3A3935; margin: 0 0 16px 0;
`;

const cta = `
  display: inline-block; background: #B8913A; color: #FFFFFF;
  padding: 14px 32px; font-size: 14px; font-weight: 500;
  text-decoration: none; border-radius: 0;
`;

const footer = `
  background: #0E0E0D; padding: 24px 40px; text-align: center;
  font-size: 12px; color: #7A7870;
`;

const divider = `
  border: none; border-top: 1px solid #E5E2DB; margin: 24px 0;
`;

// ─── Welcome Email ──────────────────────────────────────────────────────────

export interface WelcomeEmailProps extends EmailTemplateProps {
  assessmentUrl: string;
}

export function renderWelcomeEmail({ recipientName, assessmentUrl }: WelcomeEmailProps): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;">
<div style="${wrapper}">
  <div style="${header}"><span style="${logo}">ECCELLERĒ</span></div>
  <div style="${body}">
    <h1 style="${h1}">Welcome to Eccellere, ${sanitize(recipientName)}</h1>
    <p style="${paragraph}">You've joined India's premier consulting and AI platform for MSMEs and startups. Here's how to get the most out of Eccellere:</p>
    <p style="${paragraph}"><strong>1. Take your AI Readiness Assessment</strong> — 5 questions, 2 minutes, personalised score with sector benchmarks.</p>
    <p style="${paragraph}"><strong>2. Browse the Marketplace</strong> — 200+ strategy frameworks, AI toolkits, and business playbooks designed for Indian businesses.</p>
    <p style="${paragraph}"><strong>3. Explore Perspectives</strong> — In-depth articles on strategy, AI, and transformation for MSMEs.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${sanitize(assessmentUrl)}" style="${cta}">Start Your Assessment →</a>
    </div>
    <hr style="${divider}">
    <p style="${paragraph}">Questions? Reply to this email or reach us at <a href="mailto:hello@eccellere.in" style="color:#B8913A;">hello@eccellere.in</a></p>
  </div>
  <div style="${footer}">
    <p style="margin:0;">© 2026 Eccellere Consulting Pvt. Ltd. · Bengaluru, India</p>
    <p style="margin:8px 0 0 0;"><a href="https://eccellere.in/unsubscribe" style="color:#7A7870;">Unsubscribe</a></p>
  </div>
</div>
</body></html>`;
}

// ─── Order Confirmation ─────────────────────────────────────────────────────

export interface OrderConfirmationProps extends EmailTemplateProps {
  orderId: string;
  assetTitle: string;
  price: string;
  downloadUrl: string;
}

export function renderOrderConfirmation({
  recipientName, orderId, assetTitle, price, downloadUrl,
}: OrderConfirmationProps): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;">
<div style="${wrapper}">
  <div style="${header}"><span style="${logo}">ECCELLERĒ</span></div>
  <div style="${body}">
    <h1 style="${h1}">Order Confirmed</h1>
    <p style="${paragraph}">Hi ${sanitize(recipientName)}, your purchase is confirmed. Here are the details:</p>
    <div style="background:#FFFFFF;border:1px solid #E5E2DB;padding:24px;margin:16px 0;">
      <p style="margin:0 0 8px 0;font-size:13px;color:#7A7870;">Order #${sanitize(orderId)}</p>
      <p style="margin:0 0 4px 0;font-size:16px;font-weight:500;color:#0E0E0D;">${sanitize(assetTitle)}</p>
      <p style="margin:0;font-size:20px;font-weight:500;color:#B8913A;">${sanitize(price)}</p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${sanitize(downloadUrl)}" style="${cta}">Download Now →</a>
    </div>
    <p style="${paragraph}">Your download link is also available in your <a href="https://eccellere.in/dashboard" style="color:#B8913A;">Dashboard</a>.</p>
    <hr style="${divider}">
    <p style="font-size:12px;color:#7A7870;margin:0;">This is a receipt for your purchase. No further action is required.</p>
  </div>
  <div style="${footer}">
    <p style="margin:0;">© 2026 Eccellere Consulting Pvt. Ltd. · Bengaluru, India</p>
  </div>
</div>
</body></html>`;
}

// ─── Assessment Results ─────────────────────────────────────────────────────

export interface AssessmentResultsProps extends EmailTemplateProps {
  score: number;
  level: string;
  reportUrl: string;
}

export function renderAssessmentResults({
  recipientName, score, level, reportUrl,
}: AssessmentResultsProps): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;">
<div style="${wrapper}">
  <div style="${header}"><span style="${logo}">ECCELLERĒ</span></div>
  <div style="${body}">
    <h1 style="${h1}">Your AI Readiness Score</h1>
    <p style="${paragraph}">Hi ${sanitize(recipientName)}, here are your assessment results:</p>
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:#1A1428;color:#FAF8F4;padding:32px 48px;text-align:center;">
        <p style="margin:0;font-size:48px;font-weight:300;font-family:'Cormorant Garamond',Georgia,serif;color:#B8913A;">${score}/100</p>
        <p style="margin:8px 0 0;font-size:14px;color:#FAF8F4;text-transform:uppercase;letter-spacing:0.1em;">${sanitize(level)}</p>
      </div>
    </div>
    <p style="${paragraph}">Your full report includes sector benchmarks, a prioritised action plan, and recommended Eccellere resources tailored to your score.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${sanitize(reportUrl)}" style="${cta}">View Full Report →</a>
    </div>
    <hr style="${divider}">
    <p style="${paragraph}">Want expert guidance? <a href="https://eccellere.in/contact" style="color:#B8913A;">Book a free consultation</a> with our team.</p>
  </div>
  <div style="${footer}">
    <p style="margin:0;">© 2026 Eccellere Consulting Pvt. Ltd. · Bengaluru, India</p>
  </div>
</div>
</body></html>`;
}

// ─── Newsletter ─────────────────────────────────────────────────────────────

export interface NewsletterProps extends EmailTemplateProps {
  articles: { title: string; teaser: string; url: string }[];
}

export function renderNewsletter({ recipientName, articles }: NewsletterProps): string {
  const articlesHtml = articles
    .map(
      (a) => `
      <div style="margin:0 0 24px 0;padding:0 0 24px 0;border-bottom:1px solid #E5E2DB;">
        <a href="${sanitize(a.url)}" style="font-size:17px;font-weight:500;color:#0E0E0D;text-decoration:none;font-family:'Cormorant Garamond',Georgia,serif;">${sanitize(a.title)}</a>
        <p style="margin:8px 0 0;font-size:14px;color:#3A3935;line-height:1.5;">${sanitize(a.teaser)}</p>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;">
<div style="${wrapper}">
  <div style="${header}"><span style="${logo}">ECCELLERĒ</span><p style="margin:8px 0 0;color:#7A7870;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;">Weekly Perspectives</p></div>
  <div style="${body}">
    <p style="${paragraph}">Hi ${sanitize(recipientName)}, here's this week's collection of insights for growth-minded businesses:</p>
    ${articlesHtml}
    <div style="text-align:center;margin:24px 0;">
      <a href="https://eccellere.in/perspectives" style="${cta}">Read More on Eccellere →</a>
    </div>
  </div>
  <div style="${footer}">
    <p style="margin:0;">© 2026 Eccellere Consulting Pvt. Ltd. · Bengaluru, India</p>
    <p style="margin:8px 0 0;"><a href="https://eccellere.in/unsubscribe" style="color:#7A7870;">Unsubscribe</a> · <a href="https://eccellere.in/preferences" style="color:#7A7870;">Email preferences</a></p>
  </div>
</div>
</body></html>`;
}

// ─── Utility ────────────────────────────────────────────────────────────────

function sanitize(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

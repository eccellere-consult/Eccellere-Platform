import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Cookie Policy | Eccellere",
  description:
    "How Eccellere uses cookies and similar technologies on its website and platform.",
};

const sections = [
  {
    id: "what-are-cookies",
    title: "1. What Are Cookies?",
    body: `Cookies are small text files stored by your browser when you visit a website. They allow the website to remember your preferences, keep you logged in, and understand how you use the site. Similar technologies — such as local storage, session storage, and pixels — work analogously.`,
  },
  {
    id: "types-we-use",
    title: "2. Types of Cookies We Use",
    body: `We use the following categories of cookies:

Strictly Necessary Cookies — Required for the website and platform to function. These include session authentication tokens, CSRF protection cookies, and preference settings. You cannot opt out of these without affecting core functionality.

Performance & Analytics Cookies — Help us understand how visitors interact with our site (pages visited, time on page, error events). We use privacy-respecting, consent-based analytics tools where available.

Functionality Cookies — Remember choices you have made (such as theme preference or your last viewed service) to improve your experience on return visits.

Marketing Cookies — We do not currently run advertising campaigns that require third-party marketing cookies. Should this change, we will update this policy and seek your prior consent.`,
  },
  {
    id: "third-party",
    title: "3. Third-Party Cookies",
    body: `Certain third-party services embedded in or connected to our platform may set their own cookies. These include:

• Razorpay — payment processing (strictly necessary for checkout)
• Sentry — error monitoring (performance, non-identifying)
• Vercel Analytics — web analytics (aggregated, consent-based)

We do not sell or share personal data obtained via cookies with advertisers or data brokers.`,
  },
  {
    id: "duration",
    title: "4. Cookie Duration",
    body: `Session cookies expire when you close your browser. Persistent cookies remain until their expiry date or until you delete them. Authentication tokens for logged-in users are session-scoped by default; "remember me" functionality sets a persistent token valid for 30 days.`,
  },
  {
    id: "managing",
    title: "5. Managing and Withdrawing Consent",
    body: `You can control cookies at any time:

Browser settings — Most browsers allow you to block or delete cookies via Settings → Privacy → Cookies. Note that blocking strictly necessary cookies will prevent login and checkout from working.

Our cookie banner — When you first visit, we display a consent banner for non-essential cookies. You can change your choices at any time via the "Cookie Preferences" link in the footer.

Opt-out links — For analytics tools that support it, we provide direct opt-out links in our Privacy Policy.

Withdrawing consent does not affect the lawfulness of any processing based on consent before your withdrawal.`,
  },
  {
    id: "indian-law",
    title: "6. Applicable Law",
    body: `This Cookie Policy is governed by the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023 (DPDP Act). We process personal data collected via cookies only with a lawful basis under the DPDP Act — either your explicit consent or our legitimate interests where the impact on your rights is minimal.`,
  },
  {
    id: "changes",
    title: "7. Changes to This Policy",
    body: `We may update this Cookie Policy when we add new services, change technology vendors, or in response to regulatory changes. Material changes will be communicated via a banner notification on the website.

Last updated: June 2025`,
  },
  {
    id: "contact",
    title: "8. Contact",
    body: `For questions about our use of cookies, contact our Data Protection Officer:

Eccellere Consulting Pvt. Ltd.
Email: contact@eccellere.in
Address: Bengaluru, India`,
  },
];

export default function CookiePolicyPage() {
  return (
    <>
      <Header />
      <main className="pt-[72px]">
        {/* Hero */}
        <section className="bg-eccellere-ink py-16 text-white">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.15em] text-eccellere-gold">
              Legal
            </p>
            <h1 className="font-display text-4xl font-semibold md:text-5xl">
              Cookie Policy
            </h1>
            <p className="mt-4 text-white/60">Last updated: June 2025</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="mx-auto grid max-w-[1280px] gap-10 px-6 lg:grid-cols-[220px_1fr]">
            {/* Sidebar TOC */}
            <nav className="hidden lg:block">
              <ul className="sticky top-24 space-y-2 text-sm">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block text-ink-mid transition-colors hover:text-eccellere-gold"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Body */}
            <div className="space-y-10">
              <p className="text-base leading-relaxed text-ink-mid">
                This Cookie Policy explains how Eccellere Consulting Pvt. Ltd.
                (&ldquo;Eccellere&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) uses cookies and similar
                tracking technologies on our website (eccellere.in) and client
                platform.
              </p>

              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="mb-3 font-display text-xl font-semibold text-eccellere-ink">
                    {s.title}
                  </h2>
                  <div className="space-y-3">
                    {s.body.split("\n\n").map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed text-ink-mid whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

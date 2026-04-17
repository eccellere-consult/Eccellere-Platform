import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Eccellere Consulting",
  description:
    "Learn how Eccellere Consulting collects, uses, and protects your personal data in compliance with the Digital Personal Data Protection Act, 2023.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "1 January 2025";
const CONTACT_EMAIL = "privacy@eccellere.in";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-base text-gray-800">
      <header className="mb-12">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-700 mb-3">
          Legal
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="prose prose-gray max-w-none space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
          <p>
            Eccellere Consulting Private Limited (&ldquo;Eccellere&rdquo;, &ldquo;we&rdquo;,
            &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting the privacy and
            security of your personal data. This Privacy Policy explains how we collect, use, store,
            share, and protect information about you when you access our website at{" "}
            <Link href="/" className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
              eccellere.in
            </Link>{" "}
            or use any of our services.
          </p>
          <p className="mt-3">
            This Policy is compliant with the{" "}
            <strong>Digital Personal Data Protection Act, 2023</strong> (DPDP Act) and applicable
            rules thereunder. By using our website or services, you consent to the practices
            described in this Policy.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Data Fiduciary</h2>
          <p>
            For the purposes of the DPDP Act, 2023, Eccellere Consulting Private Limited is the{" "}
            <strong>Data Fiduciary</strong>. Our registered address and contact details are
            available on our{" "}
            <Link href="/contact" className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
              Contact page
            </Link>
            . You may reach our privacy team at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Personal Data We Collect</h2>
          <p>We may collect the following categories of personal data:</p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>
              <strong>Identity data:</strong> Full name, job title, company name.
            </li>
            <li>
              <strong>Contact data:</strong> Email address, phone number, mailing address.
            </li>
            <li>
              <strong>Account data:</strong> Username, password hash, account preferences.
            </li>
            <li>
              <strong>Transaction data:</strong> Details of frameworks, tools, and consulting
              services purchased or subscribed to.
            </li>
            <li>
              <strong>Usage data:</strong> Pages visited, features used, time spent, device type,
              browser type, and IP address.
            </li>
            <li>
              <strong>Communication data:</strong> Messages sent via contact forms, support requests,
              or email correspondence.
            </li>
            <li>
              <strong>Marketing preferences:</strong> Your opt-in or opt-out status for
              communications.
            </li>
          </ul>
          <p className="mt-3">
            We do not knowingly collect personal data from individuals under 18 years of age. If you
            believe we have inadvertently collected such data, please contact us immediately.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. How We Use Your Data</h2>
          <p>We use personal data for the following lawful purposes:</p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>To create and manage your account and provide access to purchased content.</li>
            <li>To process transactions and send transactional emails (receipts, access confirmations).</li>
            <li>To provide consulting services you have engaged us for.</li>
            <li>To respond to enquiries and provide customer support.</li>
            <li>To send newsletters, insights, and marketing updates — only where you have opted in.</li>
            <li>To improve our website and services through analytics and usage data.</li>
            <li>To comply with legal and regulatory obligations.</li>
            <li>To prevent fraud, abuse, and security threats.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Lawful Basis for Processing</h2>
          <p>We process your personal data on the following lawful bases under the DPDP Act, 2023:</p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>
              <strong>Consent:</strong> For marketing communications and analytics cookies. You may
              withdraw consent at any time.
            </li>
            <li>
              <strong>Contractual necessity:</strong> To deliver services you have purchased or
              engaged us to provide.
            </li>
            <li>
              <strong>Legitimate interests:</strong> For fraud prevention, security, and improving
              our services.
            </li>
            <li>
              <strong>Legal obligation:</strong> Where we are required by law to process or retain
              data.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share your data with trusted third parties
            only when necessary:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>
              <strong>Payment processors</strong> (Razorpay) — to process payments securely. They
              are PCI-DSS compliant and governed by their own privacy policies.
            </li>
            <li>
              <strong>Cloud infrastructure providers</strong> (Vercel, AWS) — for hosting and
              storage.
            </li>
            <li>
              <strong>Analytics providers</strong> (Google Analytics, PostHog) — for usage insights,
              subject to your consent and our cookie settings.
            </li>
            <li>
              <strong>Error monitoring</strong> (Sentry) — for application error tracking.
            </li>
            <li>
              <strong>Email service providers</strong> — to send transactional and marketing emails.
            </li>
            <li>
              <strong>Legal authorities</strong> — when required by law, court order, or to protect
              our rights.
            </li>
          </ul>
          <p className="mt-3">
            All third-party service providers are contractually bound to handle your data
            securely and only for the purposes we specify.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
          <p>
            We retain personal data only for as long as necessary for the purposes outlined in this
            Policy, or as required by law:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>Account data: for the duration of your account plus 3 years after closure.</li>
            <li>Transaction data: 7 years for statutory compliance.</li>
            <li>Marketing data: until you withdraw consent or unsubscribe.</li>
            <li>Usage analytics: aggregated data retained for up to 26 months.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
          <p>Under the DPDP Act, 2023, you have the following rights as a Data Principal:</p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>
              <strong>Right to access:</strong> Request a summary of personal data we hold about
              you.
            </li>
            <li>
              <strong>Right to correction:</strong> Request correction of inaccurate or incomplete
              data.
            </li>
            <li>
              <strong>Right to erasure:</strong> Request deletion of your personal data, subject to
              legal retention obligations.
            </li>
            <li>
              <strong>Right to grievance redressal:</strong> Raise a grievance with our Data
              Protection Officer; we will respond within 30 days.
            </li>
            <li>
              <strong>Right to nominate:</strong> Nominate another individual to exercise rights on
              your behalf in case of death or incapacity.
            </li>
            <li>
              <strong>Right to withdraw consent:</strong> Withdraw consent for marketing or
              analytics processing at any time.
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
              {CONTACT_EMAIL}
            </a>
            . We may ask you to verify your identity before processing the request.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies</h2>
          <p>
            We use cookies and similar technologies to operate our website and collect usage data.
            These include:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>
              <strong>Essential cookies:</strong> Required for authentication and security. Cannot
              be disabled.
            </li>
            <li>
              <strong>Analytics cookies:</strong> Track site usage (Google Analytics, PostHog).
              Loaded only with your consent.
            </li>
            <li>
              <strong>Functional cookies:</strong> Remember your preferences and settings.
            </li>
          </ul>
          <p className="mt-3">
            You can manage cookie preferences in your browser settings. Disabling essential cookies
            may affect site functionality.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Data Security</h2>
          <p>
            We implement industry-standard technical and organisational measures to protect your
            personal data, including:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>HTTPS encryption for all web traffic.</li>
            <li>Passwords stored using secure hashing algorithms (bcrypt, Argon2).</li>
            <li>Role-based access controls limiting data access to authorised personnel only.</li>
            <li>Regular security reviews and vulnerability assessments.</li>
            <li>Payment data handled exclusively via PCI-DSS compliant Razorpay — we do not store card details.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Cross-Border Data Transfers</h2>
          <p>
            Our primary infrastructure is located in India (Mumbai region). Where data is processed
            or stored outside India — for example by certain analytics or cloud providers — we
            ensure appropriate safeguards are in place as required under the DPDP Act and applicable
            guidelines issued by the Data Protection Board of India.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be notified
            via email or a prominent notice on our website. The &ldquo;Last updated&rdquo; date at
            the top of this page reflects the most recent revision. Continued use of our services
            after changes take effect constitutes acceptance of the revised Policy.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Us</h2>
          <p>
            For privacy-related questions, requests, or to lodge a grievance, please contact our
            Data Protection Officer:
          </p>
          <address className="not-italic mt-3 space-y-1 text-gray-700">
            <p>
              <strong>Data Protection Officer</strong>
            </p>
            <p>Eccellere Consulting Private Limited</p>
            <p>
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
                {CONTACT_EMAIL}
              </a>
            </p>
          </address>
          <p className="mt-3">
            If you are not satisfied with our response, you have the right to lodge a complaint with
            the{" "}
            <strong>Data Protection Board of India</strong> once constituted under the DPDP Act,
            2023.
          </p>
        </div>
      </section>

      <footer className="mt-16 border-t pt-8 text-sm text-gray-500 flex flex-wrap gap-4">
        <Link href="/terms" className="hover:text-amber-700 transition-colors">
          Terms of Service
        </Link>
        <Link href="/refund" className="hover:text-amber-700 transition-colors">
          Refund Policy
        </Link>
        <Link href="/contact" className="hover:text-amber-700 transition-colors">
          Contact Us
        </Link>
      </footer>
    </main>
  );
}

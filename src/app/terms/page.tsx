import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Eccellere Consulting",
  description:
    "Read the Terms of Service governing use of the Eccellere Consulting website, marketplace, and consulting services.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "1 January 2025";
const CONTACT_EMAIL = "legal@eccellere.in";
const GOVERNING_LAW = "the courts of Mumbai, Maharashtra, India";

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-base text-gray-800">
      <header className="mb-12">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-700 mb-3">
          Legal
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="prose prose-gray max-w-none space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement
            between you (&ldquo;User&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) and
            Eccellere Consulting Private Limited (&ldquo;Eccellere&rdquo;, &ldquo;we&rdquo;,
            &ldquo;our&rdquo;, or &ldquo;us&rdquo;), governing your access to and use of the
            website at eccellere.in and all related services, including the Marketplace, consulting
            engagements, and digital tools.
          </p>
          <p className="mt-3">
            By accessing or using any part of our platform, you confirm that you have read,
            understood, and agreed to be bound by these Terms together with our{" "}
            <Link href="/privacy" className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/refund" className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
              Refund Policy
            </Link>
            . If you do not agree, please discontinue use immediately.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligibility</h2>
          <p>You must be at least 18 years of age and have the legal capacity to enter into a binding contract to use our services. By using our platform, you represent and warrant that you meet these requirements. If you are acting on behalf of an organisation, you further represent that you have the authority to bind that organisation to these Terms.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Services Offered</h2>
          <p>Eccellere provides the following services under these Terms:</p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>
              <strong>Marketplace:</strong> A digital library of strategic frameworks, assessment
              tools, playbooks, and templates available for individual purchase or subscription.
            </li>
            <li>
              <strong>Consulting Services:</strong> Tailored advisory engagements in Strategy,
              Agentic AI, Process Transformation, Digital Transformation, and Organisation Design.
            </li>
            <li>
              <strong>Perspectives / Publications:</strong> Free editorial content, case studies,
              and research reports.
            </li>
            <li>
              <strong>AI-powered tools:</strong> Diagnostic tools, readiness assessments, and guided
              frameworks delivered via the platform.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Accounts</h2>
          <p>
            To access certain features, you must register for an account. You agree to:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>Provide accurate, current, and complete registration information.</li>
            <li>Keep your password confidential and not share it with third parties.</li>
            <li>Notify us immediately at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
                {CONTACT_EMAIL}
              </a>{" "}
              of any unauthorised access to your account.
            </li>
            <li>Accept responsibility for all activity occurring under your account.</li>
          </ul>
          <p className="mt-3">
            We reserve the right to suspend or terminate accounts that violate these Terms or engage
            in fraudulent, abusive, or illegal activity.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Marketplace Purchases</h2>
          <p>
            All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless
            otherwise stated. Payments are processed securely through Razorpay. By completing a
            purchase, you confirm that:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>You are authorised to use the payment method provided.</li>
            <li>Payment will be charged in full at the time of transaction.</li>
            <li>Digital products are delivered immediately upon payment confirmation.</li>
          </ul>
          <p className="mt-3">
            We issue GST-compliant invoices for all purchases. If you require a specific billing
            entity or GSTIN on your invoice, please contact us before completing the purchase.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
          <p>
            All content on the Eccellere platform — including but not limited to frameworks,
            templates, assessments, written content, graphics, logos, and software — is the
            exclusive intellectual property of Eccellere Consulting Private Limited or its licensors,
            protected under Indian copyright law, trademark law, and applicable international
            conventions.
          </p>
          <p className="mt-3">
            Upon purchasing a digital asset, you are granted a{" "}
            <strong>non-exclusive, non-transferable, revocable licence</strong> to use the asset for
            your internal business purposes only. You may not:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>Reproduce, redistribute, sublicense, or resell any purchased content.</li>
            <li>Remove copyright notices or proprietary markings.</li>
            <li>Use content for training AI models or creating derivative competitive products.</li>
            <li>Share access credentials to allow third parties to access purchased content.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Consulting Engagements</h2>
          <p>
            Consulting services are governed by a separate Statement of Work (&ldquo;SOW&rdquo;) or
            engagement letter agreed between the parties. In the event of any conflict between these
            Terms and a SOW, the SOW shall prevail with respect to that specific engagement.
          </p>
          <p className="mt-3">
            All advice, frameworks, and recommendations provided through consulting engagements
            represent our professional opinion based on information provided by the client.
            Implementation outcomes depend on client execution and external factors beyond our
            control. We do not guarantee specific business results.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>Use the platform for any unlawful purpose or in violation of these Terms.</li>
            <li>Attempt to gain unauthorised access to any system, database, or user account.</li>
            <li>Upload or transmit malicious code, viruses, or harmful software.</li>
            <li>Scrape, crawl, or extract data from the platform without our express written consent.</li>
            <li>Impersonate Eccellere, its employees, or any other person or entity.</li>
            <li>Post false, misleading, or defamatory content.</li>
            <li>Interfere with or disrupt the platform&apos;s infrastructure or servers.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Third-Party Links and Services</h2>
          <p>
            Our platform may contain links to third-party websites or integrate with third-party
            services. These links are provided for convenience only. We do not endorse, control, or
            accept responsibility for the content, privacy practices, or terms of any third-party
            sites or services. Your interactions with third parties are solely between you and them.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Disclaimers</h2>
          <p>
            The platform and all content are provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; without warranties of any kind, express or implied, including but not
            limited to warranties of merchantability, fitness for a particular purpose, or
            non-infringement. We do not warrant that:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>The platform will be uninterrupted, error-free, or secure at all times.</li>
            <li>Any specific business outcomes will result from use of our frameworks or advice.</li>
            <li>Information on the platform is complete, accurate, or current at all times.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Eccellere shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages arising from your
            use of or inability to use the platform or services. Our total aggregate liability for
            any claim arising from or related to these Terms or your use of our services shall not
            exceed the amount you paid to Eccellere in the 12 months preceding the claim.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Refunds</h2>
          <p>
            Our refund policy is set out in the{" "}
            <Link href="/refund" className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
              Refund Policy
            </Link>
            {" "}
            which is incorporated into these Terms by reference.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Material changes will be notified
            via email or a prominent website notice at least 14 days before taking effect. Your
            continued use of the platform after changes take effect constitutes acceptance of the
            revised Terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Termination</h2>
          <p>
            Either party may terminate this agreement at any time. We may suspend or terminate your
            access immediately if you violate these Terms. Upon termination, your right to access
            the platform and purchased content ceases. Provisions that by their nature should survive
            termination — including intellectual property, disclaimers, and limitation of liability
            — shall survive.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These Terms are governed by the laws of India. Any dispute arising from or in connection
            with these Terms shall first be subject to good-faith negotiation. If unresolved within
            30 days, disputes shall be submitted to binding arbitration under the Arbitration and
            Conciliation Act, 1996. The seat of arbitration shall be Mumbai, Maharashtra. Judgment
            on the arbitral award may be entered in any court of competent jurisdiction. For interim
            relief, the parties submit to the exclusive jurisdiction of {GOVERNING_LAW}.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Contact</h2>
          <p>
            For legal enquiries, notices, or questions about these Terms, please contact:
          </p>
          <address className="not-italic mt-3 space-y-1 text-gray-700">
            <p>
              <strong>Legal Team</strong>
            </p>
            <p>Eccellere Consulting Private Limited</p>
            <p>
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline underline-offset-2 hover:text-amber-900">
                {CONTACT_EMAIL}
              </a>
            </p>
          </address>
        </div>
      </section>

      <footer className="mt-16 border-t pt-8 text-sm text-gray-500 flex flex-wrap gap-4">
        <Link href="/privacy" className="hover:text-amber-700 transition-colors">
          Privacy Policy
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

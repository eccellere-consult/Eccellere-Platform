import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy | Eccellere Consulting",
  description:
    "Eccellere Consulting's refund and cancellation policy for Marketplace purchases and consulting engagements.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "1 January 2025";
const SUPPORT_EMAIL = "support@eccellere.in";

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-base text-gray-800">
      <header className="mb-12">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-700 mb-3">
          Legal
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
        <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
      </header>

      {/* Highlight box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-10">
        <p className="text-amber-900 font-medium text-lg">
          14-Day Money-Back Guarantee on Marketplace Purchases
        </p>
        <p className="text-amber-800 mt-2 text-sm leading-relaxed">
          If you are not satisfied with a digital asset purchased from the Eccellere Marketplace,
          request a full refund within 14 days of purchase — no questions asked. Eligibility
          conditions apply as described below.
        </p>
      </div>

      <section className="prose prose-gray max-w-none space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Scope</h2>
          <p>
            This Refund Policy applies to all transactions on the Eccellere platform, including:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>Individual Marketplace asset purchases (frameworks, templates, assessments).</li>
            <li>Annual subscription plans (MSME Pro, Startup Bundle).</li>
            <li>Consulting service retainers and project engagements.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            2. Marketplace Digital Assets — 14-Day Refund
          </h2>
          <p>
            We offer a <strong>14-day money-back guarantee</strong> on all individual Marketplace
            purchases, provided the following conditions are met:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>The refund request is submitted within 14 calendar days of the purchase date.</li>
            <li>
              The asset has not been downloaded more than once, or has not been materially used
              (e.g., the framework has not been presented to third parties or embedded in client
              deliverables).
            </li>
            <li>
              The request is submitted via email to{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              with your order ID and a brief reason for the refund.
            </li>
          </ul>
          <p className="mt-3">
            Approved refunds will be credited to the original payment method within{" "}
            <strong>5–7 business days</strong>. Razorpay processing times may vary.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            3. Non-Refundable Situations
          </h2>
          <p>Refunds will <strong>not</strong> be issued in the following cases:</p>
          <ul className="list-disc ml-6 mt-3 space-y-2">
            <li>
              The refund request is submitted more than 14 days after the original purchase date.
            </li>
            <li>
              The digital asset has been downloaded multiple times or is confirmed to have been used
              in client-facing work.
            </li>
            <li>
              The purchase was for a free or heavily discounted promotional asset (price ₹0 or
              &gt;70% discount).
            </li>
            <li>
              Account suspension or termination due to violation of the{" "}
              <Link
                href="/terms"
                className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
              >
                Terms of Service
              </Link>
              .
            </li>
            <li>
              Partial use of bundled or multi-asset packs (unless none of the assets have been
              accessed).
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Annual Subscription Plans</h2>
          <p>
            Annual subscription plans (MSME Pro, Startup Bundle, Enterprise) include a{" "}
            <strong>14-day full refund window</strong> from the date of first subscription payment.
            After 14 days, subscriptions are non-refundable for the remainder of the billing period.
          </p>
          <p className="mt-3">
            You may cancel your subscription at any time from your account dashboard. Cancellation
            stops future renewal charges but does not entitle you to a partial refund of unused
            subscription months.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            5. Consulting Engagements — Cancellation Policy
          </h2>
          <p>
            Consulting engagements are governed by the specific Statement of Work (SOW) agreed
            between the parties. General cancellation terms are:
          </p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">
                    Cancellation Notice
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">
                    Refund Entitlement
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">≥ 14 days before engagement start</td>
                  <td className="px-4 py-3">100% refund of retainer paid</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">7–13 days before engagement start</td>
                  <td className="px-4 py-3">50% refund of retainer paid</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">&lt; 7 days before engagement start</td>
                  <td className="px-4 py-3">No refund (consulting slot reserved)</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">After engagement has commenced</td>
                  <td className="px-4 py-3">
                    Pro-rata refund for undelivered milestone work only; at our discretion
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Exceptional circumstances (medical emergencies, force majeure events) will be reviewed
            case-by-case with full empathy and flexibility.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. How to Request a Refund</h2>
          <ol className="list-decimal ml-6 mt-3 space-y-2">
            <li>
              Email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              with the subject line:{" "}
              <em>&ldquo;Refund Request — [Order ID]&rdquo;</em>.
            </li>
            <li>Include your name, registered email address, order ID, and purchase date.</li>
            <li>Briefly describe the reason for your refund request.</li>
          </ol>
          <p className="mt-3">
            We will acknowledge your request within <strong>1 business day</strong> and resolve it
            within <strong>3 business days</strong>. Approved refunds are processed within
            5–7 business days via Razorpay to the original payment method.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Disputes</h2>
          <p>
            If you are dissatisfied with a refund decision, you may escalate to our senior team at{" "}
            <a
              href="mailto:legal@eccellere.in"
              className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              legal@eccellere.in
            </a>
            . Unresolved disputes are subject to the dispute resolution process outlined in our{" "}
            <Link
              href="/terms"
              className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              Terms of Service
            </Link>
            .
          </p>
          <p className="mt-3">
            For payment disputes raised directly with Razorpay or your bank (chargebacks), please
            notify us first — we will work with you to resolve the matter quickly and avoid
            unnecessary escalation.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Currency and Processing</h2>
          <p>
            All refunds are processed in Indian Rupees (INR) to the original payment method. We are
            not responsible for exchange rate differences if your bank converted the original charge
            to a foreign currency. Razorpay and banking institution processing times (5–7 business
            days) are outside our control.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. The revised Policy will apply to
            purchases made after the updated effective date. For purchases made prior to an update,
            the Policy in effect at the time of purchase applies.
          </p>
        </div>
      </section>

      <footer className="mt-16 border-t pt-8 text-sm text-gray-500 flex flex-wrap gap-4">
        <Link href="/privacy" className="hover:text-amber-700 transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-amber-700 transition-colors">
          Terms of Service
        </Link>
        <Link href="/contact" className="hover:text-amber-700 transition-colors">
          Contact Us
        </Link>
      </footer>
    </main>
  );
}

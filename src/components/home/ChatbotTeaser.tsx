"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatbotTeaser() {
  return (
    <section className="bg-eccellere-cream py-20 lg:py-[120px]">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2">
        {/* Left: chat illustration */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-lg bg-eccellere-ink p-8"
        >
          <div className="space-y-4">
            {/* Sample conversation bubbles */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-l-lg rounded-tr-lg bg-eccellere-gold/20 px-4 py-3 text-sm text-eccellere-cream">
                I run a mid-size manufacturing unit. Where should I start with
                AI?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-r-lg rounded-tl-lg bg-white/10 px-4 py-3 text-sm text-eccellere-cream">
                Great question! Based on your sector, I&apos;d recommend starting with
                our AI Readiness Assessment and then exploring our Lean + AI
                manufacturing toolkit. Shall I guide you through it?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-l-lg rounded-tr-lg bg-eccellere-gold/20 px-4 py-3 text-sm text-eccellere-cream">
                Yes, and what would it cost?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-r-lg rounded-tl-lg bg-white/10 px-4 py-3 text-sm text-eccellere-cream">
                The assessment is free. The toolkit starts at ₹2,499. I can
                also connect you with a specialist if you need hands-on support.
              </div>
            </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-eccellere-gold/10 blur-2xl" />
        </motion.div>

        {/* Right: copy */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <MessageCircle className="h-10 w-10 text-eccellere-gold" strokeWidth={1.5} />
          <h2 className="mt-6 font-display text-[clamp(28px,5vw,42px)] font-light leading-tight text-eccellere-ink">
            Not sure where to start?{" "}
            <span className="italic">Let our AI advisor guide you</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-mid">
            Tell us about your business challenges. Our AI-powered advisor will
            recommend the right frameworks, packages, and experts — in under 2
            minutes.
          </p>
          <Button asChild className="mt-8">
            <Link href="#chatbot">Start a Conversation →</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

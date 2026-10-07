import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get help with an order, payment, or account on SkillShift.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[800px] px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-sm font-medium text-text-muted">Company</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
            Talk to a human.
          </h1>
          <p className="mt-4 text-lg leading-8 text-text-muted">
            Order issue, payment question, or account help — write to us and
            we&apos;ll sort it out.
          </p>
        </Reveal>
        <Reveal delay={90}>
          <section aria-label="Contact details" className="mt-10 rounded-[18px] border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-bold">Support</h2>
            <p className="mt-2 text-[15px] leading-7 text-text-muted">
              Email us at{" "}
              <a href="mailto:support@skillshift.example" className="font-semibold text-primary hover:underline">
                support@skillshift.example
              </a>{" "}
              with your order ID (first 8 characters are enough) and a short
              description. We reply within two business days.
            </p>
            <h2 className="mt-6 text-xl font-bold">Disputes</h2>
            <p className="mt-2 text-[15px] leading-7 text-text-muted">
              Already in a dispute? Open it from your order page — an admin
              reviews the full order context and decides. No email needed.
            </p>
          </section>
        </Reveal>
      </div>
    </main>
  );
}

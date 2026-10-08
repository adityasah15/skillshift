import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The rules for using SkillShift: accounts, ordering, escrow, delivery, disputes, and reviews.",
  alternates: { canonical: "/terms" },
};

const sections: Array<{ heading: string; body: string[] }> = [
  {
    heading: "Accounts",
    body: [
      "One account per person. Register as a client to order work or as a freelancer to sell it, with an email and a password of at least 8 characters.",
      "Verify your email to keep the account in good standing. Admins may disable accounts that abuse the marketplace.",
    ],
  },
  {
    heading: "Ordering and escrow",
    body: [
      "When a client places an order, the full price is held in escrow — visible to both sides, owned by neither until the order resolves.",
      "Accepting a delivery releases the payment to the freelancer. Cancelling before delivery refunds it to the client.",
      "Delivered orders auto-complete 7 days after delivery if the client takes no action.",
      "Test mode — no real money moves. Balances and escrow on SkillShift are demonstration funds.",
    ],
  },
  {
    heading: "Delivery and disputes",
    body: [
      "Freelancers deliver with a written note and optional files. Only meaningful, original work may be delivered.",
      "If delivery falls short, the client can open a dispute instead of accepting. Funds stay held while a dispute is open and an admin reviews the full order context before resolving.",
    ],
  },
  {
    heading: "Reviews and listings",
    body: [
      "Reviews can be left after completed orders and appear publicly on the service. Honest, specific reviews keep the marketplace trustworthy.",
      "Freelancer listings go through review before becoming visible. Listings that misrepresent the work may be rejected or removed.",
    ],
  },
  {
    heading: "Changes",
    body: [
      "These terms may change as SkillShift grows. Material changes will be announced in-app before they take effect.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[800px] px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-sm font-medium text-text-muted">Legal</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
            Terms of use
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-text-muted">
            Last updated October 2026. The short version: be honest, deliver what
            you promised, and let escrow handle the awkward money part.
          </p>
        </Reveal>
        {sections.map((s, i) => (
          <Reveal key={s.heading} delay={60 + i * 40}>
            <section aria-label={s.heading} className="mt-8 rounded-[18px] border border-border bg-surface p-6 sm:p-8">
              <h2 className="text-xl font-bold">{s.heading}</h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 24)} className="mt-3 max-w-[68ch] text-[15px] leading-7 text-text-muted">
                  {p}
                </p>
              ))}
            </section>
          </Reveal>
        ))}
      </div>
    </main>
  );
}

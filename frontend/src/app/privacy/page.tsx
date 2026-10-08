import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What SkillShift collects, why, and how your account, messages, files, and wallet data are handled.",
  alternates: { canonical: "/privacy" },
};

const sections: Array<{ heading: string; body: string[] }> = [
  {
    heading: "What we collect",
    body: [
      "Account details: email, password (stored hashed), role, and verification state.",
      "Profile details you choose to share: display name, bio, avatar, skills, and portfolio links or files.",
      "Order content: requirements, delivery notes and files, reviews, and dispute reasons.",
      "Messages exchanged in order discussions, and a wallet ledger of deposits, escrow movements, and withdrawals.",
    ],
  },
  {
    heading: "How we use it",
    body: [
      "To run the marketplace: matching clients with freelancers, holding escrow, resolving disputes, and keeping both sides informed through notifications.",
      "We do not sell personal data. The other party in your order can see your discussion, delivery, and public profile — that is how the work gets done.",
      "Admins can view order context, including messages and files, when resolving a dispute.",
    ],
  },
  {
    heading: "Sign-in and devices",
    body: [
      "Your session token lives in this browser's session storage and is sent with each request. Signing in sets a refresh cookie that the server manages; signing out clears both.",
      "Use a private device, or log out when you are done on a shared one.",
    ],
  },
  {
    heading: "Files",
    body: [
      "Avatars, service images, portfolio files, and delivery attachments are stored as private files. Delivery files are served through short-lived links available only to the order's participants.",
    ],
  },
  {
    heading: "Retention and deletion",
    body: [
      "Order, payment, and dispute records are kept while needed for trust and safety, including after an account is closed.",
      "To request export or deletion of your personal data, contact us and we will respond within a reasonable time, subject to record-keeping obligations.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-bg">
      <div className="mx-auto max-w-[800px] px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-sm font-medium text-text-muted">Legal</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy policy
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-text-muted">
            Last updated October 2026. Your work stays yours; your data is used
            to run the marketplace and nothing else.
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

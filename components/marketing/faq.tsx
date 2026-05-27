import { SectionReveal } from "@/components/marketing/section-reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is Tracxo really free?",
    a: "Yes — for groups of up to 10. We're funded by a future Pro tier (advanced analytics, exports, custom currencies). The free tier covers ~99% of what people need.",
  },
  {
    q: "What happens to my data if I delete a workspace?",
    a: "Soft-deleted workspaces are recoverable for 30 days. After that, expenses, splits, and settlements are permanently removed. Audit log entries you authored stay (anonymized).",
  },
  {
    q: "Can I use Tracxo for trips with foreign currency?",
    a: "Yes. Each workspace has a default currency, but individual expenses can be in any currency. Balances are computed per-currency.",
  },
  {
    q: "Does Tracxo support UPI / PayPal / Venmo?",
    a: "UPI deep-links are first-class today. PayPal and Venmo integrations are on the v2 roadmap. You can always record a settlement manually with any method.",
  },
  {
    q: "What's debt simplification?",
    a: "Instead of N people owing N other people, Tracxo computes the minimum cash-flow graph. A 4-person trip with 6 expenses often settles in 2 transfers, not 6.",
  },
  {
    q: "Can I export my expense history?",
    a: "Yes — CSV export from any workspace. Includes expenses, splits, payer, currency, and category.",
  },
  {
    q: "How does Tracxo handle privacy?",
    a: "Sessions live in our database, not third-party cookies. We don't sell data. You can delete your account at any time — historical entries you authored are anonymized to 'Removed user'.",
  },
  {
    q: "Open source?",
    a: "Not today. The plan is to open-source the core scheduling + debt-simplification libs once the surface stabilizes.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-8">
      <SectionReveal className="mx-auto mb-12 max-w-2xl text-center">
        <p className="font-medium text-emerald-700 text-xs uppercase tracking-[0.18em] dark:text-emerald-400">
          FAQ
        </p>
        <h2 className="mt-2 font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
          Common questions.
        </h2>
      </SectionReveal>
      <SectionReveal delay={0.1}>
        <Accordion className="grid auto-rows-min items-start gap-3 sm:grid-cols-2">
          {FAQS.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SectionReveal>
    </section>
  );
}

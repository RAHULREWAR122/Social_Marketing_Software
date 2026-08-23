import Link from "next/link";

const PRODUCT_NAME = "Engage"; // placeholder working name — rename here once the brand is decided

const CHANNELS = [
  {
    title: "Email campaigns",
    description:
      "Connect Gmail with one click, no passwords stored. Build campaigns with a rich editor, personalize with merge fields, and schedule sends in your recipients' timezone.",
  },
  {
    title: "WhatsApp campaigns",
    description:
      "Reach customers on the official WhatsApp Business Platform with approved message templates — built for permission-based, business-grade messaging.",
  },
  {
    title: "Contact management",
    description:
      "Import contacts by CSV, organize them into lists and tags, and segment by any combination of tag, city, or opt-in status before you send.",
  },
  {
    title: "Campaign automation",
    description:
      "One campaign builder for every channel. Pick an audience, write your message, preview it, and send now or schedule it for later.",
  },
  {
    title: "Analytics",
    description:
      "Track deliveries, opens, clicks and unsubscribes per campaign, so you know what's working without digging through spreadsheets.",
  },
  {
    title: "Team & permissions",
    description:
      "Invite your team with role-based access — owners, admins, managers and analysts each see exactly what they need to.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["100 contacts", "100 email messages / month", "20 WhatsApp messages / month", "Basic campaigns & analytics"],
  },
  {
    name: "Starter",
    price: "$29",
    period: "/ month",
    features: ["5,000 contacts", "10,000 email messages / month", "WhatsApp allowance", "Scheduling, templates & analytics"],
  },
  {
    name: "Business",
    price: "$99",
    period: "/ month",
    features: ["25,000 contacts", "50,000 email messages / month", "Higher WhatsApp allowance", "Automation, team members & advanced analytics"],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "Custom",
    period: "",
    features: ["100,000+ contacts", "Higher sending limits", "Advanced automation", "Multiple users & priority support"],
  },
];

const FAQS = [
  {
    question: "Do you store my email password?",
    answer:
      "No. Email accounts connect through OAuth, so we never see or store your Gmail password. You can revoke access at any time from your Google account.",
  },
  {
    question: "Is WhatsApp messaging official and compliant?",
    answer:
      `${PRODUCT_NAME} sends WhatsApp messages through the official WhatsApp Business Platform using approved templates — never through automated personal WhatsApp accounts.`,
  },
  {
    question: "Can recipients opt out?",
    answer:
      "Yes. Every email includes an unsubscribe link, and contacts can be marked opted-out of email or WhatsApp at any time. Opted-out contacts are automatically excluded from future campaigns.",
  },
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade, downgrade or cancel your subscription at any time from your billing settings.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-black/[.08] bg-white/80 backdrop-blur dark:border-white/[.145] dark:bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">{PRODUCT_NAME}</span>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 sm:flex dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-950 dark:hover:text-white">
              Features
            </a>
            <a href="#pricing" className="hover:text-zinc-950 dark:hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="hover:text-zinc-950 dark:hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white">
              Log in
            </Link>
            <Link
              href="/register"
              className="flex h-9 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            One platform to connect, engage and grow your customers.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Run email and WhatsApp campaigns from one dashboard — manage contacts, personalize every
            message, and see what&apos;s working, without juggling separate tools.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="flex h-12 items-center justify-center rounded-lg bg-zinc-950 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Start Free
            </Link>
            <a
              href="#pricing"
              className="flex h-12 items-center justify-center rounded-lg border border-black/[.08] px-6 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.08]"
            >
              Book a Demo
            </a>
          </div>
          <p className="text-xs text-zinc-500">
            A customer engagement &amp; marketing automation platform — not a bulk sender.
          </p>
        </section>

        {/* Product explanation / channels */}
        <section id="features" className="border-t border-black/[.08] bg-zinc-50 px-6 py-20 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">Everything you need to reach your customers</h2>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Built around one contact list and one campaign engine, so every channel works the same way.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CHANNELS.map((channel) => (
                <div
                  key={channel.title}
                  className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-black"
                >
                  <h3 className="font-semibold">{channel.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {channel.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust section (no fabricated testimonials — product hasn't launched yet) */}
        <section className="border-t border-black/[.08] px-6 py-16 dark:border-white/[.145]">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Built for legitimate customer communication</h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
              Every email includes an unsubscribe link. Every WhatsApp message goes through the official
              Business Platform with approved templates. Opt-outs are respected automatically, and plan
              limits keep sending within provider rules — designed for permission-based messaging from
              day one.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-black/[.08] bg-zinc-50 px-6 py-20 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">Simple, transparent pricing</h2>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">Start free. Upgrade as your list grows.</p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-xl border p-6 ${
                    plan.highlighted
                      ? "border-zinc-950 bg-white shadow-sm dark:border-white dark:bg-black"
                      : "border-black/[.08] bg-white dark:border-white/[.145] dark:bg-black"
                  }`}
                >
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="mt-2">
                    <span className="text-2xl font-semibold">{plan.price}</span>{" "}
                    <span className="text-sm text-zinc-500">{plan.period}</span>
                  </p>
                  <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-6 flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors ${
                      plan.highlighted
                        ? "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        : "border border-black/[.08] hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.08]"
                    }`}
                  >
                    Get started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-black/[.08] px-6 py-20 dark:border-white/[.145]">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
            <div className="mt-10 flex flex-col divide-y divide-black/[.08] dark:divide-white/[.145]">
              {FAQS.map((faq) => (
                <div key={faq.question} className="py-5">
                  <h3 className="font-medium">{faq.question}</h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-black/[.08] bg-zinc-950 px-6 py-20 text-center dark:border-white/[.145] dark:bg-white">
          <h2 className="text-3xl font-semibold tracking-tight text-white dark:text-zinc-950">
            Ready to engage your customers?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-300 dark:text-zinc-600">
            Create your free account and connect your first channel in minutes.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
          >
            Start Free
          </Link>
        </section>
      </main>

      <footer className="border-t border-black/[.08] px-6 py-10 dark:border-white/[.145]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row">
          <span>© {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-zinc-950 dark:hover:text-white">
              Log in
            </Link>
            <Link href="/register" className="hover:text-zinc-950 dark:hover:text-white">
              Register
            </Link>
            <Link href="/privacy-policy" className="hover:text-zinc-950 dark:hover:text-white">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

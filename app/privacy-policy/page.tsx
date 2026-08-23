import Link from "next/link";
import type { Metadata } from "next";

const PRODUCT_NAME = "Engage"; // placeholder working name — keep in sync with app/page.tsx
const CONTACT_EMAIL = "privacy@example.com"; // TODO: replace with your real support/privacy inbox before launch
const LAST_UPDATED = "23 August 2026";

export const metadata: Metadata = {
  title: `Privacy Policy — ${PRODUCT_NAME}`,
  description: `How ${PRODUCT_NAME} collects, uses, and protects your data.`,
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Who we are",
    body: (
      <p>
        {PRODUCT_NAME} ("we", "us", "our") is a customer engagement platform that lets businesses
        manage contacts and send permission-based email and WhatsApp campaigns. This policy explains
        what data we collect from you and the businesses you communicate with on our platform, why we
        collect it, and the choices you have.
      </p>
    ),
  },
  {
    title: "2. Information we collect",
    body: (
      <ul className="list-disc pl-5">
        <li>
          <strong>Account information</strong> — name, email address, and password (stored as a salted
          hash, never in plain text) when you register.
        </li>
        <li>
          <strong>Contact data you upload</strong> — names, email addresses, phone numbers, tags, and
          other fields you import to build your own contact lists, and the campaigns/messages sent to
          them.
        </li>
        <li>
          <strong>Connected account data</strong> — when you connect Gmail via Google OAuth or a
          WhatsApp Business Account via Meta, we store the access tokens needed to send on your behalf.
          We never see or store your Google account password.
        </li>
        <li>
          <strong>Billing information</strong> — subscription plan and payment status. Card details are
          handled directly by our payment processor (Cashfree) and never touch our servers.
        </li>
        <li>
          <strong>Usage data</strong> — campaign delivery, open, click, and unsubscribe events, and
          basic technical logs (IP address, user agent) used for security and troubleshooting.
        </li>
        <li>
          <strong>Cookies</strong> — a single essential, HTTP-only session cookie used to keep you
          signed in. We don&apos;t use advertising or tracking cookies.
        </li>
      </ul>
    ),
  },
  {
    title: "3. How we use this information",
    body: (
      <ul className="list-disc pl-5">
        <li>To operate your account and let you send the campaigns you create.</li>
        <li>To authenticate you and keep your account secure.</li>
        <li>To process subscription payments and enforce plan limits.</li>
        <li>To show you analytics about your own campaigns.</li>
        <li>To respond to support requests.</li>
        <li>To meet legal obligations and enforce our terms.</li>
      </ul>
    ),
  },
  {
    title: "4. Third parties we work with",
    body: (
      <p>
        We share data with the following processors only as needed to provide the service:{" "}
        <strong>Google</strong> (to send email through your connected Gmail account),{" "}
        <strong>Meta</strong> (to send messages through your connected WhatsApp Business Account),{" "}
        <strong>Cashfree</strong> (to process subscription payments), and our email delivery provider
        for transactional emails like password resets. Each is bound by its own privacy and data
        protection terms. We do not sell your data or your contacts&apos; data to anyone.
      </p>
    ),
  },
  {
    title: "5. Your contacts and permission-based messaging",
    body: (
      <p>
        {PRODUCT_NAME} is built for permission-based messaging. If you upload contact data, you
        confirm you have a lawful basis and appropriate consent to message those contacts. Every
        email we send includes an unsubscribe link, and contacts can be marked opted-out of email or
        WhatsApp at any time; opted-out contacts are automatically excluded from future campaigns.
      </p>
    ),
  },
  {
    title: "6. Data retention",
    body: (
      <p>
        We retain account and contact data for as long as your account is active. If you delete your
        account, we delete your contact data and campaign content within 30 days, except where we&apos;re
        required to retain records (e.g. billing history) for legal or accounting purposes.
      </p>
    ),
  },
  {
    title: "7. Data security",
    body: (
      <p>
        Passwords are hashed, connected-account tokens are encrypted at rest, and all traffic between
        your browser and our servers is encrypted with TLS. Access to production data is limited to
        the team members who need it to operate the service.
      </p>
    ),
  },
  {
    title: "8. Your rights",
    body: (
      <p>
        You can access, correct, export, or delete your account data at any time from your account
        settings, or by contacting us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
          {CONTACT_EMAIL}
        </a>
        . Depending on where you live, you may have additional rights under laws such as the GDPR or
        India&apos;s DPDP Act, including the right to object to or restrict certain processing.
      </p>
    ),
  },
  {
    title: "9. Children's privacy",
    body: (
      <p>
        {PRODUCT_NAME} is a business tool and is not directed at, or knowingly used by, children under
        16.
      </p>
    ),
  },
  {
    title: "10. Changes to this policy",
    body: (
      <p>
        We may update this policy as the product evolves. If we make material changes, we&apos;ll notify
        account owners by email before they take effect.
      </p>
    ),
  },
  {
    title: "11. Contact us",
    body: (
      <p>
        Questions about this policy or your data? Email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <header className="border-b border-black/[.08] dark:border-white/[.145]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {PRODUCT_NAME}
          </Link>
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
            ← Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 flex flex-col gap-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-zinc-600 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 dark:text-zinc-400">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-black/[.08] px-6 py-10 dark:border-white/[.145]">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-sm text-zinc-500">
          <span>© {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.</span>
          <Link href="/" className="hover:text-zinc-950 dark:hover:text-white">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}

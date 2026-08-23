"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Campaign, EmailAccount, EmailTemplate } from "@/lib/campaigns-types";

export default function EmailOverviewPage() {
  const { accessToken } = useAuth();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const [accountsRes, templatesRes, campaignsRes] = await Promise.all([
      apiRequest<{ accounts: EmailAccount[] }>("/integrations/email-accounts", { accessToken }),
      apiRequest<{ templates: EmailTemplate[] }>("/templates", { accessToken }),
      apiRequest<{ campaigns: Campaign[] }>("/campaigns?channel=EMAIL", { accessToken }),
    ]);
    setAccounts(accountsRes.accounts);
    setTemplates(templatesRes.templates);
    setCampaigns(campaignsRes.campaigns);
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {accounts.length} account{accounts.length === 1 ? "" : "s"} connected · {templates.length} templates
          </p>
        </div>
        <Link href="/app/campaigns/new" className="btn-primary w-auto px-4">
          New email campaign
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          No Gmail account connected yet.{" "}
          <Link href="/app/integrations" className="font-medium underline">
            Connect one on the Integrations page
          </Link>{" "}
          before creating a campaign.
        </div>
      ) : (
        <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold">Connected accounts</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {accounts.map((a) => (
              <li key={a.id} className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{a.emailAddress}</span>
                <span>{a.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent email campaigns</h2>
          <Link href="/app/campaigns?channel=EMAIL" className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400">
            View all
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No email campaigns yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {campaigns.slice(0, 5).map((c) => (
              <li key={c.id} className="flex justify-between">
                <Link href={`/app/campaigns/${c.id}`} className="hover:underline">{c.name}</Link>
                <span className="text-zinc-500">{c.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Templates</h2>
          <Link href="/app/templates" className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400">
            Manage templates
          </Link>
        </div>
        <p className="mt-2 text-sm text-zinc-500">{templates.length} saved templates.</p>
      </section>
    </div>
  );
}

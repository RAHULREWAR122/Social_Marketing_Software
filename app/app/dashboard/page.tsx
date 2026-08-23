"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type DashboardAnalytics = {
  contactsCount: number;
  campaignsThisMonth: number;
  emailSentThisMonth: number;
  whatsappSentThisMonth: number;
  recentCampaigns: { id: string; name: string; channel: string; status: string; recipientCount: number }[];
};

const ONBOARDING_STEPS: { key: string; label: string }[] = [
  { key: "business_info", label: "Add business information" },
  { key: "connect_email", label: "Connect email" },
  { key: "connect_whatsapp", label: "Connect WhatsApp" },
  { key: "import_contacts", label: "Import contacts" },
  { key: "done", label: "Finish setup" },
];

function onboardingProgress(currentStep: string) {
  const index = ONBOARDING_STEPS.findIndex((step) => step.key === currentStep);
  const completedCount = index === -1 ? 0 : index;
  return { completedCount, total: ONBOARDING_STEPS.length - 1 };
}

export default function DashboardPage() {
  const { user, organization, accessToken } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const result = await apiRequest<{ analytics: DashboardAnalytics }>("/analytics/dashboard", { accessToken });
    setAnalytics(result.analytics);
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (!organization) return null;

  const { completedCount, total } = onboardingProgress(organization.onboardingStep);
  const percent = Math.round((completedCount / total) * 100);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user?.firstName ?? user?.email}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Here&apos;s what&apos;s happening this month.</p>
      </div>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Account setup</h2>
          <span className="text-sm text-zinc-500">{percent}% complete</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-full rounded-full bg-zinc-950 dark:bg-white" style={{ width: `${percent}%` }} />
        </div>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {ONBOARDING_STEPS.slice(0, -1).map((step, index) => (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  index < completedCount
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                    : "border border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {index < completedCount ? "✓" : ""}
              </span>
              <span className={index < completedCount ? "text-zinc-500 line-through" : ""}>{step.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Contacts", value: analytics?.contactsCount },
          { label: "Emails sent", value: analytics?.emailSentThisMonth },
          { label: "WhatsApp sent", value: analytics?.whatsappSentThisMonth },
          { label: "Campaigns", value: analytics?.campaignsThisMonth },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950"
          >
            <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value ?? "—"}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold">Recent campaigns</h2>
        {!analytics || analytics.recentCampaigns.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No campaigns yet. Connect an email or WhatsApp account to send your first campaign.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {analytics.recentCampaigns.map((campaign) => (
              <li key={campaign.id} className="flex justify-between">
                <Link href={`/app/campaigns/${campaign.id}`} className="hover:underline">
                  {campaign.name}
                </Link>
                <span className="text-zinc-500">
                  {campaign.channel} · {campaign.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

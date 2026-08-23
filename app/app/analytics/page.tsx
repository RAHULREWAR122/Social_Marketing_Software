"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { PLATFORM_LABELS, type SocialPlatform } from "@/lib/social-types";

type SocialAnalytics = {
  postsThisMonth: number;
  byPlatform: { platform: SocialPlatform; published: number; failed: number; pending: number }[];
  recentPosts: {
    id: string;
    caption: string;
    status: string;
    createdAt: string;
    targets: { platform: SocialPlatform; status: string }[];
  }[];
};

type DashboardAnalytics = {
  contactsCount: number;
  campaignsThisMonth: number;
  emailSentThisMonth: number;
  whatsappSentThisMonth: number;
  emailDeliveryRate: number | null;
  whatsappDeliveryRate: number | null;
  recentCampaigns: { id: string; name: string; channel: string; status: string; recipientCount: number }[];
  social: SocialAnalytics;
};

export default function AnalyticsPage() {
  const { accessToken } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await apiRequest<{ analytics: DashboardAnalytics }>("/analytics/dashboard", { accessToken });
      setAnalytics(result.analytics);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load analytics");
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!analytics) return <p className="text-sm text-zinc-500">Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">This month, across all campaigns.</p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Contacts", value: analytics.contactsCount },
          { label: "Campaigns this month", value: analytics.campaignsThisMonth },
          { label: "Emails sent", value: analytics.emailSentThisMonth },
          { label: "WhatsApp sent", value: analytics.whatsappSentThisMonth },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Email delivery rate</p>
          <p className="mt-2 text-2xl font-semibold">
            {analytics.emailDeliveryRate === null ? "—" : `${analytics.emailDeliveryRate}%`}
          </p>
          {analytics.emailDeliveryRate === null ? (
            <p className="mt-1 text-xs text-zinc-500">No email sends yet this month.</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">WhatsApp delivery rate</p>
          <p className="mt-2 text-2xl font-semibold">
            {analytics.whatsappDeliveryRate === null ? "—" : `${analytics.whatsappDeliveryRate}%`}
          </p>
          {analytics.whatsappDeliveryRate === null ? (
            <p className="mt-1 text-xs text-zinc-500">No WhatsApp sends yet this month.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Social — Instagram, Facebook &amp; LinkedIn</h2>
          <p className="text-xs text-zinc-500">{analytics.social.postsThisMonth} post{analytics.social.postsThisMonth === 1 ? "" : "s"} this month</p>
        </div>

        {analytics.social.byPlatform.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No social posts yet this month.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {analytics.social.byPlatform.map((row) => (
              <div key={row.platform} className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
                <p className="text-xs font-medium text-zinc-500">{PLATFORM_LABELS[row.platform]}</p>
                <p className="mt-1 text-xl font-semibold text-green-600 dark:text-green-500">{row.published}</p>
                <p className="text-xs text-zinc-500">
                  published{row.failed > 0 ? `, ${row.failed} failed` : ""}
                  {row.pending > 0 ? `, ${row.pending} pending` : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {analytics.social.recentPosts.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2 border-t border-black/[.04] pt-4 dark:border-white/[.08]">
            {analytics.social.recentPosts.map((post) => (
              <li key={post.id} className="text-sm">
                <p className="truncate font-medium">{post.caption}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {post.targets.map((target, i) => (
                    <span
                      key={i}
                      className={`rounded-full border border-black/[.08] px-2 py-0.5 text-xs dark:border-white/[.145] ${
                        target.status === "PUBLISHED"
                          ? "text-green-600 dark:text-green-500"
                          : target.status === "FAILED"
                            ? "text-red-600 dark:text-red-500"
                            : "text-zinc-500"
                      }`}
                    >
                      {PLATFORM_LABELS[target.platform]}: {target.status}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold">Recent campaigns</h2>
        {analytics.recentCampaigns.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No campaigns yet.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Channel</th>
                <th className="py-2">Status</th>
                <th className="py-2">Recipients</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentCampaigns.map((c) => (
                <tr key={c.id} className="border-t border-black/[.04] dark:border-white/[.08]">
                  <td className="py-2">
                    <Link href={`/app/campaigns/${c.id}`} className="hover:underline">{c.name}</Link>
                  </td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">{c.channel}</td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">{c.status}</td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">{c.recipientCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

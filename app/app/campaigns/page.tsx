"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Campaign } from "@/lib/campaigns-types";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  SCHEDULED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  QUEUED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  RUNNING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  PAUSED: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

export default function CampaignsPage() {
  const { accessToken } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = channelFilter ? `?channel=${channelFilter}` : "";
      const result = await apiRequest<{ campaigns: Campaign[] }>(`/campaigns${params}`, { accessToken });
      setCampaigns(result.campaigns);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [accessToken, channelFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Email and WhatsApp campaigns.</p>
        </div>
        <Link href="/app/campaigns/new" className="btn-primary w-auto px-4">
          Create campaign
        </Link>
      </div>

      <div className="flex gap-3">
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="input max-w-[200px]">
          <option value="">All channels</option>
          <option value="EMAIL">Email</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/[.08] text-xs uppercase text-zinc-500 dark:border-white/[.145]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Recipients</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  No campaigns yet. Create one to get started.
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/app/campaigns/${campaign.id}`} className="hover:underline">
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{campaign.channel}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{campaign._count?.recipients ?? 0}</td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(campaign.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

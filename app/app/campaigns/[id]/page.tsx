"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { CampaignDetail, CampaignRecipient } from "@/lib/campaigns-types";

const ACTIVE_STATUSES = ["QUEUED", "RUNNING"];
const RECIPIENTS_PAGE_SIZE = 200;

type QuotaDetails = { channel: "EMAIL" | "WHATSAPP"; limit: number; used: number; plan: string };

function isQuotaExceededError(err: unknown): err is ApiError & { fieldErrors: QuotaDetails } {
  return err instanceof ApiError && err.status === 402 && (err.fieldErrors as { code?: string } | undefined)?.code === "QUOTA_EXCEEDED";
}

function QuotaUpgradeModal({ details, onClose }: { details: QuotaDetails; onClose: () => void }) {
  const channelLabel = details.channel === "EMAIL" ? "email" : "WhatsApp";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold">Monthly {channelLabel} limit reached</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          You&apos;ve used {details.used.toLocaleString()} of {details.limit.toLocaleString()} {channelLabel} sends this month on your
          current plan. Upgrade to send this campaign.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary w-auto px-4">
            Cancel
          </button>
          <Link href="/app/billing" className="btn-primary w-auto px-4 text-center">
            View plans
          </Link>
        </div>
      </div>
    </div>
  );
}

function recipientName(contact: CampaignRecipient["contact"]) {
  const name = `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim();
  return name || "—";
}

function StatusBadge({ recipient }: { recipient: CampaignRecipient }) {
  switch (recipient.status) {
    case "PENDING":
      return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">Queued</span>;
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400" />
          Sending...
        </span>
      );
    case "SENT":
      return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">✓ Sent</span>;
    case "DELIVERED":
      return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">✓ Delivered</span>;
    case "FAILED":
    case "BOUNCED":
      return (
        <span
          title={recipient.errorMessage ?? undefined}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
        >
          ✕ {recipient.status === "BOUNCED" ? "Bounced" : "Failed"}
          {recipient.errorMessage ? <span className="max-w-[220px] truncate text-red-500/80">— {recipient.errorMessage}</span> : null}
        </span>
      );
    case "UNSUBSCRIBED":
      return <span className="text-xs font-medium text-zinc-400">Skipped (unsubscribed)</span>;
    default:
      return <span className="text-xs text-zinc-500">{recipient.status}</span>;
  }
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [testTarget, setTestTarget] = useState("");

  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const [quotaDetails, setQuotaDetails] = useState<QuotaDetails | null>(null);
  const recipientsLoadedForStatus = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await apiRequest<{ campaign: CampaignDetail }>(`/campaigns/${id}`, { accessToken });
      setCampaign(result.campaign);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load campaign");
    }
  }, [accessToken, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!campaign || !ACTIVE_STATUSES.includes(campaign.status)) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [campaign, load]);

  const loadRecipients = useCallback(async () => {
    if (!accessToken || !id) return;
    try {
      const result = await apiRequest<{ recipients: CampaignRecipient[]; nextCursor: string | null }>(
        `/campaigns/${id}/recipients?limit=${RECIPIENTS_PAGE_SIZE}`,
        { accessToken },
      );
      setRecipients(result.recipients);
      setRecipientsError(null);
    } catch (err) {
      setRecipientsError(err instanceof ApiError ? err.message : "Failed to load send progress");
    }
  }, [accessToken, id]);

  // Fetch recipients once a send has started, then keep polling while it's actively going out.
  useEffect(() => {
    if (!campaign) return;
    const hasStarted = campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED";
    if (!hasStarted) return;
    if (recipientsLoadedForStatus.current !== campaign.id) {
      recipientsLoadedForStatus.current = campaign.id;
      loadRecipients();
    }
  }, [campaign, loadRecipients]);

  useEffect(() => {
    if (!campaign || !ACTIVE_STATUSES.includes(campaign.status)) return;
    const interval = setInterval(loadRecipients, 1500);
    return () => clearInterval(interval);
  }, [campaign, loadRecipients]);

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await load();
    } catch (err) {
      if (isQuotaExceededError(err)) {
        setQuotaDetails(err.fieldErrors);
      } else {
        setActionError(err instanceof ApiError ? err.message : "Action failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!confirm("Stop sending this campaign? Recipients already sent to won't be affected, but everyone still pending will be skipped.")) {
      return;
    }
    setStopping(true);
    setActionError(null);
    try {
      await apiRequest(`/campaigns/${id}/cancel`, { method: "POST", accessToken });
      await load();
      await loadRecipients();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to stop the campaign");
    } finally {
      setStopping(false);
    }
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!campaign) return <p className="text-sm text-zinc-500">Loading...</p>;

  const canEdit = campaign.status === "DRAFT";
  const canPause = ["QUEUED", "RUNNING", "SCHEDULED"].includes(campaign.status);
  const canResume = campaign.status === "PAUSED";
  const canCancel = !["COMPLETED", "CANCELLED", "FAILED"].includes(campaign.status);
  const isSending = ACTIVE_STATUSES.includes(campaign.status);
  const hasStarted = campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED";

  const totalRecipients = Object.values(campaign.recipientCounts).reduce((sum, n) => sum + n, 0);
  const processedCount = totalRecipients - (campaign.recipientCounts.PENDING ?? 0) - (campaign.recipientCounts.PROCESSING ?? 0);
  const progressPct = totalRecipients > 0 ? Math.round((processedCount / totalRecipients) * 100) : 0;
  const failedCount = (campaign.recipientCounts.FAILED ?? 0) + (campaign.recipientCounts.BOUNCED ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {campaign.channel} · {campaign.status}
          {campaign.list ? ` · ${campaign.list.name}` : ""}
          {campaign.tag ? ` · #${campaign.tag.name}` : ""}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(campaign.recipientCounts)
          .filter(([, count]) => count > 0 || ["PENDING", "SENT", "FAILED"].includes("PENDING"))
          .map(([status, count]) => (
            <div key={status} className="rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
              <p className="text-xs font-medium text-zinc-500">{status}</p>
              <p className="mt-1 text-xl font-semibold">{count}</p>
            </div>
          ))}
      </section>

      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

      {hasStarted && totalRecipients > 0 ? (
        <section className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isSending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-700 dark:border-t-zinc-200" />
              ) : null}
              <h2 className="text-sm font-semibold">
                {isSending ? "Sending..." : "Send progress"} ({processedCount}/{totalRecipients})
              </h2>
            </div>
            {(canPause || canCancel) && isSending ? (
              <button
                disabled={stopping || busy}
                onClick={handleStop}
                className="w-auto rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950"
              >
                {stopping ? "Stopping..." : "Stop sending"}
              </button>
            ) : null}
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full bg-zinc-700 transition-all dark:bg-zinc-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {failedCount > 0 ? (
            <p className="text-xs font-medium text-red-600">
              {failedCount} recipient{failedCount === 1 ? "" : "s"} failed — hover a row below for the error.
            </p>
          ) : null}
          {recipientsError ? <p className="text-xs text-red-600">{recipientsError}</p> : null}

          <div className="max-h-96 overflow-y-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-black/[.08] bg-white text-xs uppercase text-zinc-500 dark:border-white/[.145] dark:bg-zinc-950">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">{campaign.channel === "EMAIL" ? "Email" : "Phone"}</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recipients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm text-zinc-500">
                      {recipientsError ? "Couldn't load recipients." : "Loading recipients..."}
                    </td>
                  </tr>
                ) : (
                  recipients.map((recipient) => (
                    <tr key={recipient.id} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                      <td className="px-4 py-2 font-medium">{recipientName(recipient.contact)}</td>
                      <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                        {campaign.channel === "EMAIL" ? recipient.contact.email : recipient.contact.phone}
                      </td>
                      <td className="px-4 py-2"><StatusBadge recipient={recipient} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalRecipients > RECIPIENTS_PAGE_SIZE ? (
            <p className="text-xs text-zinc-500">
              Showing the first {RECIPIENTS_PAGE_SIZE} of {totalRecipients} recipients. Full totals are in the counts above.
            </p>
          ) : null}
        </section>
      ) : null}

      {canEdit ? (
        <section className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold">Send this campaign</h2>

          <div className="flex flex-wrap items-end gap-3">
            <button
              disabled={busy}
              onClick={() => runAction(async () => { await apiRequest(`/campaigns/${id}/send`, { method: "POST", accessToken }); })}
              className="btn-primary w-auto px-4"
            >
              Send now
            </button>

            <div className="flex items-end gap-2">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input"
              />
              <button
                disabled={busy || !scheduledAt}
                onClick={() => runAction(async () => {
                  await apiRequest(`/campaigns/${id}/schedule`, {
                    method: "POST",
                    body: { scheduledAt: new Date(scheduledAt).toISOString() },
                    accessToken,
                  });
                })}
                className="btn-secondary w-auto px-4"
              >
                Schedule
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium">
                Send test to {campaign.channel === "EMAIL" ? "an email address" : "a phone number"}
              </span>
              <input
                value={testTarget}
                onChange={(e) => setTestTarget(e.target.value)}
                className="input"
                placeholder={campaign.channel === "EMAIL" ? "you@example.com" : "+15551234567"}
              />
            </label>
            <button
              disabled={busy || !testTarget}
              onClick={() => runAction(async () => {
                await apiRequest(`/campaigns/${id}/test`, {
                  method: "POST",
                  body: campaign.channel === "EMAIL" ? { toEmail: testTarget } : { toPhone: testTarget },
                  accessToken,
                });
              })}
              className="btn-secondary w-auto px-4"
            >
              Send test
            </button>
          </div>
        </section>
      ) : null}

      {(canPause || canResume || canCancel) ? (
        <section className="flex gap-2">
          {canPause ? (
            <button disabled={busy} onClick={() => runAction(async () => { await apiRequest(`/campaigns/${id}/pause`, { method: "POST", accessToken }); })} className="btn-secondary w-auto px-4">
              Pause
            </button>
          ) : null}
          {canResume ? (
            <button disabled={busy} onClick={() => runAction(async () => { await apiRequest(`/campaigns/${id}/resume`, { method: "POST", accessToken }); })} className="btn-secondary w-auto px-4">
              Resume
            </button>
          ) : null}
          {canCancel ? (
            <button
              disabled={busy}
              onClick={() => {
                if (!confirm("Cancel this campaign?")) return;
                runAction(async () => { await apiRequest(`/campaigns/${id}/cancel`, { method: "POST", accessToken }); });
              }}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Cancel campaign
            </button>
          ) : null}
        </section>
      ) : null}

      {campaign.channel === "EMAIL" && campaign.bodyHtml ? (
        <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold">Preview</h2>
          <p className="mt-2 text-sm text-zinc-500">Subject: {campaign.subject}</p>
          <div className="mt-3 rounded-lg border border-black/[.08] p-4 text-sm dark:border-white/[.145]" dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }} />
        </section>
      ) : null}

      {quotaDetails ? <QuotaUpgradeModal details={quotaDetails} onClose={() => setQuotaDetails(null)} /> : null}
    </div>
  );
}

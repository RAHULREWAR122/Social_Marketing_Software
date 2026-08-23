"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatRupees, type BillingInfo, type PlanKey } from "@/lib/billing-types";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isNearLimit = pct >= 80;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className={isNearLimit ? "font-medium text-red-600" : "text-zinc-600 dark:text-zinc-400"}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full transition-all ${isNearLimit ? "bg-red-500" : "bg-zinc-700 dark:bg-zinc-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CheckoutModal({
  plan,
  onClose,
  onError,
}: {
  plan: { key: PlanKey; name: string; pricePaise: number };
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const { accessToken, organization } = useAuth();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await apiRequest<{ linkUrl: string }>("/billing/checkout", {
        method: "POST",
        body: { plan: plan.key, customerPhone: phone, customerName: name || organization?.name },
        accessToken,
      });
      window.location.href = result.linkUrl;
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to start checkout");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold">Upgrade to {plan.name} — {formatRupees(plan.pricePaise)}/month</h2>
        <p className="mt-1 text-xs text-zinc-500">
          You&apos;ll be redirected to Cashfree to complete payment securely.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            required
            placeholder="Phone number (for payment receipt)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
          />
          <input
            placeholder="Name on invoice (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary w-auto px-4">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary w-auto px-4">
              {busy ? "Redirecting..." : "Continue to payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BillingContent() {
  const { accessToken, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<BillingInfo["plans"][number] | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await apiRequest<BillingInfo>("/billing", { accessToken });
      setBilling(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load billing");
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Cashfree redirects back here with ?linkId=... after checkout — reconcile immediately rather
  // than waiting on the webhook, which can lag or (in sandbox) never arrive.
  useEffect(() => {
    const linkId = searchParams.get("linkId");
    if (!linkId || !accessToken) return;

    (async () => {
      try {
        const result = await apiRequest<BillingInfo>(`/billing/checkout/${linkId}/sync`, { accessToken });
        setBilling(result);
        setNotice(
          result.plan.key !== "free"
            ? `Payment received — you're now on the ${result.plan.name} plan.`
            : "We couldn't confirm this payment yet. If you completed checkout, it may take a minute — refresh shortly.",
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to confirm payment");
      } finally {
        router.replace("/app/billing");
      }
    })();
  }, [searchParams, accessToken, router]);

  const handleDowngrade = async () => {
    const confirmMessage = billing?.renewsAt
      ? `Switch to the Free plan? You'll keep your ${billing.plan.name} plan's limits until it renews on ${new Date(billing.renewsAt).toLocaleDateString()}, then it moves to Free.`
      : "Switch back to the Free plan?";
    if (!confirm(confirmMessage)) return;
    setChanging(true);
    try {
      const result = await apiRequest<BillingInfo>("/billing/change-plan", {
        method: "POST",
        body: { plan: "free" },
        accessToken,
      });
      setBilling(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change plan");
    } finally {
      setChanging(false);
    }
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!billing) return <p className="text-sm text-zinc-500">Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Current plan, usage this month, and upgrade options.</p>
      </div>

      {notice ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">{notice}</p>
      ) : null}
      {!isAdmin ? (
        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          Only an owner or admin can change plans or pay for an upgrade.
        </p>
      ) : null}

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Current plan: {billing.plan.name}</h2>
          {billing.renewsAt ? (
            <p className="text-xs text-zinc-500">Renews {new Date(billing.renewsAt).toLocaleDateString()}</p>
          ) : null}
        </div>
        {billing.pendingPlanName ? (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
            Switching to {billing.pendingPlanName === "free" ? "Free" : billing.pendingPlanName} on{" "}
            {billing.renewsAt ? new Date(billing.renewsAt).toLocaleDateString() : "renewal"} — your {billing.plan.name} plan
            stays active until then.
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-3">
          <UsageBar label="Contacts" used={billing.usage.contactsCount} limit={billing.plan.contactsLimit} />
          <UsageBar label="Emails sent this month" used={billing.usage.emailsSent} limit={billing.plan.emailLimit} />
          <UsageBar label="WhatsApp messages sent this month" used={billing.usage.whatsappSent} limit={billing.plan.whatsappLimit} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {billing.plans.map((plan) => {
          const isCurrent = plan.key === billing.plan.key;
          return (
            <div
              key={plan.key}
              className={`flex flex-col rounded-xl border p-5 ${
                isCurrent ? "border-zinc-950 dark:border-white" : "border-black/[.08] dark:border-white/[.145]"
              } bg-white dark:bg-zinc-950`}
            >
              <p className="font-semibold">{plan.name}</p>
              <p className="mt-1 text-lg font-semibold">
                {plan.pricePaise === 0 ? "Free" : `${formatRupees(plan.pricePaise)}/mo`}
              </p>
              <ul className="mt-2 flex-1 text-xs text-zinc-500">
                <li>{plan.contactsLimit.toLocaleString()} contacts</li>
                <li>{plan.emailLimit.toLocaleString()} emails/mo</li>
                <li>{plan.whatsappLimit.toLocaleString()} WhatsApp/mo</li>
              </ul>
              {isAdmin ? (
                isCurrent ? (
                  <button disabled className="btn-secondary mt-4 disabled:opacity-40">
                    Current plan
                  </button>
                ) : plan.key === "free" ? (
                  billing.pendingPlanName === "free" ? (
                    <button disabled className="btn-secondary mt-4 disabled:opacity-40">
                      Scheduled
                    </button>
                  ) : (
                    <button disabled={changing} onClick={handleDowngrade} className="btn-secondary mt-4 disabled:opacity-40">
                      Switch to Free
                    </button>
                  )
                ) : (
                  <button onClick={() => setCheckoutPlan(plan)} className="btn-primary mt-4">
                    Upgrade
                  </button>
                )
              ) : null}
            </div>
          );
        })}
      </section>

      {checkoutPlan ? (
        <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} onError={setError} />
      ) : null}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}

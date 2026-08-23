"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type EmailAccount = {
  id: string;
  provider: string;
  emailAddress: string;
  displayName?: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  createdAt: string;
};

function IntegrationsContent() {
  const { accessToken, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const result = await apiRequest<{ accounts: EmailAccount[] }>("/integrations/email-accounts", {
        accessToken,
      });
      setAccounts(result.accounts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const gmailStatus = searchParams.get("gmail");

  const handleConnectGmail = async () => {
    setConnecting(true);
    setError(null);
    try {
      const { url } = await apiRequest<{ url: string }>("/integrations/gmail/connect", {
        method: "POST",
        accessToken,
      });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start Gmail connection");
      setConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Disconnect this email account?")) return;
    await apiRequest(`/integrations/email-accounts/${accountId}`, { method: "DELETE", accessToken });
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Connect the accounts you&apos;ll send campaigns from.
        </p>
      </div>

      {gmailStatus === "connected" ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          Gmail account connected successfully.
        </p>
      ) : null}
      {gmailStatus === "error" ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          Couldn&apos;t connect Gmail. Please try again.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!isAdmin ? (
        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          Connecting or disconnecting a sending account requires owner or admin permission. Ask an admin to do this.
        </p>
      ) : null}

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Email — Gmail</h2>
            <p className="mt-1 text-sm text-zinc-500">Send campaigns from a connected Gmail account.</p>
          </div>
          {isAdmin ? (
            <button onClick={handleConnectGmail} disabled={connecting} className="btn-primary w-auto px-4">
              {connecting ? "Redirecting..." : "Connect Gmail"}
            </button>
          ) : null}
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No email accounts connected yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex items-center justify-between rounded-lg border border-black/[.08] px-4 py-3 text-sm dark:border-white/[.145]"
              >
                <div>
                  <p className="font-medium">{account.emailAddress}</p>
                  <p className="text-xs text-zinc-500">{account.status}</p>
                </div>
                {isAdmin ? (
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Disconnect
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold">WhatsApp Business</h2>
        <p className="mt-1 text-sm text-zinc-500">Coming in a later phase.</p>
      </section>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense>
      <IntegrationsContent />
    </Suspense>
  );
}

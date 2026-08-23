"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { WhatsAppAccount, WhatsAppTemplate } from "@/lib/campaigns-types";

export default function WhatsAppPage() {
  const { accessToken, isAdmin } = useAuth();
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const [accountsRes, templatesRes] = await Promise.all([
      apiRequest<{ accounts: WhatsAppAccount[] }>("/whatsapp/accounts", { accessToken }),
      apiRequest<{ templates: WhatsAppTemplate[] }>("/whatsapp/templates", { accessToken }),
    ]);
    setAccounts(accountsRes.accounts);
    setTemplates(templatesRes.templates);
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDisconnect = async (id: string) => {
    if (!confirm("Disconnect this WhatsApp account?")) return;
    await apiRequest(`/whatsapp/accounts/${id}`, { method: "DELETE", accessToken });
    load();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await apiRequest(`/whatsapp/templates/${id}`, { method: "DELETE", accessToken });
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Connect your WhatsApp Business Platform account and manage approved templates.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!isAdmin ? (
        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          Connecting or disconnecting a WhatsApp account requires owner or admin permission. Ask an admin to do this.
        </p>
      ) : null}

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Business accounts</h2>
          {isAdmin ? (
            <button onClick={() => setShowConnectForm((v) => !v)} className="btn-secondary w-auto px-4">
              {showConnectForm ? "Cancel" : "Connect account"}
            </button>
          ) : null}
        </div>

        {showConnectForm && isAdmin ? (
          <ConnectAccountForm
            accessToken={accessToken}
            onError={setError}
            onConnected={() => {
              setShowConnectForm(false);
              load();
            }}
          />
        ) : null}

        {accounts.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No account connected. You&apos;ll need your Phone Number ID, WhatsApp Business Account ID and a
            permanent access token from Meta Business Manager.{" "}
            <Link href="/app/whatsapp/setup-guide" className="font-medium text-zinc-900 underline dark:text-white">
              Where do I find these?
            </Link>
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between rounded-lg border border-black/[.08] px-4 py-3 text-sm dark:border-white/[.145]">
                <div>
                  <p className="font-medium">{account.displayPhoneNumber}</p>
                  <p className="text-xs text-zinc-500">{account.businessName ?? account.businessAccountId} · {account.status}</p>
                </div>
                {isAdmin ? (
                  <button onClick={() => handleDisconnect(account.id)} className="text-xs font-medium text-red-600 hover:underline">
                    Disconnect
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Message templates</h2>
          <button onClick={() => setShowTemplateForm((v) => !v)} disabled={accounts.length === 0} className="btn-secondary w-auto px-4 disabled:opacity-40">
            {showTemplateForm ? "Cancel" : "Add template"}
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Enter templates exactly as already approved in Meta Business Manager — this doesn&apos;t submit new templates for approval.
        </p>

        {showTemplateForm ? (
          <TemplateForm
            accounts={accounts}
            accessToken={accessToken}
            onError={setError}
            onCreated={() => {
              setShowTemplateForm(false);
              load();
            }}
          />
        ) : null}

        {templates.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No templates yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {templates.map((template) => (
              <li key={template.id} className="flex items-center justify-between rounded-lg border border-black/[.08] px-4 py-3 text-sm dark:border-white/[.145]">
                <div>
                  <p className="font-medium">{template.name} <span className="text-xs text-zinc-500">({template.language})</span></p>
                  <p className="text-xs text-zinc-500">{template.bodyText}</p>
                </div>
                <button onClick={() => handleDeleteTemplate(template.id)} className="text-xs font-medium text-red-600 hover:underline">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ConnectAccountForm({
  accessToken,
  onConnected,
  onError,
}: {
  accessToken: string | null;
  onConnected: () => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    businessAccountId: "",
    phoneNumberId: "",
    displayPhoneNumber: "",
    businessName: "",
    accessToken: "",
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiRequest("/whatsapp/accounts/connect", { method: "POST", body: form, accessToken });
      onConnected();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to connect account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
      <Link href="/app/whatsapp/setup-guide" className="self-start text-xs font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
        Where do I find these values?
      </Link>
      <input required placeholder="WhatsApp Business Account ID" value={form.businessAccountId} onChange={(e) => setForm((f) => ({ ...f, businessAccountId: e.target.value }))} className="input" />
      <input required placeholder="Phone Number ID" value={form.phoneNumberId} onChange={(e) => setForm((f) => ({ ...f, phoneNumberId: e.target.value }))} className="input" />
      <input required placeholder="Display phone number (+1...)" value={form.displayPhoneNumber} onChange={(e) => setForm((f) => ({ ...f, displayPhoneNumber: e.target.value }))} className="input" />
      <input placeholder="Business name (optional)" value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} className="input" />
      <input required type="password" placeholder="Permanent access token" value={form.accessToken} onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))} className="input" />
      <button type="submit" disabled={busy} className="btn-primary w-auto px-4">
        {busy ? "Connecting..." : "Connect"}
      </button>
    </form>
  );
}

function TemplateForm({
  accounts,
  accessToken,
  onCreated,
  onError,
}: {
  accounts: WhatsAppAccount[];
  accessToken: string | null;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    whatsappAccountId: accounts[0]?.id ?? "",
    name: "",
    language: "en_US",
    bodyText: "",
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiRequest("/whatsapp/templates", { method: "POST", body: form, accessToken });
      onCreated();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to create template");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
      <select required value={form.whatsappAccountId} onChange={(e) => setForm((f) => ({ ...f, whatsappAccountId: e.target.value }))} className="input">
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.displayPhoneNumber}</option>
        ))}
      </select>
      <input required placeholder="Template name (must match Meta exactly)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
      <input required placeholder="Language code (e.g. en_US)" value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} className="input" />
      <textarea required rows={3} placeholder="Hello {{1}}, your order {{2}} is ready." value={form.bodyText} onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))} className="input font-mono text-xs" />
      <button type="submit" disabled={busy} className="btn-primary w-auto px-4">
        {busy ? "Saving..." : "Save template"}
      </button>
    </form>
  );
}

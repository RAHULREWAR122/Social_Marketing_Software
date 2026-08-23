"use client";

import { useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { organization, accessToken, refreshOrganization } = useAuth();
  const [form, setForm] = useState({
    name: organization?.name ?? "",
    businessType: organization?.businessType ?? "",
    country: organization?.country ?? "",
    timezone: organization?.timezone ?? "UTC",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiRequest("/organizations/me", { method: "PATCH", body: form, accessToken });
      await refreshOrganization();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Organization profile.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Business / company name</span>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Business type</span>
          <input value={form.businessType} onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))} className="input" placeholder="Retail, agency, restaurant..." />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Country</span>
          <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="input" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Timezone</span>
          <input value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} className="input" placeholder="Asia/Kolkata" />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {saved ? <p className="text-sm text-green-600">Saved.</p> : null}

        <button type="submit" disabled={saving} className="btn-primary w-auto px-4">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

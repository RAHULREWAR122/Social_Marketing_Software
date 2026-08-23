"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { TemplateFormModal } from "./template-form-modal";

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  updatedAt: string;
};

export default function TemplatesPage() {
  const { accessToken } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalTemplate, setModalTemplate] = useState<EmailTemplate | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const result = await apiRequest<{ templates: EmailTemplate[] }>("/templates", { accessToken });
      setTemplates(result.templates);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    await apiRequest(`/templates/${template.id}`, { method: "DELETE", accessToken });
    load();
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    await apiRequest(`/templates/${template.id}/duplicate`, { method: "POST", accessToken });
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email templates</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Reusable content for your email campaigns.
          </p>
        </div>
        <button onClick={() => setModalTemplate(null)} className="btn-primary w-auto px-4">
          New template
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-zinc-500">No templates yet. Create one to reuse across campaigns.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex flex-col rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950"
            >
              <p className="font-medium">{template.name}</p>
              <p className="mt-1 truncate text-sm text-zinc-500">{template.subject}</p>
              <div className="mt-4 flex gap-3 text-xs font-medium">
                <button onClick={() => setModalTemplate(template)} className="text-zinc-600 hover:underline dark:text-zinc-400">
                  Edit
                </button>
                <button onClick={() => handleDuplicate(template)} className="text-zinc-600 hover:underline dark:text-zinc-400">
                  Duplicate
                </button>
                <button onClick={() => handleDelete(template)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalTemplate !== undefined ? (
        <TemplateFormModal
          template={modalTemplate}
          onClose={() => setModalTemplate(undefined)}
          onSaved={() => {
            setModalTemplate(undefined);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

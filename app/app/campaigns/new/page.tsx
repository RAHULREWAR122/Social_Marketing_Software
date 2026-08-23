"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type {
  ContactList,
  Tag,
  EmailAccount,
  EmailTemplate,
  WhatsAppAccount,
  WhatsAppTemplate,
} from "@/lib/campaigns-types";

type Channel = "EMAIL" | "WHATSAPP";

export default function NewCampaignPage() {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [audienceType, setAudienceType] = useState<"list" | "tag">("list");
  const [listId, setListId] = useState("");
  const [tagId, setTagId] = useState("");

  const [lists, setLists] = useState<ContactList[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppAccount[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);

  const [emailAccountId, setEmailAccountId] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");

  const [whatsappAccountId, setWhatsappAccountId] = useState("");
  const [whatsappTemplateId, setWhatsappTemplateId] = useState("");
  const [variableMap, setVariableMap] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      apiRequest<{ lists: ContactList[] }>("/lists", { accessToken }),
      apiRequest<{ tags: Tag[] }>("/tags", { accessToken }),
      apiRequest<{ accounts: EmailAccount[] }>("/integrations/email-accounts", { accessToken }),
      apiRequest<{ templates: EmailTemplate[] }>("/templates", { accessToken }),
      apiRequest<{ accounts: WhatsAppAccount[] }>("/whatsapp/accounts", { accessToken }),
      apiRequest<{ templates: WhatsAppTemplate[] }>("/whatsapp/templates", { accessToken }),
    ]).then(([listsRes, tagsRes, emailAccRes, emailTplRes, waAccRes, waTplRes]) => {
      setLists(listsRes.lists);
      setTags(tagsRes.tags);
      setEmailAccounts(emailAccRes.accounts);
      setEmailTemplates(emailTplRes.templates);
      setWhatsappAccounts(waAccRes.accounts);
      setWhatsappTemplates(waTplRes.templates);
    });
  }, [accessToken]);

  const selectedWhatsappTemplate = whatsappTemplates.find((t) => t.id === whatsappTemplateId);

  const handleTemplateSelect = (templateId: string) => {
    setEmailTemplateId(templateId);
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBodyHtml(template.bodyHtml);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        channel,
        ...(audienceType === "list" ? { listId } : { tagId }),
      };

      if (channel === "EMAIL") {
        payload.emailAccountId = emailAccountId;
        if (emailTemplateId) payload.emailTemplateId = emailTemplateId;
        else {
          payload.subject = subject;
          payload.bodyHtml = bodyHtml;
        }
      } else {
        payload.whatsappAccountId = whatsappAccountId;
        payload.whatsappTemplateId = whatsappTemplateId;
        payload.templateVariableMap = variableMap;
      }

      const { campaign } = await apiRequest<{ campaign: { id: string } }>("/campaigns", {
        method: "POST",
        body: payload,
        accessToken,
      });
      router.push(`/app/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create campaign</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Saved as a draft until you send it.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Campaign name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Diwali Offer 2026" />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Channel</span>
          <div className="flex gap-2">
            {(["EMAIL", "WHATSAPP"] as Channel[]).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setChannel(c)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                  channel === c
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                    : "border-black/[.08] dark:border-white/[.145]"
                }`}
              >
                {c === "EMAIL" ? "Email" : "WhatsApp"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Audience</span>
          <div className="flex gap-3">
            <select value={audienceType} onChange={(e) => setAudienceType(e.target.value as "list" | "tag")} className="input max-w-[140px]">
              <option value="list">List</option>
              <option value="tag">Tag</option>
            </select>
            {audienceType === "list" ? (
              <select required value={listId} onChange={(e) => setListId(e.target.value)} className="input">
                <option value="">Select a list...</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            ) : (
              <select required value={tagId} onChange={(e) => setTagId(e.target.value)} className="input">
                <option value="">Select a tag...</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {channel === "EMAIL" ? (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Sending account</span>
              <select required value={emailAccountId} onChange={(e) => setEmailAccountId(e.target.value)} className="input">
                <option value="">Select a connected Gmail account...</option>
                {emailAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.emailAddress}</option>
                ))}
              </select>
              {emailAccounts.length === 0 ? (
                <span className="text-xs text-amber-600">
                  No Gmail account connected yet — connect one on the Integrations page first.
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Use a template (optional)</span>
              <select value={emailTemplateId} onChange={(e) => handleTemplateSelect(e.target.value)} className="input">
                <option value="">Write custom content</option>
                {emailTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>

            {!emailTemplateId ? (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">Subject</span>
                  <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="input" placeholder="Special offer for {{first_name}}" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">Content (HTML)</span>
                  <textarea required rows={6} value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} className="input font-mono text-xs" />
                </label>
              </>
            ) : null}
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">WhatsApp business account</span>
              <select required value={whatsappAccountId} onChange={(e) => setWhatsappAccountId(e.target.value)} className="input">
                <option value="">Select a connected account...</option>
                {whatsappAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.displayPhoneNumber}</option>
                ))}
              </select>
              {whatsappAccounts.length === 0 ? (
                <span className="text-xs text-amber-600">
                  No WhatsApp account connected yet — connect one on the WhatsApp page first.
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Approved template</span>
              <select
                required
                value={whatsappTemplateId}
                onChange={(e) => {
                  setWhatsappTemplateId(e.target.value);
                  setVariableMap({});
                }}
                className="input"
              >
                <option value="">Select a template...</option>
                {whatsappTemplates
                  .filter((t) => t.whatsappAccountId === whatsappAccountId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                  ))}
              </select>
            </label>

            {selectedWhatsappTemplate && selectedWhatsappTemplate.variableCount > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border border-black/[.08] p-3 dark:border-white/[.145]">
                <p className="text-xs text-zinc-500">{selectedWhatsappTemplate.bodyText}</p>
                {Array.from({ length: selectedWhatsappTemplate.variableCount }, (_, i) => i + 1).map((position) => (
                  <label key={position} className="flex items-center gap-2 text-sm">
                    <span className="w-20 text-zinc-500">{"{{" + position + "}}"}</span>
                    <select
                      value={variableMap[String(position)] ?? ""}
                      onChange={(e) => setVariableMap((prev) => ({ ...prev, [String(position)]: e.target.value }))}
                      className="input"
                    >
                      <option value="">Select contact field...</option>
                      {["first_name", "last_name", "company", "city", "country"].map((field) => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            ) : null}
          </>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Creating..." : "Create draft"}
          </button>
        </div>
      </form>
    </div>
  );
}

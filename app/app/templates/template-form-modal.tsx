"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { EmailTemplate } from "./page";

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  bodyHtml: z.string().min(1, "Email content is required"),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export function TemplateFormModal({
  template,
  onClose,
  onSaved,
}: {
  template?: EmailTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { accessToken } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      bodyHtml: template?.bodyHtml ?? "",
    },
  });

  const onSubmit = async (values: TemplateFormValues) => {
    setServerError(null);
    try {
      if (template) {
        await apiRequest(`/templates/${template.id}`, { method: "PATCH", body: values, accessToken });
      } else {
        await apiRequest("/templates", { method: "POST", body: values, accessToken });
      }
      onSaved();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-black/[.08] bg-white p-6 shadow-lg dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">{template ? "Edit template" : "New template"}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Template name</span>
            <input {...register("name")} className="input" placeholder="Welcome email" />
            {errors.name ? <span className="text-xs text-red-600">{errors.name.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Subject</span>
            <input {...register("subject")} className="input" placeholder="Welcome to {{company}}, {{first_name}}!" />
            {errors.subject ? <span className="text-xs text-red-600">{errors.subject.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Content (HTML)</span>
            <textarea
              {...register("bodyHtml")}
              rows={8}
              className="input font-mono text-xs"
              placeholder="Hello {{first_name}}, ..."
            />
            <span className="text-xs text-zinc-500">
              Personalize with variables: {"{{first_name}}"}, {"{{last_name}}"}, {"{{company}}"}, {"{{city}}"}
            </span>
            {errors.bodyHtml ? <span className="text-xs text-red-600">{errors.bodyHtml.message}</span> : null}
          </label>

          {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Saving..." : "Save template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

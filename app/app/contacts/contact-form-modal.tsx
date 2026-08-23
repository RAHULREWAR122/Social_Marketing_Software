"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Contact, ContactList, Tag } from "@/lib/contacts-types";

const contactFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  emailOptIn: z.boolean(),
  whatsappOptIn: z.boolean(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export function ContactFormModal({
  contact,
  lists,
  tags,
  onClose,
  onSaved,
}: {
  contact?: Contact | null;
  lists: ContactList[];
  tags: Tag[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { accessToken } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(contact?.tags.map((t) => t.tag.id) ?? []);
  const [selectedListIds, setSelectedListIds] = useState<string[]>(
    contact?.listMemberships?.map((m) => m.contactList.id) ?? [],
  );

  // The contacts table row doesn't carry listMemberships — fetch the full record when editing.
  useEffect(() => {
    if (!contact || !accessToken) return;
    apiRequest<{ contact: Contact }>(`/contacts/${contact.id}`, { accessToken }).then((res) => {
      setSelectedListIds(res.contact.listMemberships?.map((m) => m.contactList.id) ?? []);
    });
  }, [contact, accessToken]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: contact?.firstName ?? "",
      lastName: contact?.lastName ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      company: contact?.company ?? "",
      city: contact?.city ?? "",
      country: contact?.country ?? "",
      emailOptIn: contact?.emailOptIn ?? true,
      whatsappOptIn: contact?.whatsappOptIn ?? true,
    },
  });

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const onSubmit = async (values: ContactFormValues) => {
    setServerError(null);
    const payload = {
      ...values,
      email: values.email || undefined,
      tagIds: selectedTagIds,
    };

    try {
      const originalListIds = contact?.listMemberships?.map((m) => m.contactList.id) ?? [];

      let contactId = contact?.id;
      if (contact) {
        await apiRequest(`/contacts/${contact.id}`, { method: "PATCH", body: payload, accessToken });
      } else {
        const { contact: created } = await apiRequest<{ contact: Contact }>("/contacts", {
          method: "POST",
          body: payload,
          accessToken,
        });
        contactId = created.id;
      }

      const listsToAdd = selectedListIds.filter((id) => !originalListIds.includes(id));
      const listsToRemove = originalListIds.filter((id) => !selectedListIds.includes(id));

      await Promise.all([
        ...listsToAdd.map((listId) =>
          apiRequest(`/lists/${listId}/contacts`, { method: "POST", body: { contactIds: [contactId] }, accessToken }),
        ),
        ...listsToRemove.map((listId) =>
          apiRequest(`/lists/${listId}/contacts/${contactId}`, { method: "DELETE", accessToken }),
        ),
      ]);

      onSaved();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl border border-black/[.08] bg-white p-6 shadow-lg dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">{contact ? "Edit contact" : "Add contact"}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
          <div className="flex gap-3">
            <input {...register("firstName")} className="input" placeholder="First name" />
            <input {...register("lastName")} className="input" placeholder="Last name" />
          </div>
          <input {...register("email")} className="input" placeholder="Email" />
          {errors.email ? <span className="text-xs text-red-600">{errors.email.message}</span> : null}
          <input {...register("phone")} className="input" placeholder="Phone (e.g. +91XXXXXXXXXX)" />
          <input {...register("company")} className="input" placeholder="Company" />
          <div className="flex gap-3">
            <input {...register("city")} className="input" placeholder="City" />
            <input {...register("country")} className="input" placeholder="Country" />
          </div>

          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("emailOptIn")} />
              Email opt-in
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("whatsappOptIn")} />
              WhatsApp opt-in
            </label>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
            <span className="text-sm font-medium">Lists</span>
            {lists.length === 0 ? (
              <p className="text-xs text-zinc-500">No lists yet — create one from the Contacts page.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lists.map((list) => (
                  <label
                    key={list.id}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                      selectedListIds.includes(list.id)
                        ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                        : "border-black/[.08] dark:border-white/[.145]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedListIds.includes(list.id)}
                      onChange={() => setSelectedListIds((prev) => toggle(prev, list.id))}
                    />
                    {list.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Tags</span>
            {tags.length === 0 ? (
              <p className="text-xs text-zinc-500">No tags yet — create one from the Contacts page.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                      selectedTagIds.includes(tag.id)
                        ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                        : "border-black/[.08] dark:border-white/[.145]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => setSelectedTagIds((prev) => toggle(prev, tag.id))}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Contact, ContactList, ContactListResponse, Tag } from "@/lib/contacts-types";
import { ContactFormModal } from "./contact-form-modal";

const PAGE_SIZE = 25;

export default function ContactsPage() {
  const { accessToken } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [lists, setLists] = useState<ContactList[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalContact, setModalContact] = useState<Contact | null | undefined>(undefined);

  const loadContacts = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (listFilter) params.set("listId", listFilter);
      if (tagFilter) params.set("tagId", tagFilter);

      const result = await apiRequest<ContactListResponse>(`/contacts?${params.toString()}`, {
        accessToken,
      });
      setContacts(result.contacts);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search, listFilter, tagFilter]);

  const loadFilters = useCallback(async () => {
    if (!accessToken) return;
    const [listsResult, tagsResult] = await Promise.all([
      apiRequest<{ lists: ContactList[] }>("/lists", { accessToken }),
      apiRequest<{ tags: Tag[] }>("/tags", { accessToken }),
    ]);
    setLists(listsResult.lists);
    setTags(tagsResult.tags);
  }, [accessToken]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Delete ${contact.firstName ?? contact.email ?? "this contact"}?`)) return;
    await apiRequest(`/contacts/${contact.id}`, { method: "DELETE", accessToken });
    loadContacts();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{total} contacts</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/contacts/import" className="btn-secondary px-4">
            Import CSV
          </Link>
          <button onClick={() => setModalContact(null)} className="btn-primary px-4">
            Add contact
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="input max-w-xs"
          placeholder="Search name, email, phone..."
        />
        <select
          value={listFilter}
          onChange={(e) => {
            setPage(1);
            setListFilter(e.target.value);
          }}
          className="input max-w-[200px]"
        >
          <option value="">All lists</option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => {
            setPage(1);
            setTagFilter(e.target.value);
          }}
          className="input max-w-[200px]"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <QuickCreate label="+ New list" onCreate={async (name) => {
          await apiRequest("/lists", { method: "POST", body: { name }, accessToken });
          loadFilters();
        }} />
        <QuickCreate label="+ New tag" onCreate={async (name) => {
          await apiRequest("/tags", { method: "POST", body: { name }, accessToken });
          loadFilters();
        }} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/[.08] text-xs uppercase text-zinc-500 dark:border-white/[.145]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Opt-in</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  No contacts yet. Add one or import a CSV to get started.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                  <td className="px-4 py-3 font-medium">
                    {contact.firstName || contact.lastName
                      ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{contact.email ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{contact.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {contact.emailOptIn ? "Email ✓" : "Email ✕"} / {contact.whatsappOptIn ? "WA ✓" : "WA ✕"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setModalContact(contact)}
                      className="mr-3 text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-black/[.08] px-3 py-1 disabled:opacity-40 dark:border-white/[.145]"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-black/[.08] px-3 py-1 disabled:opacity-40 dark:border-white/[.145]"
          >
            Next
          </button>
        </div>
      ) : null}

      {modalContact !== undefined ? (
        <ContactFormModal
          contact={modalContact}
          lists={lists}
          tags={tags}
          onClose={() => setModalContact(undefined)}
          onSaved={() => {
            setModalContact(undefined);
            loadContacts();
          }}
        />
      ) : null}
    </div>
  );
}

function QuickCreate({ label, onCreate }: { label: string; onCreate: (name: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-md border border-black/[.08] px-3 py-2 text-sm text-zinc-600 hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-white/[.08]">
        {label}
      </button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setBusy(true);
        await onCreate(name.trim());
        setBusy(false);
        setName("");
        setOpen(false);
      }}
      className="flex items-center gap-1"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input max-w-[160px]"
        placeholder="Name"
      />
      <button type="submit" disabled={busy} className="rounded-md bg-zinc-950 px-3 py-2 text-sm text-white dark:bg-white dark:text-zinc-950">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="px-2 text-sm text-zinc-500">
        ✕
      </button>
    </form>
  );
}

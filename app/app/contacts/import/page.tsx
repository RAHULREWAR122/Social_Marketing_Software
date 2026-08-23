"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { apiUpload, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const SYSTEM_FIELDS: { key: string; label: string }[] = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
];

type PreviewResult = {
  columns: string[];
  suggestedMapping: Record<string, string>;
  sampleRows: Record<string, string>[];
};

type ImportReport = {
  totalRows: number;
  imported: number;
  duplicatesInFile: number;
  duplicatesInDatabase: number;
  invalidEmail: number;
  invalidPhone: number;
  missingIdentifier: number;
};

export default function ImportContactsPage() {
  const { accessToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setReport(null);
    setError(null);
    setIsBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const result = await apiUpload<PreviewResult>("/contacts/import/preview", formData, accessToken);
      setPreview(result);
      setMapping(result.suggestedMapping);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to read this file");
      setPreview(null);
    } finally {
      setIsBusy(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mapping", JSON.stringify(mapping));
      const result = await apiUpload<{ report: ImportReport }>(
        "/contacts/import/confirm",
        formData,
        accessToken,
      );
      setReport(result.report);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setIsBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setMapping({});
    setReport(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/app/contacts" className="text-sm text-zinc-500 hover:underline">
          ← Back to contacts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Import contacts</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Upload a CSV file, map its columns, then import.
        </p>
      </div>

      {!preview && !report ? (
        <div className="rounded-xl border border-dashed border-black/[.15] bg-white p-10 text-center dark:border-white/[.2] dark:bg-zinc-950">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <button onClick={() => fileRef.current?.click()} className="btn-primary mx-auto w-auto px-6">
            {isBusy ? "Reading file..." : "Choose CSV file"}
          </button>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
      ) : null}

      {preview && !report ? (
        <div className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold">Map columns</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Match each CSV column to a contact field. At least email or phone is required per row.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {SYSTEM_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm font-medium">{field.label}</span>
                <select
                  className="input"
                  value={mapping[field.key] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                >
                  <option value="">— Not mapped —</option>
                  {preview.columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-6 flex gap-2">
            <button onClick={reset} className="btn-secondary w-auto px-4">
              Cancel
            </button>
            <button onClick={handleImport} disabled={isBusy} className="btn-primary w-auto px-4">
              {isBusy ? "Importing..." : "Import contacts"}
            </button>
          </div>
        </div>
      ) : null}

      {report ? (
        <div className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold">Import complete</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <ReportStat label="Total rows" value={report.totalRows} />
            <ReportStat label="Imported" value={report.imported} highlight />
            <ReportStat label="Duplicates in file" value={report.duplicatesInFile} />
            <ReportStat label="Already existed" value={report.duplicatesInDatabase} />
            <ReportStat label="Invalid email" value={report.invalidEmail} />
            <ReportStat label="Invalid phone" value={report.invalidPhone} />
            <ReportStat label="Missing email & phone" value={report.missingIdentifier} />
          </dl>
          <div className="mt-6 flex gap-2">
            <button onClick={reset} className="btn-secondary w-auto px-4">
              Import another file
            </button>
            <Link href="/app/contacts" className="btn-primary w-auto px-4 text-center">
              View contacts
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReportStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className={`text-xl font-semibold ${highlight ? "text-green-600 dark:text-green-500" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

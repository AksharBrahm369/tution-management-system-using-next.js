"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileUp, Save } from "lucide-react";
import { useFormDraft } from "@/hooks/useFormDraft";

type BatchOption = {
  id: string;
  name: string;
  code: string;
};

type SubjectOption = {
  id: string;
  name: string;
  code: string;
};

type Props = {
  batches: BatchOption[];
  subjects: SubjectOption[];
  isCloudinaryConfigured?: boolean;
  missingCloudinaryVars?: string[];
};

const initialForm = {
  title: "",
  description: "",
  subjectId: "",
  batchId: "",
  resourceType: "PDF Notes",
  accessLevel: "PUBLIC",
  resourceUrl: "",
  standardId: "",
};

export default function CreateMaterialPage({
  batches,
  subjects,
  standardId = "",
  returnHref,
  isCloudinaryConfigured = true,
  missingCloudinaryVars = [],
}: Props & { standardId?: string; returnHref?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...initialForm, standardId });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { clearDraft } = useFormDraft<any>({
    keyName: "admin-materials-create",
    values: form,
    onRestore: (draft) => setForm(draft),
  });

  const handleChange = (name: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Material title is required.");
      return;
    }
    if (!form.resourceType.trim()) {
      setError("Resource type is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append("file", file);

      const response = await fetch("/api/admin/materials", {
        method: "POST",
        credentials: "include",
        body: payload,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save study material");
      }

      clearDraft();
      router.push(returnHref ?? "/admin/materials");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save study material");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Study Material</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Create resource</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Save notes, worksheets, links, or uploaded files for batches and subjects.</p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {submitting ? "Saving..." : "Save resource"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Title <span className="text-red-500">*</span></span>
            <input
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
              placeholder="Enter resource title"
              required
              aria-required="true"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
              placeholder="Add a short description for students and staff"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject</span>
            <select
              value={form.subjectId}
              onChange={(event) => handleChange("subjectId", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Batch</span>
            <select
              value={form.batchId}
              onChange={(event) => handleChange("batchId", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch.code})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Resource type <span className="text-red-500">*</span></span>
            <input
              value={form.resourceType}
              onChange={(event) => handleChange("resourceType", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
              placeholder="PDF Notes, Worksheet, Video, Link"
              required
              aria-required="true"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Access</span>
            <select
              value={form.accessLevel}
              onChange={(event) => handleChange("accessLevel", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
            >
              <option value="PUBLIC">Public</option>
              <option value="BATCH_ONLY">Batch Only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Resource URL</span>
            <input
              value={form.resourceUrl}
              onChange={(event) => handleChange("resourceUrl", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
              placeholder="Optional external link or keep blank if uploading a file"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Upload file</span>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/30">
              {!isCloudinaryConfigured ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    File uploads are disabled because Cloudinary credentials are not configured.
                  </p>
                  <p className="text-xs text-slate-500">
                    Missing env variables: <code className="bg-rose-50 dark:bg-rose-950/30 px-1 py-0.5 rounded font-mono text-[10px]">{missingCloudinaryVars.join(", ")}</code>
                  </p>
                  <input
                    type="file"
                    disabled
                    className="block w-full text-sm text-slate-400 cursor-not-allowed opacity-50"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <FileUp className="h-5 w-5 text-slate-400" />
                    <input
                      type="file"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-white hover:file:bg-indigo-500 dark:text-slate-300"
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Selected file will be uploaded and linked to this resource.
                  </p>
                </>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookMarked, FileText, FolderOpen, GraduationCap, LibraryBig, Search, ShieldCheck, Upload } from "lucide-react";
import WelcomeHeader from "@/components/admin/dashboard/WelcomeHeader";
import StatsCard from "@/components/admin/dashboard/StatsCard";
import QuickActions from "@/components/admin/dashboard/QuickActions";

type MaterialItem = {
  id: string;
  title: string;
  subject: string;
  batch: string;
  type: string;
  updatedAt: string;
  size: string;
  access: string;
  resourceUrl?: string | null;
};

export default function MaterialsDashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredMaterials = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return materials;
    return materials.filter((item) =>
      [item.title, item.subject, item.batch, item.type, item.access].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [query]);

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/materials", { credentials: "include" });
      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load study materials");
      }

      const payload = await response.json();
      setMaterials(payload.materials ?? []);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to load study materials");
    } finally {
      setLoading(false);
    }
  }

  const summaryCards = [
    {
      label: "Resources",
      value: materials.length,
      icon: <LibraryBig className="h-5 w-5" />,
      color: "indigo" as const,
      changeLabel: "available files",
      change: 12,
    },
    {
      label: "Public",
      value: materials.filter((item) => item.access === "Public").length,
      icon: <ShieldCheck className="h-5 w-5" />,
      color: "green" as const,
      changeLabel: "open access",
      change: 8,
    },
    {
      label: "Batch Only",
      value: materials.filter((item) => item.access === "Batch Only").length,
      icon: <FolderOpen className="h-5 w-5" />,
      color: "orange" as const,
      changeLabel: "restricted files",
      change: 4,
    },
    {
      label: "Uploads",
      value: 1,
      icon: <Upload className="h-5 w-5" />,
      color: "blue" as const,
      changeLabel: "pending sync",
      change: -2,
    },
  ];

  return (
    <div className="space-y-6">
      <WelcomeHeader adminName="Admin User" />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Study Material</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Manage notes, worksheets, and downloads</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              This page is now live and reachable from the admin sidebar. It is ready for material cataloging, access control, and future upload integration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/materials/create"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Create resource <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/materials/create" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
              <Upload className="h-4 w-4" />
              Upload file
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <StatsCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
            change={card.change}
            changeLabel={card.changeLabel}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Library</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Saved materials</h2>
            </div>

            <label className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:w-[320px] dark:border-slate-700 dark:bg-slate-950/40">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search study material..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Batch</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Access</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {!loading && filteredMaterials.map((item) => (
                    <tr key={item.id} className="bg-white dark:bg-slate-900/70">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.subject}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.batch}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.type}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                          {item.access}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                        {item.resourceUrl ? (
                          <a href={item.resourceUrl} className="text-cyan-600 hover:underline dark:text-cyan-400" target="_blank" rel="noreferrer">
                            Open file
                          </a>
                        ) : (
                          item.updatedAt
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && filteredMaterials.length === 0 && (
              <div className="border-t border-slate-200 p-8 text-center dark:border-slate-800">
                <FileText className="mx-auto h-10 w-10 text-slate-400" />
                <div className="mt-3 text-sm font-medium text-slate-900 dark:text-white">No materials found</div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try a different search or upload a new resource.</div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Guidelines</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Material publishing flow</h2>
              </div>
              <BookMarked className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>1. Upload files or links for a specific subject.</p>
              <p>2. Choose whether content is public, batch only, or private.</p>
              <p>3. Attach a batch and keep the material catalog searchable.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Shortcuts</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Related admin tasks</h2>
              </div>
              <GraduationCap className="h-5 w-5 text-slate-400" />
            </div>
            <QuickActions />
          </div>
        </div>
      </section>
    </div>
  );
}
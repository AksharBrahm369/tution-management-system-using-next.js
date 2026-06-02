"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookMarked,
  FileText,
  FolderOpen,
  GraduationCap,
  LibraryBig,
  Search,
  ShieldCheck,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  ExternalLink
} from "lucide-react";
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
  description?: string | null;
};

export default function MaterialsDashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Subject and Batch lists for dynamic dropdowns
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>([]);

  // AI Generator Dialog State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiSubjectId, setAiSubjectId] = useState("");
  const [aiBatchId, setAiBatchId] = useState("");
  const [aiType, setAiType] = useState("NOTES"); // NOTES, TEXTBOOK, WORKSHEET, QUIZ
  const [aiAccess, setAiAccess] = useState("PUBLIC"); // PUBLIC, BATCH_ONLY, PRIVATE
  
  // AI Execution States
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreviewContent, setAiPreviewContent] = useState("");
  const [generatedMaterial, setGeneratedMaterial] = useState<any>(null);
  const [isRealAiSuccess, setIsRealAiSuccess] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const filteredMaterials = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return materials;
    return materials.filter((item) =>
      [item.title, item.subject, item.batch, item.type, item.access].some((value) =>
        String(value || "").toLowerCase().includes(term),
      ),
    );
  }, [query, materials]);

  useEffect(() => {
    loadMaterials();
    loadFiltersData();
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

  async function loadFiltersData() {
    try {
      const [subRes, batRes] = await Promise.all([
        fetch("/api/admin/subjects"),
        fetch("/api/admin/batches?limit=100")
      ]);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubjects(subData.subjects ?? []);
        if (subData.subjects?.length > 0) {
          setAiSubjectId(subData.subjects[0].id);
        }
      }
      if (batRes.ok) {
        const batData = await batRes.json();
        setBatches(batData.batches ?? []);
        if (batData.batches?.length > 0) {
          setAiBatchId(batData.batches[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load filter dependencies:", err);
    }
  }

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTitle.trim() || !aiTopic.trim()) {
      alert("Please provide a Title and a Topic Description.");
      return;
    }

    setAiGenerating(true);
    setGenerationError("");
    setAiPreviewContent("");
    setGeneratedMaterial(null);

    try {
      const res = await fetch("/api/admin/materials/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: aiTitle.trim(),
          description: `AI generated study material for ${aiTopic.trim()}`,
          subjectId: aiSubjectId || null,
          batchId: aiBatchId || null,
          resourceType: aiType,
          accessLevel: aiAccess,
          topic: aiTopic.trim(),
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "AI generation failed.");
      }

      const payload = await res.json();
      setAiPreviewContent(payload.content || "");
      setGeneratedMaterial(payload.material || null);
      setIsRealAiSuccess(payload.isRealAI || false);
    } catch (err) {
      console.error("AI Generation Error:", err);
      setGenerationError(err instanceof Error ? err.message : "An unexpected error occurred during generation.");
    } finally {
      setAiGenerating(false);
    }
  };

  const closeAndRefresh = () => {
    setIsAiModalOpen(false);
    // Reset modal states for clean restarts
    setAiTitle("");
    setAiTopic("");
    setAiPreviewContent("");
    setGeneratedMaterial(null);
    setGenerationError("");
    loadMaterials();
  };

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
      value: materials.filter((item) => item.access === "Public" || item.access === "PUBLIC").length,
      icon: <ShieldCheck className="h-5 w-5" />,
      color: "green" as const,
      changeLabel: "open access",
      change: 8,
    },
    {
      label: "Batch Only",
      value: materials.filter((item) => item.access === "Batch Only" || item.access === "BATCH_ONLY").length,
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
      <WelcomeHeader />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Study Material</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Manage notes, worksheets, and downloads</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              This page is now live and reachable from the admin sidebar. It is ready for material cataloging, access control, and future upload integration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 shadow-md active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </button>
            <Link
              href="/admin/materials/create"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Create resource <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/materials/create" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500">
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
                          {String(item.access).replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400 flex items-start gap-3 relative min-w-[280px]">
                        {(() => {
                          if (!item.resourceUrl) {
                            return <span className="text-xs sm:text-sm pt-1.5 inline-block">{item.updatedAt}</span>;
                          }

                          if (!item.resourceUrl.startsWith("http")) {
                            // Local file upload
                            return (
                              <a href={item.resourceUrl} className="text-cyan-600 hover:underline dark:text-cyan-400 inline-flex items-center gap-1 font-medium text-xs sm:text-sm pt-1.5 animate-fade-in" target="_blank" rel="noreferrer">
                                Open File <ExternalLink className="h-3 w-3" />
                              </a>
                            );
                          }

                          // Crawl description for links
                          const text = item.description || "";
                          const links: Array<{ name: string; url: string }> = [];
                          const regex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
                          let match;
                          while ((match = regex.exec(text)) !== null) {
                            links.push({ name: match[1], url: match[2] });
                          }

                          // If there are multiple links, render a beautiful inline expanding list!
                          if (links.length > 0) {
                            const isOpen = activeDropdownId === item.id;
                            return (
                              <div className="flex flex-col gap-2 animate-fade-in">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownId(isOpen ? null : item.id);
                                  }}
                                  className="whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl border border-indigo-150 bg-indigo-50/40 hover:bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 transition dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-300 dark:hover:bg-indigo-950/30 active:scale-95 shadow-sm w-fit"
                                >
                                  Open Website ({links.length})
                                  <span className="text-[9px] opacity-75">{isOpen ? "▲" : "▼"}</span>
                                </button>

                                {isOpen && (
                                  <div className="w-72 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-inner dark:border-slate-800 dark:bg-slate-950/40 space-y-1.5 animate-slide-down">
                                    <div className="px-2 py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Select Platform Options</p>
                                    </div>
                                    <div className="space-y-1 max-h-[180px] overflow-y-auto pr-0.5">
                                      {links.map((link, idx) => (
                                        <a
                                          key={idx}
                                          href={link.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-indigo-50 hover:text-indigo-600 transition dark:text-slate-350 dark:bg-slate-900/60 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-450 group border border-slate-100 dark:border-slate-800/40 shadow-sm"
                                        >
                                          <span className="truncate max-w-[190px]">{link.name}</span>
                                          <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // Single website link fallback
                          return (
                            <a href={item.resourceUrl} className="text-cyan-600 hover:underline dark:text-cyan-400 inline-flex items-center gap-1 font-medium text-xs sm:text-sm pt-1.5 animate-fade-in" target="_blank" rel="noreferrer">
                              Open Website <ExternalLink className="h-3 w-3" />
                            </a>
                          );
                        })()}

                        <button
                          onClick={() => setSelectedMaterial(item)}
                          className="whitespace-nowrap inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 active:scale-95 animate-fade-in"
                          title="View all recommended platforms & directory"
                        >
                          <FolderOpen className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          Options
                        </button>
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
              <p>1. Generate structured reference textbook pages or quizzes instantly with secure server-side AI.</p>
              <p>2. Upload locally stored worksheets or attachments for specific subjects.</p>
              <p>3. Choose whether content is public, batch only, or private.</p>
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

      {/* SECURE AI STUDY MATERIAL GENERATOR OVERLAY MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Study Material Generator</h3>
                  <p className="text-xs text-slate-500">Draft high-quality lessons, quizzes, or homework worksheets securely via server AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              
              {!aiPreviewContent && !aiGenerating && (
                <form onSubmit={handleGenerateAI} className="space-y-4">
                  
                  {/* Subject and Batch */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Subject</label>
                      <select 
                        value={aiSubjectId} 
                        onChange={(e) => setAiSubjectId(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
                        required
                      >
                        <option value="">Select Subject...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Target Batch</label>
                      <select 
                        value={aiBatchId} 
                        onChange={(e) => setAiBatchId(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">All Batches</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Resource Type and Access Level */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Resource Category</label>
                      <select 
                        value={aiType} 
                        onChange={(e) => setAiType(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
                        required
                      >
                        <option value="NOTES">Revision Notes</option>
                        <option value="TEXTBOOK">Textbook Chapter</option>
                        <option value="WORKSHEET">Class Worksheet</option>
                        <option value="QUIZ">Evaluation Quiz</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Access Level</label>
                      <select 
                        value={aiAccess} 
                        onChange={(e) => setAiAccess(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
                        required
                      >
                        <option value="PUBLIC">Public (All batches/unrestricted)</option>
                        <option value="BATCH_ONLY">Batch Restricted (Enrolled students only)</option>
                        <option value="PRIVATE">Private (Teachers/Admins only)</option>
                      </select>
                    </div>
                  </div>

                  {/* Resource Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Material / Resource Title</label>
                    <input 
                      type="text"
                      value={aiTitle}
                      onChange={(e) => setAiTitle(e.target.value)}
                      placeholder="e.g. Calculus: Introduction to Limits and Integrals"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>

                  {/* Topic / Prompt */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Prompt / Topic Description</label>
                    <textarea 
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Describe what key concepts, formulas, and proofs you want the AI to incorporate. E.g.: Trigonometric identity proofs, solved problems, exam cheat sheets, and 5 multiple choice quiz questions."
                      className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate & Save to Library
                  </button>

                </form>
              )}

              {/* GENERATING / LOADING STATE */}
              {aiGenerating && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">AI is reading textbooks, generating proofs & illustrations...</h4>
                    <p className="text-xs text-slate-500 mt-1">This might take up to 20 seconds. Thank you for your patience.</p>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {generationError && (
                <div className="py-6 space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <X className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">AI Material Generation Failed</h4>
                    <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">{generationError}</p>
                  </div>
                  <button 
                    onClick={() => setGenerationError("")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
                  >
                    Go Back / Retry
                  </button>
                </div>
              )}

              {/* GENERATION SUCCESS & MARKDOWN PREVIEW */}
              {aiPreviewContent && !aiGenerating && (
                <div className="space-y-4 animate-slide-up">
                  <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Material Compiled Successfully!</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Generated via {isRealAiSuccess ? "Secure Google Gemini AI model" : "TuitionPro Academic Compiler"}. 
                        Saved to your study downloads catalog.
                      </p>
                    </div>
                  </div>

                  {/* Markdown Scrollable Preview Window */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Preview Generated Markdown</span>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 p-4 max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-350 select-all whitespace-pre-wrap">
                      {aiPreviewContent}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={closeAndRefresh}
                      className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-sm font-semibold transition flex items-center justify-center gap-2"
                    >
                      Close & Refresh List
                    </button>
                    {generatedMaterial?.resourceUrl && (
                      <a
                        href={generatedMaterial.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md"
                      >
                        {generatedMaterial.resourceUrl.startsWith("http") ? "Open Website" : "Open Generated File"}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* DIRECTORY DETAIL & OPTIONS DRAWER */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="h-full w-full max-w-lg border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 p-6 flex flex-col animate-slide-left overflow-hidden rounded-l-3xl">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{selectedMaterial.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedMaterial.subject} | {selectedMaterial.batch}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMaterial(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              
              {/* Type, Access, File tags */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  Category: {selectedMaterial.type}
                </span>
                <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Access: {String(selectedMaterial.access).replaceAll("_", " ")}
                </span>
                {selectedMaterial.size && (
                  <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Source: {selectedMaterial.size}
                  </span>
                )}
              </div>

              {/* Crawled Platform Options List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indexed Platforms & Websites</h4>
                {(() => {
                  const text = selectedMaterial.description || "";
                  const links: Array<{ name: string; url: string }> = [];
                  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
                  let match;
                  while ((match = regex.exec(text)) !== null) {
                    links.push({ name: match[1], url: match[2] });
                  }

                  if (links.length > 0) {
                    return (
                      <div className="grid gap-3">
                        {links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 hover:scale-[1.01] transition shadow-sm dark:border-indigo-950/30 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 group"
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Option #{idx + 1}</span>
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {link.name}
                              </div>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm border border-slate-150 dark:bg-slate-800 dark:text-indigo-400 dark:border-slate-700">
                              <ExternalLink className="h-4 w-4" />
                            </div>
                          </a>
                        ))}
                      </div>
                    );
                  }

                  if (selectedMaterial.resourceUrl && selectedMaterial.resourceUrl.startsWith("http")) {
                    return (
                      <a
                        href={selectedMaterial.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 hover:scale-[1.01] transition shadow-sm dark:border-indigo-950/30 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 group"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Primary Link</span>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Visit Found Website Portal
                          </div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm border border-slate-150 dark:bg-slate-800 dark:text-indigo-400 dark:border-slate-700">
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    );
                  }

                  return (
                    <p className="text-xs text-slate-500 italic">No external website links parsed in this material.</p>
                  );
                })()}
              </div>

              {/* Full Description / Markdown Summary */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Curated Summary & Directory Details</h4>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 p-4 max-h-[350px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-350 select-all whitespace-pre-wrap">
                  {selectedMaterial.description || "No summary description text compiled."}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button 
                onClick={() => setSelectedMaterial(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-bold transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeIndianRupee, CalendarDays, FileBarChart2, Filter, RefreshCcw, TrendingUp, Users } from "lucide-react";
import WelcomeHeader from "@/components/admin/dashboard/WelcomeHeader";
import StatsCard from "@/components/admin/dashboard/StatsCard";
import FeeBarChart from "@/components/admin/dashboard/FeeBarChart";
import RecentPayments from "@/components/admin/dashboard/RecentPayments";
import QuickActions from "@/components/admin/dashboard/QuickActions";

type FeeSummary = {
	month: number;
	year: number;
	totalDue: number;
	totalCollected: number;
	pendingAmount: number;
	overdueAmount: number;
	totalStudents: number;
	dueStudents: number;
};

type FeeRecord = {
	id: string;
	month: number;
	year: number;
	totalAmount: number;
	paidAmount: number;
	pendingAmount: number;
	status: string;
	student?: {
		id: string;
		firstName?: string;
		lastName?: string;
		studentCode?: string;
	};
	batch?: {
		id: string;
		name?: string;
	};
};

const monthLabels = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

function formatCurrency(value: number) {
	return `₹ ${value.toLocaleString("en-IN")}`;
}

export default function AdminFeeReportsPage() {
	const router = useRouter();
	const now = new Date();
	const [month, setMonth] = useState(String(now.getMonth() + 1));
	const [year, setYear] = useState(String(now.getFullYear()));
	const [summary, setSummary] = useState<FeeSummary | null>(null);
	const [records, setRecords] = useState<FeeRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const selectedMonthIndex = Number(month) - 1;
	const selectedMonthLabel = monthLabels[selectedMonthIndex] || "Current";

	const totalOutstanding = useMemo(() => {
		if (!summary) return 0;
		return summary.pendingAmount + summary.overdueAmount;
	}, [summary]);

	useEffect(() => {
		loadReports();
	}, [month, year]);

	async function loadReports() {
		setLoading(true);
		try {
			const [summaryResponse, recordsResponse] = await Promise.all([
				fetch(`/api/admin/fees?month=${month}&year=${year}`, { credentials: "include" }),
				fetch("/api/admin/fees/records", { credentials: "include" }),
			]);

			if (summaryResponse.status === 401 || recordsResponse.status === 401) {
				router.push("/auth/login");
				return;
			}

			if (!summaryResponse.ok) {
				const payload = await summaryResponse.json().catch(() => ({}));
				throw new Error(payload.error || "Failed to load fee summary");
			}

			if (!recordsResponse.ok) {
				const payload = await recordsResponse.json().catch(() => ({}));
				throw new Error(payload.error || "Failed to load fee records");
			}

			const summaryPayload = await summaryResponse.json();
			const recordsPayload = await recordsResponse.json();
			setSummary(summaryPayload);
			setRecords(recordsPayload.records ?? []);
		} catch (error) {
			console.error(error);
			alert(error instanceof Error ? error.message : "Failed to load fee reports");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}

	async function refreshReports() {
		setRefreshing(true);
		await loadReports();
	}

	const summaryCards = [
		{
			label: "Total Due",
			value: summary ? formatCurrency(summary.totalDue) : "₹ 0",
			icon: <BadgeIndianRupee className="h-5 w-5" />,
			color: "red" as const,
			changeLabel: `${selectedMonthLabel} ${year}`,
			change: summary && summary.totalDue > 0 ? 8 : -2,
		},
		{
			label: "Collected",
			value: summary ? formatCurrency(summary.totalCollected) : "₹ 0",
			icon: <TrendingUp className="h-5 w-5" />,
			color: "green" as const,
			changeLabel: "payments received",
			change: summary && summary.totalCollected > 0 ? 14 : -1,
		},
		{
			label: "Pending",
			value: summary ? formatCurrency(summary.pendingAmount) : "₹ 0",
			icon: <CalendarDays className="h-5 w-5" />,
			color: "orange" as const,
			changeLabel: "open dues",
			change: summary && summary.pendingAmount > 0 ? 5 : -3,
		},
		{
			label: "Due Students",
			value: summary?.dueStudents ?? 0,
			icon: <Users className="h-5 w-5" />,
			color: "blue" as const,
			changeLabel: "students with dues",
			change: summary && summary.dueStudents > 0 ? 6 : -1,
		},
	];

	return (
		<div className="space-y-6">
			<WelcomeHeader adminName="Admin User" />

			<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Fee Reports</p>
						<h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Collection and due summary</h1>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
							Review monthly collection, open dues, and the students who still need follow-up.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-950/40">
							<Filter className="h-4 w-4 text-slate-500" />
							<select
								value={month}
								onChange={(event) => setMonth(event.target.value)}
								className="bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
							>
								{monthLabels.map((label, index) => (
									<option key={label} value={String(index + 1)}>
										{label}
									</option>
								))}
							</select>
							<select
								value={year}
								onChange={(event) => setYear(event.target.value)}
								className="bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
							>
								{Array.from({ length: 6 }).map((_, index) => {
									const optionYear = String(now.getFullYear() - index);
									return (
										<option key={optionYear} value={optionYear}>
											{optionYear}
										</option>
									);
								})}
							</select>
						</div>

						<button
							onClick={refreshReports}
							disabled={refreshing}
							className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
						>
							<RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
							Refresh
						</button>

						<button
							onClick={() => router.push("/admin/fees/collect")}
							className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
						>
							Collect fee <ArrowRight className="h-4 w-4" />
						</button>
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

			<section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
					<div className="mb-5 flex items-center justify-between gap-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Trends</p>
							<h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Fee collection graph</h2>
						</div>
						<FileBarChart2 className="h-5 w-5 text-slate-400" />
					</div>
					<FeeBarChart />
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
					<div className="mb-5 flex items-center justify-between gap-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Snapshot</p>
							<h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Current month summary</h2>
						</div>
					</div>

					<div className="space-y-4">
						<div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/40">
							<div className="text-sm text-slate-500 dark:text-slate-400">Outstanding amount</div>
							<div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{summary ? formatCurrency(totalOutstanding) : "₹ 0"}</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
								<div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Collected</div>
								<div className="mt-1 text-lg font-semibold text-emerald-900 dark:text-emerald-100">{summary ? formatCurrency(summary.totalCollected) : "₹ 0"}</div>
							</div>
							<div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/20">
								<div className="text-xs font-medium text-amber-700 dark:text-amber-300">Pending</div>
								<div className="mt-1 text-lg font-semibold text-amber-900 dark:text-amber-100">{summary ? formatCurrency(summary.pendingAmount) : "₹ 0"}</div>
							</div>
						</div>
						<div className="rounded-2xl border border-dashed border-slate-200 p-4 dark:border-slate-700">
							<div className="text-sm font-medium text-slate-700 dark:text-slate-200">Students with dues</div>
							<div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{summary?.dueStudents ?? 0}</div>
							<div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Out of {summary?.totalStudents ?? 0} active students</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Payments</p>
							<h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Recent collections</h2>
						</div>
					</div>
					<RecentPayments />
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Open dues</p>
							<h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Pending fee records</h2>
						</div>
						<Link
							href="/admin/fees/collect"
							className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
						>
							Go to collection <ArrowRight className="h-4 w-4" />
						</Link>
					</div>

					<div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
						<div className="max-h-115 overflow-auto">
							{loading ? (
								<div className="space-y-3 p-4">
									{Array.from({ length: 5 }).map((_, index) => (
										<div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/80" />
									))}
								</div>
							) : records.length > 0 ? (
								<table className="min-w-full text-left text-sm">
									<thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
										<tr>
											<th className="px-4 py-3 font-semibold">Student</th>
											<th className="px-4 py-3 font-semibold">Batch</th>
											<th className="px-4 py-3 font-semibold">Due</th>
											<th className="px-4 py-3 font-semibold">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{records.slice(0, 12).map((record) => {
											const studentName = [record.student?.firstName, record.student?.lastName].filter(Boolean).join(" ") || "Student";
											return (
												<tr key={record.id} className="bg-white dark:bg-slate-900/70">
													<td className="px-4 py-3">
														<div className="font-medium text-slate-900 dark:text-white">{studentName}</div>
														<div className="text-xs text-slate-500 dark:text-slate-400">{record.student?.studentCode || record.student?.id || "No code"}</div>
													</td>
													<td className="px-4 py-3 text-slate-600 dark:text-slate-300">{record.batch?.name || "Unassigned"}</td>
													<td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{formatCurrency(record.pendingAmount || 0)}</td>
													<td className="px-4 py-3">
														<span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${record.status === "OVERDUE" ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
															{record.status}
														</span>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							) : (
								<div className="p-8 text-center">
									<div className="text-sm font-medium text-slate-900 dark:text-white">No pending fee records</div>
									<div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Everything looks clear for the selected month.</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
				<div className="mb-4 flex items-center justify-between gap-3">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Actions</p>
						<h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Related admin tasks</h2>
					</div>
				</div>
				<QuickActions />
			</section>
		</div>
	);
}


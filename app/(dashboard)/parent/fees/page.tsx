"use client";

import ParentSectionPage from "@/components/parent/dashboard/ParentSectionPage";

export default function Page() {
	return (
		<ParentSectionPage
			title="Fees & Payments"
			subtitle="Review outstanding and paid fee records for your children."
			endpoint="/api/parent/fees"
			itemsKey="records"
			renderItem={(item: any) => (
				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
					<div className="font-semibold text-slate-900 dark:text-white">
						{item.student?.firstName} {item.student?.lastName}
					</div>
					<div className="mt-1 text-sm text-slate-500">
						{item.batch?.name} • {item.month}/{item.year}
					</div>
					<div className="mt-3 text-sm text-slate-600 dark:text-slate-300">Status: {item.status}</div>
				</div>
			)}
		/>
	);
}


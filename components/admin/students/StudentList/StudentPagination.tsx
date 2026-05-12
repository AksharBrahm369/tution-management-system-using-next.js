import React from "react";

interface StudentPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const StudentPagination: React.FC<StudentPaginationProps> = ({ page, totalPages, total, pageSize, onPageChange }) => {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => Math.max(1, page - 2) + index).filter((value) => value <= totalPages);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-600 dark:text-slate-300">Showing {start} to {end} of {total} students</p>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700">Previous</button>
        {pages.map((pageNumber) => (
          <button key={pageNumber} type="button" onClick={() => onPageChange(pageNumber)} className={`rounded-xl px-3 py-2 text-sm ${pageNumber === page ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"}`}>
            {pageNumber}
          </button>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700">Next</button>
      </div>
    </div>
  );
};

export default StudentPagination;

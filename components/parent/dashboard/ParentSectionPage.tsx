"use client";

import React, { useEffect, useState } from "react";

interface ParentSectionPageProps<T> {
  title: string;
  subtitle: string;
  endpoint: string;
  itemsKey: string;
  renderItem: (item: T) => React.ReactNode;
}

export default function ParentSectionPage<T>({ title, subtitle, endpoint, itemsKey, renderItem }: ParentSectionPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(endpoint, { credentials: "same-origin" });
        const data = await response.json();
        setItems((data?.[itemsKey] ?? []) as T[]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [endpoint, itemsKey]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">Loading...</div>
      ) : items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">{items.map((item, index) => <div key={index}>{renderItem(item)}</div>)}</div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">No data available.</div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <div className="pt-2 flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">{items.map((item, index) => <div key={index}>{renderItem(item)}</div>)}</div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">No data available.</div>
      )}
    </div>
  );
}

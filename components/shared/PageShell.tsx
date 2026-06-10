"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
  noPadding,
}: PageShellProps) {
  return (
    <div className={cn("page-enter space-y-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 animate-fade-up">
          <h1 className="text-xl font-semibold tracking-normal text-slate-900 dark:text-white md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 animate-scale-in">{actions}</div>
        )}
      </div>
      <div className={cn(!noPadding && "space-y-5")}>{children}</div>
    </div>
  );
}

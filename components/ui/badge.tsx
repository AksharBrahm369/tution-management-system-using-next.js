import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variant === "default" &&
          "bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-sm",
        variant === "secondary" &&
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        variant === "success" &&
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
        variant === "warning" &&
          "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
        variant === "destructive" &&
          "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
        variant === "outline" &&
          "border border-slate-200 bg-transparent text-slate-600 dark:border-slate-700 dark:text-slate-300",
        className
      )}
      {...props}
    />
  );
}

export { Badge };

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
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-normal transition-colors",
        variant === "default" &&
          "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
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

import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentPropsWithoutRef<"table">) {
  return <table className={cn("min-w-full border-collapse", className)} {...props} />;
}

export function TableHeader(props: React.ComponentPropsWithoutRef<"thead">) {
  return <thead {...props} />;
}

export function TableBody(props: React.ComponentPropsWithoutRef<"tbody">) {
  return <tbody className="divide-y divide-slate-100 dark:divide-slate-800" {...props} />;
}

export function TableRow({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cn(
        "transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/70",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.02em] text-slate-500 dark:text-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"td">) {
  return (
    <td
      className={cn("px-4 py-3 text-sm text-slate-700 dark:text-slate-200", className)}
      {...props}
    />
  );
}

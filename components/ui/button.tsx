import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  isLoading?: boolean;
};

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-tight",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        variant === "default" &&
          "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-500/30 dark:from-indigo-500 dark:to-violet-500",
        variant === "secondary" &&
          "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        variant === "outline" &&
          "border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/40",
        variant === "ghost" &&
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
        variant === "destructive" &&
          "bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600",
        size === "sm" && "h-9 px-3.5 text-xs",
        size === "default" && "h-10 px-4 py-2",
        size === "lg" && "h-11 px-6 text-base",
        size === "icon" && "h-10 w-10",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading…
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button };

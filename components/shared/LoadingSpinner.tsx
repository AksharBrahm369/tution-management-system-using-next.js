/**
 * TuitionPro - Loading Spinner Component
 */

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function LoadingSpinner({
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} role="status">
      <div
        className={cn(
          "animate-spin rounded-full border-current border-t-transparent",
          sizeMap[size]
        )}
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm font-medium text-current">{label}</span>
      )}
      <span className="sr-only">{label ?? "Loading..."}</span>
    </div>
  );
}

export default LoadingSpinner;

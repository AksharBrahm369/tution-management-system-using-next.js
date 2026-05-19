import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={["w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950", className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

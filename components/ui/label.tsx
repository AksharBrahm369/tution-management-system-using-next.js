import * as React from "react";

export function Label({ className, ...props }: React.ComponentPropsWithoutRef<"label">) {
  return <label className={["text-sm font-medium", className].filter(Boolean).join(" ")} {...props} />;
}

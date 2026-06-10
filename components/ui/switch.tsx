import * as React from "react";

type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  onCheckedChange?: (next: boolean) => void;
};

export function Switch({ checked, onCheckedChange, ...props }: SwitchProps) {
  return <input {...props} type="checkbox" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />;
}

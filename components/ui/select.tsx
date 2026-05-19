import * as React from "react";

type SelectContextType = {
  value: string;
  onValueChange?: (value: string) => void;
};

const SelectContext = React.createContext<SelectContextType>({ value: "" });

export function Select({ value = "", onValueChange, children }: { value?: string; onValueChange?: (value: string) => void; children: React.ReactNode }) {
  return <SelectContext.Provider value={{ value, onValueChange }}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext);
  return <span>{value || placeholder || "Select"}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="mt-1">{children}</div>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext);
  return (
    <button
      type="button"
      className={`mr-2 mt-2 rounded border px-2 py-1 text-xs ${ctx.value === value ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900"}`}
      onClick={() => ctx.onValueChange?.(value)}
    >
      {children}
    </button>
  );
}

import * as React from "react";

type TabsContextType = {
  value: string;
  onValueChange?: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextType>({ value: "" });

export function Tabs({ value, onValueChange, children }: { value: string; onValueChange?: (value: string) => void; children: React.ReactNode }) {
  return <TabsContext.Provider value={{ value, onValueChange }}>{children}</TabsContext.Provider>;
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={["flex flex-wrap gap-2", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange?.(value)}
      className={["rounded-md px-3 py-1.5 text-sm", active ? "bg-blue-600 text-white" : "border", className].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div>{children}</div>;
}

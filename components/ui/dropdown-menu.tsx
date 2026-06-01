import * as React from "react";

const MenuContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void }>({ open: false, setOpen: () => {} });

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <MenuContext.Provider value={{ open, setOpen }}><div className="relative inline-block">{children}</div></MenuContext.Provider>;
}

export function DropdownMenuTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement<any> }) {
  const { open, setOpen } = React.useContext(MenuContext);
  return React.cloneElement(children, {
    onClick: () => setOpen(!open),
  });
}

export function DropdownMenuContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open } = React.useContext(MenuContext);
  if (!open) return null;
  return <div className={["absolute right-0 z-20 mt-2 min-w-40 rounded-md border bg-white p-1 shadow dark:bg-slate-900", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function DropdownMenuItem({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClick}>
      {children}
    </button>
  );
}

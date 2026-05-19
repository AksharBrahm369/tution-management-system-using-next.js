import * as React from "react";

export function Table({ className, ...props }: React.ComponentPropsWithoutRef<"table">) {
  return <table className={["min-w-full", className].filter(Boolean).join(" ")} {...props} />;
}

export function TableHeader(props: React.ComponentPropsWithoutRef<"thead">) {
  return <thead {...props} />;
}

export function TableBody(props: React.ComponentPropsWithoutRef<"tbody">) {
  return <tbody {...props} />;
}

export function TableRow(props: React.ComponentPropsWithoutRef<"tr">) {
  return <tr {...props} />;
}

export function TableHead(props: React.ComponentPropsWithoutRef<"th">) {
  return <th {...props} />;
}

export function TableCell(props: React.ComponentPropsWithoutRef<"td">) {
  return <td {...props} />;
}

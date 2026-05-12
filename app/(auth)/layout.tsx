import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | TuitionPro",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import ParentLayout from "@/components/parent/layout/ParentLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ParentLayout>{children}</ParentLayout>;
}

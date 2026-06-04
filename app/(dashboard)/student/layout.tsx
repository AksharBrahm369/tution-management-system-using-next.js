import StudentLayout from "@/components/student/layout/StudentLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StudentLayout>{children}</StudentLayout>;
}

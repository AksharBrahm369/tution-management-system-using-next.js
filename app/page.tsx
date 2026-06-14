import { redirect } from "next/navigation";
import LoginPage, { metadata } from "./(auth)/login/page";
import { getCurrentSession, getRoleDashboardPath } from "@/lib/auth";

export const dynamic = "force-dynamic";
export { metadata };

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    redirect(getRoleDashboardPath(session.role));
  }

  return <LoginPage />;
}

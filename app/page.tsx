/**
 * TuitionPro - Home Page
 * Redirects to /auth/login (or dashboard if authenticated).
 * Middleware handles the authenticated redirect automatically.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function HomePage() {
  redirect("/auth/login");
}

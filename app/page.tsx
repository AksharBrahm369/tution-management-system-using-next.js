/**
 * TuitionPro - Home Page
 * Redirects to /login (or dashboard if authenticated).
 * Middleware handles the authenticated redirect automatically.
 */

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/shared/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  BookOpen,
  Users,
  BarChart3,
  GraduationCap,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your TuitionPro account to manage your tuition center.",
};

// ─── Feature List ─────────────────────────────────────────────────────────────

const features = [
  {
    icon: BookOpen,
    title: "Smart Class Management",
    description: "Organize classes, schedules, and curricula effortlessly",
  },
  {
    icon: Users,
    title: "Multi-Role Access",
    description: "Tailored dashboards for admins, teachers, students & parents",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track performance, attendance, and fee collection instantly",
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel ─────────────────────────────────────────────────────── */}
      <div className="auth-gradient relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[45%]">
        {/* Decorative blobs */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute bottom-32 right-8 h-40 w-40 rounded-full bg-blue-400/20" />

        {/* Logo */}
        <div className="relative z-10 animate-fade-in">
          <Logo variant="light" size="lg" href="/" />
        </div>

        {/* Hero Text */}
        <div className="relative z-10 animate-slide-left space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
            Trusted by 500+ Tuition Centers
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Manage Your Tuition
              <span className="block text-blue-200">Smarter</span>
            </h1>
            <p className="max-w-sm text-base text-blue-100/90">
              The all-in-one platform to streamline classes, track progress, and
              grow your tuition business with confidence.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="stagger-children space-y-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="glass-card animate-fade-in flex items-start gap-3.5 rounded-xl p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <Icon className="h-4.5 w-4.5 text-white" size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-blue-100/80">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-blue-200/70">
          <GraduationCap className="h-4 w-4" />
          <span>© {new Date().getFullYear()} TuitionPro. All rights reserved.</span>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md animate-slide-right">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>

          {/* Header */}
          <div className="mb-8 space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

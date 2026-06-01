import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/shared/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { BookOpen, Users, BarChart3, GraduationCap, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your TuitionPro account to manage your tuition center.",
};

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

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="auth-gradient relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[46%]">
        <div className="blob left-1/4 top-0 h-64 w-64 bg-white/20" />
        <div className="blob bottom-0 right-0 h-80 w-80 bg-cyan-400/25" style={{ animationDelay: "-4s" }} />
        <div className="blob bottom-1/3 right-1/4 h-48 w-48 bg-violet-400/20" style={{ animationDelay: "-8s" }} />

        <div className="relative z-10 animate-fade-in">
          <Logo variant="light" size="lg" href="/" />
        </div>

        <div className="relative z-10 animate-slide-left space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
            Trusted by 500+ Tuition Centers
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-[2.75rem]">
              Manage Your Tuition
              <span className="mt-1 block bg-linear-to-r from-cyan-200 to-violet-200 bg-clip-text text-transparent">
                Smarter & Faster
              </span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-indigo-100/90">
              The all-in-one platform to streamline classes, track progress, and grow your
              tuition business with confidence.
            </p>
          </div>

          <div className="stagger-children space-y-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="glass-card animate-fade-up flex items-start gap-4 rounded-2xl p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
                  <Icon className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-indigo-100/75">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-indigo-200/70">
          <GraduationCap className="h-4 w-4" />
          <span>© {new Date().getFullYear()} TuitionPro. All rights reserved.</span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-white to-indigo-50/40 px-6 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
        <div className="blob -right-20 top-20 h-64 w-64 bg-indigo-300/20 dark:bg-indigo-600/10" />

        <div className="relative z-10 w-full max-w-md animate-slide-right">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>

          <div className="tp-card animate-scale-in rounded-3xl border-slate-200/80 p-8 shadow-xl dark:border-slate-800">
            <div className="mb-8 space-y-2 text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sign in to continue to your dashboard
              </p>
            </div>

            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

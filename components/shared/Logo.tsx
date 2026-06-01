import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { icon: 20, text: "text-lg", box: "h-9 w-9 rounded-xl" },
  md: { icon: 24, text: "text-xl", box: "h-10 w-10 rounded-xl" },
  lg: { icon: 32, text: "text-2xl", box: "h-12 w-12 rounded-2xl" },
};

export function Logo({
  variant = "dark",
  size = "md",
  href = "/",
  className,
}: LogoProps) {
  const { icon, text, box } = sizeMap[size];
  const isLight = variant === "light";

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-linear-to-br from-indigo-500 via-violet-500 to-cyan-500 shadow-lg shadow-indigo-500/30",
          box,
          isLight && "ring-2 ring-white/30"
        )}
      >
        <GraduationCap size={icon} className="text-white" />
      </div>
      <span
        className={cn(
          "font-bold tracking-tight",
          text,
          isLight ? "text-white" : "text-slate-900 dark:text-white"
        )}
      >
        Tuition
        <span className={isLight ? "text-cyan-200" : "text-gradient"}>Pro</span>
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;

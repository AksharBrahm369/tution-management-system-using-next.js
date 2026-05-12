/**
 * TuitionPro - Logo Component
 */

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
  sm: { icon: 20, text: "text-lg" },
  md: { icon: 24, text: "text-xl" },
  lg: { icon: 32, text: "text-2xl" },
};

export function Logo({
  variant = "dark",
  size = "md",
  href = "/",
  className,
}: LogoProps) {
  const { icon, text } = sizeMap[size];
  const isLight = variant === "light";

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl p-1.5",
          isLight ? "bg-white/20" : "bg-blue-600"
        )}
      >
        <GraduationCap
          size={icon}
          className={isLight ? "text-white" : "text-white"}
        />
      </div>
      <span
        className={cn(
          "font-bold tracking-tight",
          text,
          isLight ? "text-white" : "text-slate-900"
        )}
      >
        Tuition<span className={isLight ? "text-blue-200" : "text-blue-600"}>Pro</span>
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;

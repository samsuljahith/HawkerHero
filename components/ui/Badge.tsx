import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "info" | "warning" | "accent";
  className?: string;
}

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-[#FAF8F5] text-[#6B6B6B] border-[#ECE6DF]",
    success: "bg-emerald-50 text-[#0FA968] border-emerald-200",
    info: "bg-blue-50 text-[#2563EB] border-blue-200",
    warning: "bg-amber-50 text-[#E0A800] border-amber-200",
    accent: "bg-orange-50 text-[#F2541B] border-orange-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export default function Card({ children, className = "", padding = "md" }: CardProps) {
  const pad = { sm: "p-4", md: "p-6", lg: "p-8" }[padding];
  return (
    <div
      className={`bg-white rounded-[14px] border border-[#ECE6DF] shadow-[0_1px_3px_rgba(0,0,0,.06),0_8px_24px_rgba(0,0,0,.04)] ${pad} ${className}`}
    >
      {children}
    </div>
  );
}

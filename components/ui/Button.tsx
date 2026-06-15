import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-[10px] transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#F2541B] hover:bg-[#D8430E] text-white shadow-sm",
    secondary: "bg-white border border-[#ECE6DF] text-[#1A1410] hover:bg-[#FAF8F5]",
    ghost: "text-[#6B6B6B] hover:text-[#1A1410] hover:bg-[#FAF8F5]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

import * as React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export default function Button({
  className,
  size = "md",
  variant = "default",
  children,
  ...props
}: ButtonProps) {
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const variants = {
    default: "bg-accent-blue text-white hover:brightness-95",
    outline:
      "border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm",
    ghost: "text-white hover:bg-white/10",
  };

  return (
    <button
      className={clsx(
        "rounded-md font-medium transition duration-150 flex items-center justify-center min-w-[90px]",
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

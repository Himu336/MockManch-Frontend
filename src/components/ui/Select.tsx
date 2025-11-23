import * as React from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export default function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={clsx(
          "w-full bg-[#141416] border border-white/10 rounded-md px-4 py-2 pr-10",
          "text-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]",
          "transition appearance-none cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
    </div>
  );
}


import * as React from "react";
import clsx from "clsx";

export default function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full bg-[#141416] border border-white/10 rounded-md px-4 py-2",
        "placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light",
        "transition",
        className
      )}
      {...props}
    />
  );
}

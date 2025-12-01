import * as React from "react";
import clsx from "clsx";

export default function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full bg-[#141416] border border-white/10 rounded-md px-4 py-2",
        "placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-light",
        "transition resize-none",
        className
      )}
      {...props}
    />
  );
}


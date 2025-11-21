import * as React from "react";
import clsx from "clsx";

export default function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "card-bg rounded-xl p-6 shadow-soft",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

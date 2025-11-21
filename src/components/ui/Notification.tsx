// src/components/ui/Notification.tsx
import React from "react";
export default function Notification({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "error" | "success" }) {
  const color =
    type === "error" ? "bg-red-600 text-white" : type === "success" ? "bg-green-600 text-white" : "bg-white/5 text-white";
  return (
    <div className={`px-4 py-2 rounded-md ${color}`}>
      {children}
    </div>
  );
}

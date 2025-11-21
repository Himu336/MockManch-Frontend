import "../styles/globals.css";
import React from "react";

export const metadata = {
  title: "MockManch Dashboard",
  description: "Professional AI Interview Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}

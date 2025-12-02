import "../styles/globals.css";
import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MockManch Dashboard",
  description: "Professional AI Interview Platform",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/logo-apple-touch.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/logo-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/logo-apple-touch.png" />
      </head>
      <body className="bg-bg text-white antialiased">
        <AuthProvider>
          <WalletProvider>{children}</WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  FileText,
  Video,
  Users,
  Calendar,
  BarChart2,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import React from "react";

const navItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "AI Coach", icon: MessageSquare, href: "/ai-coach" },
  { label: "Text Interview", icon: FileText, href: "/text-interview" },
  { label: "Voice Interview", icon: Video, href: "/voice-interview" },
  { label: "Group Practice", icon: Users, href: "/group-practice" },
  { label: "Schedule", icon: Calendar, href: "/schedule" },
  { label: "Analytics", icon: BarChart2, href: "/analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/5">
        <div className="text-lg font-semibold">MockManch</div>
        <div className="text-sm text-white/50">AI Interview Platform</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link href={item.href} key={item.href}>
              <div
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition cursor-pointer",
                  active
                    ? "bg-accent-blue text-white"
                    : "text-white/70 hover:bg-white/5"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-blue font-semibold">
            HB
          </div>
          <div>
            <div className="font-medium text-sm">Himansh Bansal</div>
            <div className="text-xs text-white/50">himansh@example.com</div>
          </div>

          <Settings className="ml-auto w-4 h-4 text-white/50" />
        </div>

        {/* Streak */}
        <div className="mt-4">
          <div className="bg-[#462b00] text-[#ffd8b5] px-3 py-1 rounded-lg text-xs w-fit">
            🔥 7 day streak!
          </div>
        </div>
      </div>
    </div>
  );
}

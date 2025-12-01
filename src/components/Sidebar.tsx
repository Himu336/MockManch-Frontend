"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  MessageSquare,
  FileText,
  Video,
  Users,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import React, { memo, useState } from "react";
import UserMenu from "./auth/UserMenu";

const navItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "AI Coach", icon: MessageSquare, href: "/ai-coach" },
  { label: "Text Interview", icon: FileText, href: "/text-interview" },
  { label: "Voice Interview", icon: Video, href: "/voice-interview" },
  { label: "Group Practice", icon: Users, href: "/group-practice" },
  { label: "Analytics", icon: BarChart2, href: "/analytics" },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = memo(function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="flex flex-col h-full relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={clsx(
          "absolute top-4 z-10",
          "w-8 h-8 rounded-lg",
          "flex items-center justify-center",
          "bg-white/5 hover:bg-white/10",
          "border border-white/10",
          "text-white/70 hover:text-white",
          "transition-all duration-200",
          "shadow-lg",
          isCollapsed ? "right-2" : "right-4"
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Logo Section */}
      <div
        className={clsx(
          "p-6 border-b border-white/5 transition-all duration-300",
          isCollapsed && "px-3 py-6"
        )}
      >
        {!isCollapsed ? (
          <div className="flex items-center gap-4">
            {!logoError ? (
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="MockManch Logo"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-primary-ui/20 rounded-lg">
                <span className="text-primary-soft font-bold text-2xl">M</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-lg font-semibold">MockManch</div>
              <div className="text-sm text-white/50">AI Interview Platform</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            {!logoError ? (
              <div className="relative w-16 h-16">
                <Image
                  src="/logo.png"
                  alt="MockManch"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="text-2xl font-semibold text-center">M</div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          const isHovered = hoveredItem === item.href;

          return (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link href={item.href}>
                <div
                  className={clsx(
                    "flex items-center gap-3 rounded-lg transition-all duration-200 cursor-pointer",
                    "group",
                    isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                    active
                      ? "bg-primary-ui text-white shadow-[0_0_25px_rgba(91,33,182,0.35)]"
                      : "text-white/70 hover:bg-primary-soft/5"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={clsx(
                      "text-sm font-medium transition-all duration-300 whitespace-nowrap",
                      isCollapsed
                        ? "opacity-0 w-0 overflow-hidden"
                        : "opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>

              {/* Tooltip for collapsed state */}
              {isCollapsed && isHovered && (
                <div
                  className={clsx(
                    "absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50",
                    "px-3 py-2 rounded-lg",
                    "bg-[#1a1a1c]/95 border border-white/10",
                    "backdrop-blur-xl shadow-2xl shadow-black/50",
                    "text-sm text-white whitespace-nowrap",
                    "animate-fade-in-scale"
                  )}
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className={clsx("p-4 border-t border-white/5", isCollapsed && "px-2")}>
        <UserMenu isCollapsed={isCollapsed} />
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;

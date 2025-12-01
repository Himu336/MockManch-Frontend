"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import {
  User,
  CreditCard,
  LogOut,
  ChevronUp,
  Coins,
  Loader2,
  HelpCircle,
} from "lucide-react";
import clsx from "clsx";

interface UserMenuProps {
  isCollapsed?: boolean;
}

// Generate gradient colors based on initials
const generateGradient = (initials: string): string => {
  const colors = [
    "from-blue-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-pink-500 to-red-600",
    "from-orange-500 to-yellow-600",
    "from-green-500 to-teal-600",
    "from-teal-500 to-cyan-600",
    "from-indigo-500 to-blue-600",
    "from-violet-500 to-purple-600",
  ];
  
  const hash = initials.split("").reduce((acc: number, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colors.length;
  return colors[colorIndex]!;
};

const getUserInitials = (fullName?: string, email?: string): string => {
  if (fullName) {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email && email[0]) {
    return email[0].toUpperCase();
  }
  return "U";
};

export default function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const { balance, loading: walletLoading } = useWallet();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const initials = getUserInitials(user?.fullName, user?.email);
  const gradient = generateGradient(initials);

  // Get display name with fallback logic
  const getDisplayName = (): string => {
    if (user?.fullName) return user.fullName;
  if (user?.email) {
    // Use email prefix (part before @) as fallback
    const emailPrefix = user.email.split("@")[0] ?? "";
    if (!emailPrefix) return "User";
    // Capitalize first letter
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }
    return "User";
  };

  const displayName = getDisplayName();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const menuItems = [
    {
      icon: User,
      label: "View Profile",
      href: "/profile",
      onClick: () => setIsOpen(false),
    },
    {
      icon: CreditCard,
      label: "Billing & Subscriptions",
      href: "/billing",
      onClick: () => setIsOpen(false),
    },
    {
      icon: HelpCircle,
      label: "Support & Contact",
      href: "/support",
      onClick: () => setIsOpen(false),
    },
  ];

  return (
    <div className="relative">
      {/* User Card Button */}
      <button
        ref={buttonRef}
        onClick={() => !isCollapsed && setIsOpen(!isOpen)}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
        className={clsx(
          "w-full flex items-center rounded-xl",
          "transition-all duration-200",
          "hover:bg-white/5 active:bg-white/10",
          "group",
          isCollapsed
            ? "justify-center px-2 py-2"
            : "gap-3 px-3 py-2.5"
        )}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0 group-hover-avatar">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName || "User"}
              className={clsx(
                "rounded-full object-cover transition-transform duration-200",
                isCollapsed ? "w-10 h-10" : "w-10 h-10"
              )}
            />
          ) : (
            <div
              className={clsx(
                "rounded-full bg-gradient-to-br",
                gradient,
                "flex items-center justify-center text-white font-semibold",
                "transition-transform duration-200",
                "shadow-lg",
                isCollapsed ? "w-10 h-10 text-sm" : "w-10 h-10 text-sm"
              )}
            >
              {initials}
            </div>
          )}
        </div>

        {/* User Info - Only visible when expanded */}
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-sm text-white truncate">
                {displayName}
              </div>
              <div className="text-xs text-neutral-400 truncate">
                {user?.email || ""}
              </div>
              {/* Token Balance */}
              <div className="flex items-center gap-1.5 mt-1">
                {walletLoading ? (
                  <Loader2 className="w-3 h-3 text-primary-soft animate-spin" />
                ) : (
                  <>
                    <Coins className="w-3 h-3 text-primary-soft" />
                    <span className="text-xs font-medium text-primary-soft">
                      {balance} tokens
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Chevron Icon */}
            <ChevronUp
              className={clsx(
                "w-4 h-4 text-white/40 transition-transform duration-200 flex-shrink-0",
                isOpen ? "rotate-180" : ""
              )}
            />
          </>
        )}
      </button>

      {/* Hover Tooltip for collapsed state */}
      {isCollapsed && isHovered && (
        <div
          className={clsx(
            "absolute left-full top-0 ml-2 z-50",
            "px-3 py-2 rounded-lg",
            "bg-[#1a1a1c]/95 border border-white/10",
            "backdrop-blur-xl shadow-2xl shadow-black/50",
            "text-sm text-white",
            "animate-fade-in-scale",
            "min-w-[220px]"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* User Info in Tooltip */}
          <div className="pb-2 mb-2 border-b border-white/10">
            <div className="font-semibold text-sm text-white">
              {displayName}
            </div>
            <div className="text-xs text-neutral-400 truncate">
              {user?.email || ""}
            </div>
            {/* Token Balance */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {walletLoading ? (
                <Loader2 className="w-3 h-3 text-primary-soft animate-spin" />
              ) : (
                <>
                  <Coins className="w-3 h-3 text-primary-soft" />
                  <span className="text-xs font-medium text-primary-soft">
                    {balance} tokens
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Menu Items in Tooltip */}
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
                onClick={() => {
                  setIsHovered(false);
                  item.onClick();
                }}
                className={clsx(
                  "flex items-center gap-3 px-2 py-2 rounded-lg",
                  "text-sm text-white/90",
                  "transition-colors duration-150",
                  "hover:bg-white/5 active:bg-white/10"
                )}
              >
                <Icon className="w-4 h-4 text-white/60" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="h-px bg-white/10 my-1" />

          {/* Sign Out */}
          <button
            onClick={() => {
              setIsHovered(false);
              handleSignOut();
            }}
            className={clsx(
              "w-full flex items-center gap-3 px-2 py-2 rounded-lg",
              "text-sm text-red-400",
              "transition-colors duration-150",
              "hover:bg-red-500/10 active:bg-red-500/20"
            )}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Dropdown Menu - Only shown when expanded */}
      {!isCollapsed && isOpen && (
        <div
          ref={menuRef}
          className={clsx(
            "absolute bottom-full left-0 right-0 mb-2",
            "bg-[#1a1a1c]/95 border border-white/10 rounded-xl",
            "backdrop-blur-xl",
            "shadow-2xl shadow-black/50",
            "py-1.5",
            "z-50",
            "animate-fade-in-scale",
            "min-w-[200px]"
          )}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isFirst = index === 0;
            return (
              <Link
                key={index}
                href={item.href}
                onClick={item.onClick}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5",
                  "text-sm text-white/90",
                  "transition-colors duration-150",
                  "hover:bg-white/5 active:bg-white/10",
                  isFirst && "rounded-t-xl"
                )}
              >
                <Icon className="w-4 h-4 text-white/60" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="h-px bg-white/10 my-1" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-2.5",
              "text-sm text-red-400",
              "transition-colors duration-150",
              "hover:bg-red-500/10 active:bg-red-500/20",
              "rounded-b-xl"
            )}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

    </div>
  );
}


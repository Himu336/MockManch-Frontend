"use client";

import React, { memo, useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

const DashboardLayoutContent = memo(function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage and handle responsive behavior
  useEffect(() => {
    setIsMounted(true);
    
    // Check if screen is below 1024px - auto-collapse on mobile/tablet
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
        return;
      }
      
      // Otherwise, load from localStorage
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    };

    checkScreenSize();
    
    // Listen for window resize
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Save to localStorage when state changes (but not on initial mount)
  useEffect(() => {
    if (isMounted && window.innerWidth >= 1024) {
      localStorage.setItem("sidebarCollapsed", String(isSidebarCollapsed));
    }
  }, [isSidebarCollapsed, isMounted]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      <aside
        className={`
          bg-[#111214] border-r border-white/5 h-full
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "w-20" : "w-72"}
        `}
      >
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar}
        />
      </aside>

      <main className="flex-1 h-full p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
});

DashboardLayoutContent.displayName = "DashboardLayoutContent";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ProtectedRoute>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderHeart,
  FileCheck,
  Receipt,
  UserCheck,
  LogOut,
  Menu,
  X,
  Bell,
  Printer,
  ChevronRight,
} from "lucide-react";

interface CustomerShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/designs", label: "Saved Designs", icon: FolderHeart },
  { href: "/dashboard/proofs", label: "Proofs", icon: FileCheck },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/profile", label: "Profile & Settings", icon: UserCheck },
];

export function CustomerShell({ children, title, subtitle, actions }: CustomerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center text-sm text-ink-muted">
        Loading customer portal...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (typeof window !== "undefined") {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col md:flex-row">
      {/* Desktop Sidebar: Deep Purple (#291747) per FRONTEND.md §4.2 */}
      <aside className="hidden md:flex flex-col w-64 bg-deep text-lavender shrink-0 border-r border-deep/60">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-btn bg-promo-gradient flex items-center justify-center shadow-soft">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white">
              Digi<span className="text-violet">Vio</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-btn text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-primary text-white shadow-soft"
                    : "text-lavender/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {isCurrent && (
                  <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#34D399]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-soft">
              {user.full_name ? user.full_name[0].toUpperCase() : "C"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.full_name || "Customer"}</p>
              <p className="text-[10px] text-lavender/60 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-btn text-xs text-lavender/80 hover:text-white hover:bg-white/5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-surface-card border-b border-line px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-soft">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-btn text-ink hover:bg-lavender-light"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading font-bold text-lg sm:text-xl text-plum leading-snug">
                {title}
              </h1>
              {subtitle && <p className="text-xs text-ink-muted hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actions}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Back to Store <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-plum/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-64 bg-deep text-lavender p-6 shadow-lift flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="font-heading font-extrabold text-xl text-white">
                  Digi<span className="text-violet">Vio</span>
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-btn text-lavender hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isCurrent =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-btn text-xs font-semibold ${
                        isCurrent
                          ? "bg-primary text-white"
                          : "text-lavender/80 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-lavender/80 hover:text-white py-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

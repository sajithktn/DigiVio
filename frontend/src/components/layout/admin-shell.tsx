"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  Users,
  Package,
  FileCode,
  Image as ImageIcon,
  BarChart3,
  Archive,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  Printer,
  ShieldCheck,
} from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders Pipeline", icon: FolderKanban },
  { href: "/admin/products", label: "Catalogue CRUD", icon: Package },
  { href: "/admin/templates", label: "Templates & Areas", icon: FileCode },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/gallery", label: "Gallery Manager", icon: ImageIcon },
  { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/admin/archive", label: "Completed Archive", icon: Archive },
  { href: "/admin/accounting", label: "Xero Export", icon: FileSpreadsheet },
];

export function AdminShell({ children, title, subtitle, actions }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center text-sm text-ink-muted">
        Verifying administrator role...
      </div>
    );
  }

  // Role Protection per FRONTEND.md §9.12
  if (!isAuthenticated || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mb-4 shadow-soft">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-plum mb-2">
          403 Forbidden Access
        </h2>
        <p className="text-xs text-ink-muted max-w-sm mb-6">
          This portal is reserved strictly for DigiVio production staff and system administrators.
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-btn bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-soft"
        >
          Return to Customer Hub
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col md:flex-row">
      {/* Plum (#1E1530) Sidebar per FRONTEND.md §4.3 */}
      <aside className="hidden md:flex flex-col w-64 bg-plum text-lavender shrink-0 border-r border-plum">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-btn bg-primary text-white flex items-center justify-center shadow-soft">
              <Printer className="w-5 h-5" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white">
              Digi<span className="text-violet">Admin</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

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

        {/* Staff Card & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-violet text-white flex items-center justify-center font-bold text-xs shadow-soft">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.full_name || "Admin Staff"}</p>
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

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Admin Pill */}
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
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-lg sm:text-xl text-plum leading-snug">
                  {title}
                </h1>
                <span className="px-2 py-0.5 rounded-pill bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                  Staff Role
                </span>
              </div>
              {subtitle && <p className="text-xs text-ink-muted hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actions}
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-ink-muted hover:text-primary transition"
            >
              Customer View
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-plum/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-64 bg-plum text-lavender p-6 shadow-lift flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="font-heading font-extrabold text-xl text-white">
                  Digi<span className="text-violet">Admin</span>
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-btn text-lavender hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isCurrent =
                    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

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

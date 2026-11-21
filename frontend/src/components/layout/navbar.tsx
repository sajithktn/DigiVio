"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { DIVISIONS } from "@/lib/divisions";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  FileCheck,
  FolderHeart,
  Tag,
  Award,
  Layers,
  Bike,
  Stamp,
  Sparkles,
  ArrowRight,
  LogOut,
  Receipt,
  UserCheck,
} from "lucide-react";

export { DIVISIONS };

const DIVISION_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    sub: string;
  }
> = {
  "labels-stickers": {
    icon: Tag,
    sub: "Contour-cut waterproof vinyl",
  },
  "race-event-numbers": {
    icon: Award,
    sub: "Tyvek bibs with CSV variable data",
  },
  "mtb-boards": {
    icon: Bike,
    sub: "Heavy-duty impact plates",
  },
  stamps: {
    icon: Stamp,
    sub: "Self-inking business stamps",
  },
  trophies: {
    icon: Sparkles,
    sub: "Reverse UV print on cast acrylic",
  },
  "laser-cut-work": {
    icon: Layers,
    sub: "Custom CNC timber & acrylic",
  },
};

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const megaMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Detect scroll elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProductsOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* 1. Full-Width Navbar Container (#FFFFFF, stretching edge-to-edge with zero side gaps) */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 bg-white border-b border-slate-200/80 ${
          isScrolled
            ? "shadow-[0_4px_20px_-4px_rgba(6,78,59,0.08)] bg-white/95 backdrop-blur-md"
            : "shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 py-3 sm:py-3.5 flex items-center justify-between gap-4">
          {/* 2. Logo and Branding: Left position with Emerald Green icon and dark text */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full shrink-0"
          >
            {/* Reference radial 12-ray burst icon in Emerald Green (#059669) */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-primary group-hover:rotate-45 transition-transform duration-300">
              <svg
                className="w-full h-full"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="2" x2="12" y2="5.5" />
                <line x1="12" y1="18.5" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.4" y2="7.4" />
                <line x1="16.6" y1="16.6" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="5.5" y2="12" />
                <line x1="18.5" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.4" y2="16.6" />
                <line x1="16.6" y1="7.4" x2="19.07" y2="4.93" />
              </svg>
            </div>

            {/* Logo text: dark charcoal/plum (#172B24) */}
            <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-[#172B24]">
              DIGIVIO
            </span>
          </Link>

            {/* 3. Navigation Links: Centered with dark charcoal (#334155) & Emerald hover */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-7">
              {/* Products Dropdown (All Pages equivalent in reference) */}
              <div className="relative" ref={megaMenuRef}>
                <button
                  onClick={() => setProductsOpen((prev) => !prev)}
                  onMouseEnter={() => setProductsOpen(true)}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                    pathname.startsWith("/products") || productsOpen
                      ? "text-primary font-semibold"
                      : "text-[#334155] hover:text-primary"
                  }`}
                  aria-expanded={productsOpen}
                  aria-haspopup="true"
                >
                  <span>Products</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      productsOpen ? "rotate-180 text-primary" : "text-[#64748B]"
                    }`}
                  />
                </button>

                {/* Dropdown Card */}
                {productsOpen && (
                  <div
                    onMouseLeave={() => setProductsOpen(false)}
                    className="absolute top-full -left-6 mt-3 w-80 bg-white rounded-2xl border border-line shadow-2xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150 space-y-1"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold text-ink-muted uppercase tracking-wider border-b border-line mb-1">
                      Print Divisions
                    </div>

                    {DIVISIONS.map((div) => {
                      const config = DIVISION_CONFIG[div.slug] || {
                        icon: Sparkles,
                        sub: div.desc,
                      };
                      const Icon = config.icon;
                      const isCurrent = pathname === `/products` && pathname.includes(div.slug);

                      return (
                        <Link
                          key={div.slug}
                          href={`/products?division=${div.slug}`}
                          onClick={() => setProductsOpen(false)}
                          className={`flex items-center gap-3 p-2 rounded-xl transition group ${
                            isCurrent
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-[#F5FAF7] text-[#172B24] hover:text-primary"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-lavender flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-tight truncate">{div.name}</p>
                            <p className="text-[10px] text-ink-muted leading-tight truncate">
                              {config.sub}
                            </p>
                          </div>
                        </Link>
                      );
                    })}

                    <div className="pt-2 mt-1 border-t border-line text-center">
                      <Link
                        href="/products"
                        onClick={() => setProductsOpen(false)}
                        className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>Browse Entire Catalogue</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* How It Works (Features) */}
              <Link
                href="/how-it-works"
                className={`text-sm font-medium transition-colors ${
                  isActive("/how-it-works")
                    ? "text-primary font-semibold"
                    : "text-[#334155] hover:text-primary"
                }`}
              >
                Features
              </Link>

              {/* Pricing */}
              <Link
                href="/pricing"
                className={`text-sm font-medium transition-colors ${
                  isActive("/pricing")
                    ? "text-primary font-semibold"
                    : "text-[#334155] hover:text-primary"
                }`}
              >
                Pricing
              </Link>

              {/* Gallery (Blog / Work) */}
              <Link
                href="/gallery"
                className={`text-sm font-medium transition-colors ${
                  isActive("/gallery")
                    ? "text-primary font-semibold"
                    : "text-[#334155] hover:text-primary"
                }`}
              >
                Gallery
              </Link>

              {/* About / FAQ */}
              <Link
                href="/faq"
                className={`text-sm font-medium transition-colors ${
                  isActive("/faq")
                    ? "text-primary font-semibold"
                    : "text-[#334155] hover:text-primary"
                }`}
              >
                About
              </Link>
            </nav>

            {/* 4. Contact Button & Utilities: Far right */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Shopping Cart Trigger */}
              <Link
                href="/cart"
                aria-label={`Shopping cart with ${itemCount} items`}
                className="relative p-2 rounded-full text-[#334155] hover:text-primary hover:bg-[#F5FAF7] transition active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* User Account / Profile Dropdown (if logged in) */}
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 hover:border-primary/40 transition bg-white"
                    aria-label="User account menu"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center font-bold text-xs">
                      {user.full_name ? user.full_name[0].toUpperCase() : "U"}
                    </div>
                    <ChevronDown className="w-3 h-3 text-[#64748B] mr-1" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-line shadow-2xl p-2 z-50 space-y-1 animate-in fade-in-0 zoom-in-95">
                      <div className="px-3 py-2 rounded-xl bg-surface-bg border border-line/60 mb-1">
                        <p className="text-xs font-bold text-plum truncate">{user.full_name || "Customer"}</p>
                        <p className="text-[10px] text-ink-muted truncate">{user.email}</p>
                      </div>

                      <Link
                        href={user.role === "admin" ? "/admin" : "/dashboard"}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-lavender-light hover:text-primary transition"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        <span>{user.role === "admin" ? "Admin Console" : "Dashboard"}</span>
                      </Link>

                      <Link
                        href="/dashboard/orders"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-lavender-light hover:text-primary transition"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <ShoppingBag className="w-4 h-4 text-primary" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        href="/dashboard/proofs"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-lavender-light hover:text-primary transition"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <FileCheck className="w-4 h-4 text-primary" />
                        <span>Active Proofs</span>
                      </Link>

                      <Link
                        href="/dashboard/designs"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-lavender-light hover:text-primary transition"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <FolderHeart className="w-4 h-4 text-primary" />
                        <span>Saved Designs</span>
                      </Link>

                      <div className="pt-1 mt-1 border-t border-line">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-danger hover:bg-danger/10 transition text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* 4. Contact Us Button: Black background (#111111), white text, fully rounded pill */}
              <Link href="/contact" className="hidden sm:inline-block">
                <button
                  type="button"
                  className="rounded-full bg-[#111111] hover:bg-black text-white text-xs sm:text-sm font-medium px-5 sm:px-6 py-2 sm:py-2.5 transition-all shadow-sm hover:scale-[1.02] active:scale-95"
                >
                  Contact Us
                </button>
              </Link>

              {/* 6. Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile navigation menu"
                className="md:hidden p-2 rounded-full text-[#172B24] hover:bg-[#EAFBEA] border border-slate-200 transition active:scale-95"
              >
                <Menu className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>
            </div>
        </div>
      </header>

      {/* 6. Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Frosted Backdrop */}
          <div
            className="fixed inset-0 bg-[#172B24]/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Slide-Over Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-white shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-line flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="w-6 h-6 text-primary">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="2" x2="12" y2="5.5" />
                    <line x1="12" y1="18.5" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.4" y2="7.4" />
                    <line x1="16.6" y1="16.6" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="5.5" y2="12" />
                    <line x1="18.5" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.4" y2="16.6" />
                    <line x1="16.6" y1="7.4" x2="19.07" y2="4.93" />
                  </svg>
                </div>
                <span className="font-heading font-extrabold text-lg tracking-tight text-[#172B24]">
                  DIGIVIO
                </span>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Links */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Print Divisions Accordion */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider px-2">
                  Products
                </p>
                <div className="space-y-1">
                  {DIVISIONS.map((div) => {
                    const config = DIVISION_CONFIG[div.slug] || { icon: Sparkles, sub: div.desc };
                    const Icon = config.icon;
                    return (
                      <Link
                        key={div.slug}
                        href={`/products?division=${div.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#172B24] hover:bg-[#EAFBEA] hover:text-primary transition"
                      >
                        <Icon className="w-4 h-4 text-primary" />
                        <span>{div.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Main Nav Links */}
              <div className="pt-3 border-t border-line space-y-1">
                <Link
                  href="/how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive("/how-it-works")
                      ? "bg-primary/10 text-primary"
                      : "text-[#334155] hover:bg-[#EAFBEA]"
                  }`}
                >
                  Features
                </Link>

                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive("/pricing")
                      ? "bg-primary/10 text-primary"
                      : "text-[#334155] hover:bg-[#EAFBEA]"
                  }`}
                >
                  Pricing
                </Link>

                <Link
                  href="/gallery"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive("/gallery")
                      ? "bg-primary/10 text-primary"
                      : "text-[#334155] hover:bg-[#EAFBEA]"
                  }`}
                >
                  Gallery
                </Link>

                <Link
                  href="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive("/faq")
                      ? "bg-primary/10 text-primary"
                      : "text-[#334155] hover:bg-[#EAFBEA]"
                  }`}
                >
                  About
                </Link>
              </div>

              {/* Cart Link in Mobile */}
              <div className="pt-3 border-t border-line">
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-[#334155] hover:bg-[#EAFBEA]"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    <span>My Cart</span>
                  </div>
                  {itemCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-line space-y-2.5">
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                <button
                  type="button"
                  className="w-full rounded-full bg-[#111111] hover:bg-black text-white text-sm font-medium py-2.5 transition shadow-sm"
                >
                  Contact Us
                </button>
              </Link>

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-full border border-line text-danger text-xs font-semibold py-2 hover:bg-danger/10 transition"
                >
                  Sign Out
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button
                    type="button"
                    className="w-full rounded-full border border-line text-[#334155] text-xs font-semibold py-2 hover:bg-slate-50 transition"
                  >
                    Sign In
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

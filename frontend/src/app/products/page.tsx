"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar, DIVISIONS } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductCard, ProductSummary } from "@/components/products/product-card";
import { EmptyState, Skeleton } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { Search, Filter, Sparkles, ChevronRight } from "lucide-react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const divisionParam = searchParams.get("division") || "all";

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>(divisionParam);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (divisionParam) {
      setSelectedDivision(divisionParam);
    }
  }, [divisionParam]);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const url =
          selectedDivision && selectedDivision !== "all"
            ? `/api/products?division=${selectedDivision}`
            : "/api/products";
        const data = await api.get(url);
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [selectedDivision]);

  // Client-side filtering & sorting
  const filteredProducts = products.filter((prod) => {
    const matchesDiv =
      selectedDivision === "all" || prod.division_slug === selectedDivision;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiv && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.base_price_minor - b.base_price_minor;
    if (sortBy === "price-high") return b.base_price_minor - a.base_price_minor;
    return 0; // featured/default
  });

  const currentDivInfo = DIVISIONS.find((d) => d.slug === selectedDivision);

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      {/* Page Header on soft-gradient per FRONTEND.md §5.2 */}
      <div className="bg-soft-gradient border-b border-line py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <nav className="flex items-center gap-2 text-xs text-ink-muted">
            <Link href="/" className="hover:text-primary transition">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-plum">Products Catalogue</span>
            {currentDivInfo && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-primary font-bold">{currentDivInfo.name}</span>
              </>
            )}
          </nav>

          <div className="max-w-2xl space-y-2">
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-plum tracking-tight">
              {currentDivInfo ? currentDivInfo.name : "Print Products Catalogue"}
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              {currentDivInfo
                ? currentDivInfo.desc
                : "Explore our complete range of precision print products. Configure dimensions, select factory materials, and review live volume pricing."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Sticky Filter & Sort Bar (§5.2) */}
        <div className="sticky top-18 z-20 bg-surface-card/95 backdrop-blur-md p-4 rounded-card border border-line shadow-soft flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Division Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedDivision("all")}
              className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDivision === "all"
                  ? "bg-primary text-white shadow-soft"
                  : "bg-lavender text-deep hover:bg-lavender-light border border-line"
              }`}
            >
              All Divisions
            </button>
            {DIVISIONS.map((div) => {
              const isSelected = selectedDivision === div.slug;
              return (
                <button
                  key={div.slug}
                  onClick={() => setSelectedDivision(div.slug)}
                  className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? "bg-primary text-white shadow-soft"
                      : "bg-lavender text-deep hover:bg-lavender-light border border-line"
                  }`}
                >
                  {div.name}
                </button>
              );
            })}
          </div>

          {/* Search & Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <div className="relative flex-1 lg:w-60">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-btn border border-line bg-surface-card pl-9 pr-3.5 py-2 text-xs text-ink outline-none hover:border-lavender focus:border-primary focus:shadow-focus"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-btn border border-line bg-surface-card px-3 py-2 text-xs font-semibold text-ink outline-none hover:border-lavender focus:border-primary cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-card border border-line p-4 space-y-4 bg-surface-card"
              >
                <Skeleton className="aspect-[4/3] w-full rounded-btn" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <EmptyState
            title="No products matched your criteria"
            description="Try clearing your search query or switching to another division."
            actionLabel="View All Products"
            onAction={() => {
              setSelectedDivision("all");
              setSearchQuery("");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((prod) => (
              <ProductCard key={prod.id || prod.slug} product={prod} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-bg flex items-center justify-center text-sm text-ink-muted">
          Loading catalogue...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}



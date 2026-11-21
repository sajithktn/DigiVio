import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";

export const metadata: Metadata = {
  title: "DigiVio — Modern Web-to-Print Platform",
  description:
    "Subscription-free, per-order web-to-print platform with 6 print divisions: stickers, race numbers, MTB boards, stamps, trophies, and laser-cut work.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-surface-bg text-ink font-sans antialiased selection:bg-primary/20 selection:text-primary flex flex-col">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

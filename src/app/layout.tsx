import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartDrawer from "@/src/components/cart/CartDrawer";
import Navbar from "@/src/components/layout/Navbar";
import Footer from "@/src/components/layout/Footer";
import { getCategoryTree } from "@/src/services/category.service";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LEGADO HOGAR | Tecnología y Electrodomésticos",
  description: "Tienda online de tecnología, Smart TVs, climatización y línea blanca",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategoryTree();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-gray-900 overflow-x-hidden">
        <Suspense fallback={<div className="h-24 bg-white border-b border-gray-200" />}>
          <Navbar categories={categories} />
        </Suspense>
        <main className="flex-1 w-full overflow-x-clip">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
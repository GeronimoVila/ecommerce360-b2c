import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartDrawer from "@/src/components/cart/CartDrawer"; 
import AttributionHandler from "@/src/components/AttributionHandler";
import Navbar from "@/src/components/layout/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Commerce 360",
  description: "Tienda online y sistema de gestión de ventas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AttributionHandler />
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <CartDrawer />
      </body>
    </html>
  );
}
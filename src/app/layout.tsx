import type { Metadata } from "next";
import { connection } from "next/server";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Camelion",
  description: "Thoughtful goods for daily rituals, selected by Camelion.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <CartProvider>
          <FavoritesProvider>
            <PageTransition>{children}</PageTransition>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}

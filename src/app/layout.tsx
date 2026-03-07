import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import { Bell } from "lucide-react";
import "./globals.css";
import NavBar from "../components/NavBar"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // optional: expose as CSS variable
});

export const metadata: Metadata = {
  title: "BrawlLens",
  description: "Track your progress. Master your picks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavBar/>
        {children}
        <button className="fixed bottom-6 right-6 p-3 bg-white rounded-full shadow-lg border border-black/5 text-gray-500 hover:text-gray-800 hover:shadow-xl transition-all cursor-pointer z-50">
          <Bell size={20} />
        </button>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
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
      </body>
    </html>
  );
}

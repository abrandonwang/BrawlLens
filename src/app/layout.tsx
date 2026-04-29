import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { MenuProvider } from "../context/MenuContext";
import { ThemeProvider } from "../components/ThemeProvider";
import TopLoader from "../components/TopLoader";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "BrawlLens",
  description: "Advanced analytics for competitive players.",
  verification: {
    google: "KgSz5bQ-JYhDUKa1e_JLCMQw24ST6zgO0LQqjhNB7kU",
  },
  icons: {
    icon: "/favicon.ico",
  },
  other: {
    "theme-color": "#0A0A0B",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geist.variable} ${geistMono.variable} flex flex-col min-h-dvh overflow-y-auto`}
      >
        <ThemeProvider>
          <MenuProvider>
            <Suspense fallback={null}>
              <TopLoader />
            </Suspense>
            <NavBar />
            {children}
            <Footer />
          </MenuProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

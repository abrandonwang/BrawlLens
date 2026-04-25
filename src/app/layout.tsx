import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "../components/NavBar";
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
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22none%22 stroke=%22black%22 stroke-width=%2210%22/><circle cx=%2250%22 cy=%2250%22 r=%2210%22 fill=%22black%22/></svg>",
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
            <TopLoader />
            <NavBar />
            {children}
          </MenuProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

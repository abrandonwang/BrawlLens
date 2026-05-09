import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import TopLoader from "../components/TopLoader";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "BrawlLens",
  description: "Advanced analytics for competitive players.",
  manifest: "/site.webmanifest",
  verification: {
    google: "KgSz5bQ-JYhDUKa1e_JLCMQw24ST6zgO0LQqjhNB7kU",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0e10",
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
        className="flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto"
      >
        <TopLoader />
        <NavBar />
        <div className="app-main-shell flex-1 flex flex-col pt-[60px]">
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

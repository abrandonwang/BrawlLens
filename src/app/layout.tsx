import type { Metadata } from "next";
import "./globals.css";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import TopLoader from "../components/TopLoader";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "BrawlLens",
  description: "Advanced analytics for competitive players.",
  verification: {
    google: "KgSz5bQ-JYhDUKa1e_JLCMQw24ST6zgO0LQqjhNB7kU",
  },
  icons: {
    icon: "/favicon.ico",
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
        className="flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto"
      >
        <TopLoader />
        <NavBar />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

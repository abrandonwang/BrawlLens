import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import { Bell } from "lucide-react";
import "./globals.css";
import NavBar from "../components/NavBar"
import { MenuProvider } from "../context/MenuContext"

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
      <body className="flex flex-col min-h-screen">
        <MenuProvider>
          <NavBar/>
          <div className="flex-1">{children}</div>
          <button className="fixed bottom-6 right-6 p-3 bg-white/8 rounded-full shadow-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/12 transition-all cursor-pointer z-50">
            <Bell size={20} />
          </button>
          <footer className="border-t border-white/6 mt-8">
            <div className="max-w-[1200px] mx-auto px-6 py-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <a href="/about?section=privacy-policy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy Policy</a>
                <a href="/about?section=contact" className="text-xs text-white/30 hover:text-white/60 transition-colors">Contact</a>
              </div>
              <p className="text-xs text-white/20">© {new Date().getFullYear()} BrawlLens</p>
            </div>
            <div className="border-t border-white/4 py-4 px-6 text-center">
              <p className="text-xs text-white/15 max-w-2xl mx-auto">
                This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it. For more information see <a href="https://www.supercell.com/fan-content-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 underline transition-colors">Supercell's Fan Content Policy</a>.
              </p>
            </div>
          </footer>
        </MenuProvider>
      </body>
    </html>
  );
}

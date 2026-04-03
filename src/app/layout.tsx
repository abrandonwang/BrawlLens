import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import { MenuProvider } from "../context/MenuContext"
import { ThemeProvider } from "../components/ThemeProvider"
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BrawlLens - The Pro Library",
  description: "Advanced analytics for competitive players.",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22none%22 stroke=%22black%22 stroke-width=%2210%22/><circle cx=%2250%22 cy=%2250%22 r=%2210%22 fill=%22black%22/></svg>',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} flex flex-col min-h-dvh overflow-y-auto bg-white dark:bg-[#111]`}>
        <ThemeProvider>
          <MenuProvider>
            <NextTopLoader color='#ef4444' showSpinner={false}/>
            <NavBar/>
            <div className="flex flex-col flex-1 max-w-[1080px] mx-auto w-full">
              {children}
            </div>
            <Footer/>
          </MenuProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Footer() {
    const pathname = usePathname()
    const isDark = pathname.startsWith("/brawlers") || pathname.startsWith("/player") || pathname.startsWith("/meta")

    return (
        <footer className={`relative z-10 w-full border-t ${isDark ? "bg-black border-white/5" : "border-zinc-200/50"}`}>
            <div className="max-w-[1200px] mx-auto px-10 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className={`text-sm font-medium ${isDark ? "text-white/30" : "text-zinc-500"}`}>
                    © 2025 BrawlLens. All rights reserved.
                </p>

                <div className={`flex items-center gap-8 ${isDark ? "text-white/30" : "text-zinc-400"}`}>
                    <Link
                        href="/about?section=privacy-policy"
                        className={`text-sm font-bold transition-colors ${isDark ? "hover:text-white" : "hover:text-zinc-900"}`}
                    >
                        Privacy Policy
                    </Link>
                    <Link
                        href="/about?section=contact"
                        className={`text-sm font-bold transition-colors ${isDark ? "hover:text-white" : "hover:text-zinc-900"}`}
                    >
                        Contact
                    </Link>
                </div>
            </div>
        </footer>
    )
}

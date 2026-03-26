"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Footer() {
    const pathname = usePathname()
    const isDark = pathname.startsWith("/brawlers") || pathname.startsWith("/player") || pathname.startsWith("/meta")

    return (
        <footer className={`relative z-10 w-full border-t ${isDark ? "bg-black border-white/5" : "border-zinc-200/50"}`}>
            <div className="px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className={`text-sm font-medium ${isDark ? "text-white/30" : "text-zinc-900"}`}>
                    © 2025 BrawlLens. All rights reserved.
                </p>

                <div className="flex items-center gap-1">
                    <Link href="/about?section=privacy-policy" className={`font-mono text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded-sm ${isDark ? "text-white/30 hover:text-white hover:bg-white/5" : "text-zinc-900 hover:text-zinc-950 hover:bg-black/5"}`}>
                        [ Privacy Policy ]
                    </Link>
                    <Link href="/about?section=contact" className={`font-mono text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded-sm ${isDark ? "text-white/30 hover:text-white hover:bg-white/5" : "text-zinc-900 hover:text-zinc-950 hover:bg-black/5"}`}>
                        [ Contact ]
                    </Link>
                </div>
            </div>
        </footer>
    )
}

"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Footer() {
    const pathname = usePathname()
    if (pathname !== "/") return null

    return (
        <footer className="w-full bg-zinc-100 border-t border-black/8 dark:bg-[#111] dark:border-white/8">
            <div className="px-4 md:px-6 h-[52px] flex items-center justify-center sm:justify-between">
                <p className="hidden sm:block text-xs font-medium text-zinc-400 dark:text-white/25">© 2025 BrawlLens.</p>
                <div className="flex items-center overflow-hidden">
                    <Link href="/about?section=privacy-policy" className="text-xs font-bold tracking-tight transition-all duration-200 px-4 py-2 text-zinc-400 hover:text-zinc-900 hover:bg-black/5 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5">
                        Privacy Policy
                    </Link>
                    <Link href="/about?section=contact" className="text-xs font-bold tracking-tight transition-all duration-200 px-4 py-2 text-zinc-400 hover:text-zinc-900 hover:bg-black/5 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5">
                        Contact
                    </Link>
                </div>
            </div>
        </footer>
    )
}

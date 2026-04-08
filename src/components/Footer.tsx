"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Footer() {
    const pathname = usePathname()
    if (pathname !== "/") return null

    return (
        <footer className="w-full bg-white border-t border-black/8 dark:bg-[#111] dark:border-white/8">
            <div className="px-4 md:px-6 h-[52px] flex items-center justify-between max-w-[1080px] mx-auto w-full">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-white/70">© 2025 BrawlLens.</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    {/* spacer or could add center content here */}
                </div>
                <div className="flex-1 flex items-center justify-end gap-1">
                    <Link href="/about?section=privacy-policy" className="text-xs font-semibold tracking-tight transition-all duration-200 px-3 py-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-black/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5">
                        Privacy
                    </Link>
                    <Link href="/about?section=contact" className="text-xs font-semibold tracking-tight transition-all duration-200 px-3 py-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-black/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5">
                        Contact
                    </Link>
                </div>
            </div>
        </footer>
    )
}

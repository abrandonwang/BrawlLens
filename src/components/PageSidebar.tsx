"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
    { label: "[ Brawlers ]", href: "/brawlers" },
    { label: "[ Maps ]", href: "/meta" },
    { label: "[ Leaderboards ]", href: "/leaderboards" },
    { label: "[ About ]", href: "/about" },
]

export default function PageSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-48 shrink-0 sticky top-[72px] h-[calc(100vh-72px)] border-r border-white/5 py-8 px-3 flex flex-col gap-1">
            {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`font-mono text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded-sm ${
                            isActive
                                ? "bg-[#FFD400] text-black"
                                : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        {item.label}
                    </Link>
                )
            })}
        </aside>
    )
}

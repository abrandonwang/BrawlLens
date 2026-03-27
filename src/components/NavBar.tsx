"use client"
import { useState, useEffect } from "react"
import { Search, X, User, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
    { label: "Brawlers", href: "/brawlers" },
    { label: "Maps", href: "/meta" },
    { label: "Leaderboards", href: "/leaderboards" },
    { label: "About", href: "/about" },
]

export default function NavBar() {
    const pathname = usePathname()
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    
    const isDark = true

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMenuOpen(false)
    }, [pathname])

    return (
        <>
            <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
                isDark ? "bg-[#111] border-b border-white/8" : "bg-[#111] border-b border-white/8"
            }`}>
                <header className="h-[52px] grid grid-cols-3 items-center px-4 md:px-6">

                    {/* LEFT: Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                                <div className={`absolute inset-0 border-2 rounded-full transition-colors ${isDark ? "border-white" : "border-black"}`} />
                                <div className={`w-1 h-1 rounded-full transition-colors ${isDark ? "bg-white" : "bg-black"}`} />
                            </div>
                            <span className={`text-sm font-black transition-colors ${isDark ? "text-white" : "text-black"}`}>
                                BrawlLens
                            </span>
                        </Link>
                    </div>

                    {/* CENTER: Nav links */}
                    <nav className="hidden lg:flex items-center justify-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`whitespace-nowrap text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded ${
                                        isActive
                                            ? (isDark ? "bg-[#FFD400] text-black" : "bg-zinc-900 text-white")
                                            : (isDark ? "text-white/60 hover:text-white hover:bg-white/8" : "text-zinc-700 hover:text-black hover:bg-black/5")
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="lg:hidden" />

                    {/* RIGHT: Search + Avatar + Hamburger */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className={`p-2 rounded transition-colors ${isDark ? "text-white/50 hover:text-white hover:bg-white/8" : "text-zinc-700 hover:text-black hover:bg-black/5"}`}
                        >
                            <Search size={16} />
                        </button>

                        <Link
                            href="/player/me"
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 ${
                                isDark ? "bg-white text-black hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"
                            }`}
                        >
                            <User size={14} />
                        </Link>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 lg:hidden transition-colors ${isDark ? "text-white/60 hover:text-white" : "text-zinc-700 hover:text-black"}`}
                        >
                            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </header>
            </div>

            {/* MOBILE NAV OVERLAY */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[150] lg:hidden" onClick={() => setIsMenuOpen(false)}>
                    <div
                        className={`absolute top-[80px] right-4 w-44 rounded-lg shadow-2xl border overflow-hidden animate-in zoom-in-95 slide-in-from-top-1 duration-150 ${
                            isDark ? "bg-zinc-900 border-white/10" : "bg-white border-zinc-100 shadow-zinc-200/60"
                        }`}
                        onClick={e => e.stopPropagation()}
                    >
                        <nav className="flex flex-col p-1.5 gap-0.5">
                            {navItems.map((item) => {
                                const isActive = pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`text-xs font-bold px-3 py-2.5 rounded-md transition-all ${
                                            isActive
                                                ? (isDark ? "bg-[#FFD400] text-black" : "bg-zinc-900 text-white")
                                                : (isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50")
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </div>
            )}

            {/* SPACER (to prevent content jump since navbar is fixed) */}
            <div className="h-[52px]" />

            {/* SEARCH OVERLAY */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[10vh] md:pt-[15vh] px-4 md:px-6">
                    <div className="w-full max-w-xl bg-white rounded-3xl md:rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 md:p-8 flex items-center gap-4 md:gap-6 border-b border-zinc-100">
                            <Search className="text-[#FFD400]" size={22} />
                            <input 
                                autoFocus 
                                placeholder="ENTER PLAYER TAG..." 
                                className="flex-1 bg-transparent border-none outline-none text-lg md:text-xl font-black tracking-tight placeholder:text-zinc-200 uppercase w-full" 
                            />
                            <button onClick={() => setIsSearchOpen(false)}>
                                <X size={24} className="text-zinc-300 hover:text-black"/>
                            </button>
                        </div>
                        <div className="p-6 md:p-10 flex flex-col items-center gap-4 bg-zinc-50/50">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 text-center">Suggested Tags</span>
                            <div className="flex flex-wrap justify-center gap-2">
                                <button className="px-3 py-2 md:px-4 md:py-2 bg-white border border-zinc-100 rounded-md text-[10px] font-black text-zinc-400 hover:border-[#FFD400] hover:text-zinc-900 transition-all">#GRG0L2G</button>
                                <button className="px-3 py-2 md:px-4 md:py-2 bg-white border border-zinc-100 rounded-md text-[10px] font-black text-zinc-400 hover:border-[#FFD400] hover:text-zinc-900 transition-all">#2Y09VLLY</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
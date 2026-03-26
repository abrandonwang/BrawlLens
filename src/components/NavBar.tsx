"use client"
import { useState } from "react"
import { Search, Command, X, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
    { label: "[ Brawlers ]", href: "/brawlers" },
    { label: "[ Maps ]", href: "/meta" },
    { label: "[ Leaderboards ]", href: "/leaderboards" },
    { label: "[ About ]", href: "/about"},
]

export default function NavBar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    
    const isDark = pathname !== "/"

    return (
        <>
            <div className={`w-full z-10 transition-all duration-300 ${isDark ? "bg-black border-b border-white/10" : "border-b border-zinc-100"}`}>
                <header className="h-[72px] flex items-center justify-between px-8">
                    
                    {/* LEFT: LOGO + SEARCH */}
                    <div className="flex items-center gap-4 shrink-0">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-7 h-7 flex items-center justify-center">
                                <div className={`absolute inset-0 border-[2.5px] rounded-full transition-colors ${isDark ? "border-white" : "border-zinc-900"}`} />
                                <div className={`w-1 h-1 rounded-full transition-colors ${isDark ? "bg-white" : "bg-zinc-900"}`} />
                            </div>
                            <span className={`text-base font-black tracking-[-0.04em] transition-colors hidden xl:block ${isDark ? "text-white" : "text-zinc-900"}`}>
                                BrawlLens
                            </span>
                        </Link>

                        <div className={`h-6 w-[1px] hidden sm:block ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />

                        <button
                            onClick={() => setIsOpen(true)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all group ${
                                isDark ? "bg-white/5 hover:bg-white/10" : "bg-white/80 hover:bg-white shadow-sm"
                            }`}
                        >
                            <Search size={14} className={isDark ? "text-white/40" : "text-zinc-400"} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest pr-8 hidden sm:block ${isDark ? "text-white/60" : "text-zinc-500"}`}>
                                Quick Search
                            </span>
                            <div className="flex items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity hidden sm:flex">
                                <Command size={10} className={isDark ? "text-white" : "text-zinc-900"} />
                                <span className={`text-[9px] font-black ${isDark ? "text-white" : "text-zinc-900"}`}>K</span>
                            </div>
                        </button>
                    </div>

                    {/* RIGHT: NAV + PROFILE */}
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`font-mono text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded-sm ${
                                            isActive
                                                ? (isDark ? "bg-[#FFD400] text-black font-bold" : "bg-zinc-900 text-white font-bold")
                                                : (isDark ? "text-white/70 hover:text-white hover:bg-white/5" : "text-black hover:text-zinc-950 hover:bg-black/5")
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        <Link
                            href="/player/me"
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                                isDark ? "bg-white text-black" : "bg-zinc-900 text-white hover:scale-105 shadow-xl shadow-zinc-900/10"
                            }`}
                        >
                            <User size={16} />
                        </Link>
                    </div>
                </header>
            </div>
            {/* SEARCH OVERLAY (Updated Colors) */}
            {isOpen && (
                <div className="fixed inset-0 z-[200] bg-white/40 backdrop-blur-xl flex items-start justify-center pt-[15vh] px-6">
                    <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl border border-white overflow-hidden animate-fade-in">
                        <div className="p-8 flex items-center gap-6 border-b border-zinc-50">
                            <Search className="text-[#FFD400]" size={24} />
                            <input 
                                autoFocus 
                                placeholder="ENTER PLAYER TAG..." 
                                className="flex-1 bg-transparent border-none outline-none text-xl font-black tracking-tight placeholder:text-zinc-200 uppercase" 
                            />
                            <button onClick={() => setIsOpen(false)}><X size={24} className="text-zinc-300 hover:text-black"/></button>
                        </div>
                        <div className="p-10 flex flex-col items-center gap-4 bg-zinc-50/50">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">Suggested Tags</span>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-white border border-zinc-100 rounded-xl text-[10px] font-black text-zinc-400 hover:border-[#FFD400] hover:text-zinc-900 transition-all">#GRG0L2G</button>
                                <button className="px-4 py-2 bg-white border border-zinc-100 rounded-xl text-[10px] font-black text-zinc-400 hover:border-[#FFD400] hover:text-zinc-900 transition-all">#2Y09VLLY</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
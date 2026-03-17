"use client"
import { useState } from "react"
import { Search, Command, X, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
    { label: "Brawlers", href: "/brawlers" },
    { label: "Meta", href: "/meta" },
    { label: "Leaderboards", href: "/leaderboards" },
]

export default function NavBar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    
    const isDark = pathname !== "/" && pathname !== "/about"

    return (
        <>
            <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-6">
                <header className={`max-w-[1200px] w-full h-[72px] rounded-full flex items-center justify-between px-8 backdrop-blur-2xl shadow-sm ${isDark ? "bg-zinc-900/95 border border-white/8" : "bg-zinc-200/95 border border-black/5"}`}>
                    
                    {/* LEFT: LOGO + SEARCH */}
                    <div className="flex items-center gap-4 shrink-0">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-7 h-7 flex items-center justify-center">
                                <div className={`absolute inset-0 border-[2.5px] rounded-full transition-colors ${isDark ? "border-white" : "border-black"}`} />
                                <div className={`w-1 h-1 rounded-full transition-colors ${isDark ? "bg-white" : "bg-black"}`} />
                            </div>
                            <span className={`text-base font-black tracking-[-0.04em] transition-colors hidden xl:block ${isDark ? "text-white" : "text-black"}`}>
                                BrawlLens
                            </span>
                        </Link>

                        <div className={`h-6 w-[1px] hidden sm:block ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />

                        <button
                            onClick={() => setIsOpen(true)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all group ${
                                isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-zinc-50"
                            }`}
                        >
                            <Search size={14} className={isDark ? "text-white/40" : "text-zinc-400"} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest pr-8 hidden sm:block ${isDark ? "text-white/60" : "text-zinc-500"}`}>
                                Quick Search
                            </span>
                            <div className="flex items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity hidden sm:flex">
                                <Command size={10} className={isDark ? "text-white" : "text-black"} />
                                <span className={`text-[9px] font-black ${isDark ? "text-white" : "text-black"}`}>K</span>
                            </div>
                        </button>
                    </div>

                    {/* RIGHT: NAV + PROFILE */}
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-6">
                            {navItems.map((item) => {
                                const isActive = pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`relative text-sm font-semibold tracking-tight transition-colors duration-300 group ${
                                            isActive
                                                ? (isDark ? "text-white" : "text-black")
                                                : (isDark ? "text-white/30 hover:text-white/60" : "text-zinc-400 hover:text-zinc-700")
                                        }`}
                                    >
                                        {item.label}
                                        <span className={`absolute -bottom-1 left-0 h-[2px] rounded-full transition-all duration-300 ${
                                            isDark ? "bg-white" : "bg-black"
                                        } ${isActive ? "w-full" : "w-0 group-hover:w-full"}`} />
                                    </Link>
                                )
                            })}
                        </nav>

                        <Link
                            href="/player/me"
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                                isDark ? "bg-white text-black" : "bg-black text-white hover:scale-105 active:scale-95 shadow-lg shadow-black/5"
                            }`}
                        >
                            <User size={16} />
                        </Link>
                    </div>
                </header>
            </div>

            {/* SEARCH OVERLAY */}
            {isOpen && (
                <div className="fixed inset-0 z-[200] bg-zinc-950/20 backdrop-blur-xl flex items-start justify-center pt-[15vh] px-6">
                    <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl border border-zinc-100 overflow-hidden animate-fade-in">
                        <div className="p-8 flex items-center gap-6 border-b border-zinc-50">
                            <Search className="text-zinc-300" size={24} />
                            <input 
                                autoFocus 
                                placeholder="ENTER PLAYER TAG..." 
                                className="flex-1 bg-transparent border-none outline-none text-xl font-black tracking-tight placeholder:text-zinc-100 uppercase" 
                            />
                            <button onClick={() => setIsOpen(false)}><X size={24} className="text-zinc-300 hover:text-black"/></button>
                        </div>
                        <div className="p-10 flex flex-col items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-200">Suggested Tags</span>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-zinc-50 rounded-xl text-[10px] font-black text-zinc-400 hover:text-black transition-colors">#GRG0L2G</button>
                                <button className="px-4 py-2 bg-zinc-50 rounded-xl text-[10px] font-black text-zinc-400 hover:text-black transition-colors">#2Y09VLLY</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
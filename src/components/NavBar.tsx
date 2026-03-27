"use client"
import { useState, useEffect, useRef } from "react"
import { Search, X, User, Menu, LayoutGrid, Map, Trophy, Info, ArrowRight } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const navItems = [
    { label: "Brawlers", href: "/brawlers" },
    { label: "Maps", href: "/meta" },
    { label: "Leaderboards", href: "/leaderboards" },
    { label: "About", href: "/about" },
]

const searchItems = [
    { label: "Brawlers", href: "/brawlers", icon: LayoutGrid },
    { label: "Maps", href: "/meta", icon: Map },
    { label: "Leaderboards", href: "/leaderboards", icon: Trophy },
    { label: "About", href: "/about", icon: Info },
]

export default function NavBar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [query, setQuery] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => { setIsMenuOpen(false) }, [pathname])

    useEffect(() => {
        if (isSearchOpen) {
            setQuery("")
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isSearchOpen])

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setIsSearchOpen(false)
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setIsSearchOpen(true)
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    const isTag = query.trim().startsWith("#") || /^[A-Z0-9]{3,}$/i.test(query.trim())
    const filtered = searchItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))

    function handlePlayerSearch() {
        const tag = query.trim().replace(/^#/, "")
        if (tag) { router.push(`/player/${tag}`); setIsSearchOpen(false) }
    }

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-[100] bg-[#111] border-b border-white/8">
                <header className="h-[52px] grid grid-cols-3 items-center px-4 md:px-6">

                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                                <div className="absolute inset-0 border-2 rounded-full border-white" />
                                <div className="w-1 h-1 rounded-full bg-white" />
                            </div>
                            <span className="text-sm font-black text-white">BrawlLens</span>
                        </Link>
                    </div>

                    {/* Nav */}
                    <nav className="hidden lg:flex items-center justify-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`whitespace-nowrap text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded ${
                                        isActive ? "bg-[#FFD400] text-black" : "text-white/60 hover:text-white hover:bg-white/8"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="lg:hidden" />

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2 rounded transition-colors text-white/50 hover:text-white hover:bg-white/8"
                        >
                            <Search size={16} />
                        </button>

                        <Link
                            href="/player/me"
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 bg-white text-black hover:bg-zinc-100"
                        >
                            <User size={14} />
                        </Link>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 lg:hidden transition-colors text-white/60 hover:text-white"
                        >
                            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </header>
            </div>

            {/* Mobile nav */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[150] lg:hidden" onClick={() => setIsMenuOpen(false)}>
                    <div
                        className="absolute top-[56px] right-4 w-44 rounded-lg shadow-2xl border border-white/10 bg-zinc-900 overflow-hidden animate-in zoom-in-95 slide-in-from-top-1 duration-150"
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
                                            isActive ? "bg-[#FFD400] text-black" : "text-white/60 hover:text-white hover:bg-white/5"
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

            {/* Spacer */}
            <div className="h-[52px]" />

            {/* Search overlay */}
            {isSearchOpen && (
                <div
                    className="fixed inset-0 z-[200] bg-black/50 flex items-start justify-center pt-[12vh] px-4"
                    onClick={() => setIsSearchOpen(false)}
                >
                    <div
                        className="w-full max-w-lg bg-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Input row */}
                        <div className="flex items-center gap-3 px-4 border-b border-white/8">
                            <Search size={15} className="text-white/30 shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && isTag && handlePlayerSearch()}
                                placeholder="Type something to search..."
                                className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-white/25 outline-none"
                            />
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="text-[11px] font-bold text-white/30 border border-white/10 px-2 py-1 hover:text-white/60 transition-colors"
                            >
                                Esc
                            </button>
                        </div>

                        {/* Results */}
                        <div className="py-2">
                            {query && isTag && (
                                <button
                                    onClick={handlePlayerSearch}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <User size={15} className="text-white/30 shrink-0" />
                                    <span className="flex-1 text-left">Search player <span className="text-[#FFD400] font-bold">#{query.replace(/^#/, "")}</span></span>
                                    <ArrowRight size={13} className="text-white/20" />
                                </button>
                            )}

                            {filtered.map(({ label, href, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setIsSearchOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <Icon size={15} className="text-white/30 shrink-0" />
                                    <span className="flex-1">{label}</span>
                                </Link>
                            ))}

                            {filtered.length === 0 && !isTag && (
                                <p className="px-4 py-6 text-xs text-white/25 text-center">No results for &quot;{query}&quot;</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

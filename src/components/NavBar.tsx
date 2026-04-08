"use client"
import { useState, useEffect, useRef } from "react"
import { Search, X, User, Menu, LayoutGrid, Map, Trophy, Info, ArrowRight, MessageSquare } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"

const navItems = [
    { label: "Chat", href: "/chat" },
    { label: "Brawlers", href: "/brawlers" },
    { label: "Maps", href: "/meta" },
    { label: "Leaderboards", href: "/leaderboards" },
    { label: "About", href: "/about" },
]

const searchItems = [
    { label: "Chat", href: "/chat", icon: MessageSquare },
    { label: "Brawlers", href: "/brawlers", icon: LayoutGrid },
    { label: "Maps", href: "/meta", icon: Map },
    { label: "Leaderboards", href: "/leaderboards", icon: Trophy },
    { label: "About", href: "/about", icon: Info },
]

export default function NavBar() {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [query, setQuery] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => { setMounted(true) }, [])
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
            <div className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-black/8 dark:bg-[#111] dark:border-white/8">
                <header className="h-[52px] grid grid-cols-3 items-center px-4 md:px-6 max-w-[1080px] mx-auto w-full">

                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                                <div className="absolute inset-0 border-2 rounded-full border-zinc-900 dark:border-white" />
                                <div className="w-[4px] h-[4px] rounded-full bg-zinc-900 dark:bg-white" />
                            </div>
                            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">BrawlLens</span>
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
                                    className={`whitespace-nowrap text-xs font-medium tracking-tight transition-all duration-200 px-3 py-1.5 ${
                                        isActive
                                            ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                                            : "text-zinc-500 hover:text-zinc-900 hover:bg-black/8 dark:text-white/75 dark:hover:text-white dark:hover:bg-white/8"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="lg:hidden" />

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5">
                        {/* Search — utility icon, always visible */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2 transition-colors text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.05] dark:text-white/65 dark:hover:text-white dark:hover:bg-white/[0.05]"
                        >
                            <Search size={15} />
                        </button>

                        {/* Theme toggle — solid fill, inverted to current theme */}
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="hidden sm:flex items-center h-[30px] px-3 text-xs font-semibold transition-colors bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                        >
                            {mounted ? (theme === "dark" ? "Light" : "Dark") : ""}
                        </button>

                        {/* Profile — "Dashboard" style: rectangular bordered button */}
                        <Link
                            href="/player/me"
                            className="hidden sm:flex items-center gap-1.5 h-[30px] px-3 border border-black/10 dark:border-white/15 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-white/80 dark:hover:text-white transition-colors"
                        >
                            <User size={13} />
                            <span>Profile</span>
                        </Link>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 lg:hidden transition-colors text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
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
                        className="absolute top-[56px] right-4 w-44 rounded-lg shadow-2xl border border-black/10 bg-white overflow-hidden animate-in zoom-in-95 slide-in-from-top-1 duration-150 dark:border-white/10 dark:bg-zinc-900"
                        onClick={e => e.stopPropagation()}
                    >
                        <nav className="flex flex-col p-1.5 gap-0.5">
                            {navItems.map((item) => {
                                const isActive = pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`text-xs font-medium px-3 py-2.5 transition-all ${
                                            isActive
                                                ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                                                : "text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-white/75 dark:hover:text-white dark:hover:bg-white/5"
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
                        className="w-full max-w-lg bg-white border border-black/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 dark:bg-[#1a1a1a] dark:border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 px-4 border-b border-black/8 dark:border-white/8">
                            <Search size={15} className="text-zinc-400 shrink-0 dark:text-white/50" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && isTag && handlePlayerSearch()}
                                placeholder="Type something to search..."
                                className="flex-1 bg-transparent py-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none dark:text-white dark:placeholder:text-white/25"
                            />
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="text-[11px] font-bold text-zinc-400 border border-black/10 px-2 py-1 hover:text-zinc-600 transition-colors dark:text-white/50 dark:border-white/10 dark:hover:text-white/60"
                            >
                                Esc
                            </button>
                        </div>

                        <div className="py-2">
                            {query && isTag && (
                                <button
                                    onClick={handlePlayerSearch}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-black/5 hover:text-zinc-900 transition-colors dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
                                >
                                    <User size={15} className="text-zinc-400 shrink-0 dark:text-white/50" />
                                    <span className="flex-1 text-left">Search player <span className="text-red-500 dark:text-[#FFD400] font-bold">#{query.replace(/^#/, "")}</span></span>
                                    <ArrowRight size={13} className="text-zinc-300 dark:text-white/40" />
                                </button>
                            )}

                            {filtered.map(({ label, href, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setIsSearchOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-black/5 hover:text-zinc-900 transition-colors dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                                >
                                    <Icon size={15} className="text-zinc-400 shrink-0 dark:text-white/50" />
                                    <span className="flex-1">{label}</span>
                                </Link>
                            ))}

                            {filtered.length === 0 && !isTag && (
                                <p className="px-4 py-6 text-xs text-zinc-400 text-center dark:text-white/45">No results for &quot;{query}&quot;</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

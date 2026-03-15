"use client"

import { usePathname, useRouter } from "next/navigation"
import { User, BarChart2, Trophy, Shield, Layers, Info, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import "./NavBar.css"
import logo from "../app/icon.svg"

const navItems = [
    { label: "My Profile", icon: User, activeOn: "/player" },
    { label: "Stats", icon: BarChart2, activeOn: "/stats" },
    { label: "Leaderboards", icon: Trophy, activeOn: "/leaderboards" },
    { label: "Brawlers", icon: Shield, activeOn: "/brawlers" },
    { label: "Modes", icon: Layers, activeOn: "/modes" },
    { label: "About", icon: Info, activeOn: "/about" },
]

export default function NavBar() {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [savedTag, setSavedTag] = useState<string | null>(null)
    const [savedIconId, setSavedIconId] = useState<string | null>(null)
    const [iconError, setIconError] = useState(false)

    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    useEffect(() => {
        function syncFromStorage() {
            const iconId = localStorage.getItem("savedPlayerIconId")
            setSavedTag(localStorage.getItem("savedPlayerTag"))
            setSavedIconId(iconId)
            setIconError(false)
        }
        syncFromStorage()
        window.addEventListener("playerSaved", syncFromStorage)
        return () => window.removeEventListener("playerSaved", syncFromStorage)
    }, [pathname])

    function handleNavClick(label: string) {
        if (label === "My Profile") {
            router.push(savedTag ? `/player/${savedTag}` : "/")
        }
        setMobileOpen(false)
    }

    return (
        <>
            {/* Desktop */}
            <header className="sticky top-0 z-50 bg-brawl-bg/80 backdrop-blur-md border-b border-white/10 hidden lg:block">
                <nav className="container-main !overflow-visible">
                    <div className="navbar-content">
                        <Link href="/" className="navbar-brand">
                            <img className="navbar-logo" src={logo.src} width={30} height={30} alt="BrawlLens" />
                            <div className="navbar-title">BrawlLens</div>
                        </Link>
                        <div className="navbar-content-right">
                            {navItems.map(({ label, icon: Icon, activeOn }) => {
                                const isActive = pathname.startsWith(activeOn)
                                if (label === "My Profile") {
                                    return (
                                        <div key={label} className="flex items-center">
                                            <button
                                                onClick={() => handleNavClick(label)}
                                                className={`nav-item${isActive ? " nav-item-active" : ""}`}
                                            >
                                                {savedIconId && !iconError ? (
                                                    <img
                                                        src={`https://cdn.brawlify.com/profile-icons/regular/${savedIconId}.png`}
                                                        alt="Profile"
                                                        width={22}
                                                        height={22}
                                                        style={{ borderRadius: "50%", objectFit: "cover" }}
                                                        onError={() => setIconError(true)}
                                                    />
                                                ) : (
                                                    <Icon size={20} />
                                                )}
                                                {label}
                                            </button>
                                            <div className="w-px h-6 bg-white/10 mx-2" />
                                        </div>
                                    )
                                }
                                return (
                                    <Link
                                        key={label}
                                        href={activeOn}
                                        className={`nav-item${isActive ? " nav-item-active" : ""}`}
                                    >
                                        <Icon size={20} />
                                        {label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </nav>
            </header>

            {/* Mobile */}
            <header className="sticky top-0 z-50 bg-brawl-bg/95 backdrop-blur-md border-b border-white/10 lg:hidden">
                <div className="flex items-center justify-between px-5 h-14">
                    <Link href="/" className="navbar-brand">
                        <img src={logo.src} width={26} height={26} alt="BrawlLens" />
                        <div className="navbar-title">BrawlLens</div>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(o => !o)}
                        className="p-2 text-white/50 hover:text-white transition-colors"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {mobileOpen && (
                    <nav className="border-t border-white/8 px-4 py-3 flex flex-col gap-1">
                        {navItems.map(({ label, icon: Icon, activeOn }) => {
                            const isActive = pathname.startsWith(activeOn)
                            if (label === "My Profile") {
                                return (
                                    <button
                                        key={label}
                                        onClick={() => handleNavClick(label)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? "text-blue-400 bg-blue-500/10" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                                    >
                                        {savedIconId && !iconError ? (
                                            <img src={`https://cdn.brawlify.com/profile-icons/regular/${savedIconId}.png`} alt="Profile" width={18} height={18} style={{ borderRadius: "50%" }} onError={() => setIconError(true)} />
                                        ) : (
                                            <Icon size={18} />
                                        )}
                                        {label}
                                    </button>
                                )
                            }
                            return (
                                <Link
                                    key={label}
                                    href={activeOn}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? "text-blue-400 bg-blue-500/10" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                                >
                                    <Icon size={18} />
                                    {label}
                                </Link>
                            )
                        })}
                    </nav>
                )}
            </header>
        </>
    )
}

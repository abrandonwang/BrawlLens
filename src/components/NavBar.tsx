"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { User, BarChart2, Trophy, Shield, Layers, Menu, X } from "lucide-react"
import Link from "next/link"
import "./NavBar.css"

const navItems = [
    { label: "My Profile", icon: User, activeOn: "/player" },
    { label: "Stats", icon: BarChart2, activeOn: "/stats" },
    { label: "Leaderboards", icon: Trophy, activeOn: "/leaderboards" },
    { label: "Brawlers", icon: Shield, activeOn: "/brawlers" },
    { label: "Modes", icon: Layers, activeOn: "/modes" },
]

export default function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const pathname = usePathname()

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <Link href="/" className="navbar-title">BrawlLens</Link>

                {/* Desktop nav */}
                <div className="navbar-content-right">
                    {navItems.map(({ label, icon: Icon, activeOn }) => (
                        <button key={label} className={`nav-item ${pathname.startsWith(activeOn) ? "nav-item-active" : ""}`}>
                            <Icon size={16} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Mobile hamburger */}
                <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="mobile-menu">
                    {navItems.map(({ label, icon: Icon }) => (
                        <button key={label} className="mobile-nav-item" onClick={() => setMenuOpen(false)}>
                            <Icon size={20} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            )}
        </nav>
    )
}

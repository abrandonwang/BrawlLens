"use client"

import { useState } from "react"
import { User, BarChart2, Trophy, Shield, Layers, Menu, X } from "lucide-react"
import "./NavBar.css"

const navItems = [
    { label: "My Profile", icon: User },
    { label: "Stats", icon: BarChart2 },
    { label: "Leaderboards", icon: Trophy },
    { label: "Brawlers", icon: Shield },
    { label: "Modes", icon: Layers },
]

export default function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <span className="navbar-title">BrawlLens</span>

                {/* Desktop nav */}
                <div className="navbar-content-right">
                    {navItems.map(({ label, icon: Icon }) => (
                        <button key={label} className="nav-item">
                            <Icon size={20} />
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

"use client"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { User, Layers, Map, Trophy, Zap, ArrowUpRight, Check, X } from "lucide-react"

const sections = [
    { id: "about", label: "About" },
    { id: "privacy-policy", label: "Privacy Policy" },
    { id: "contact", label: "Contact" },
]

const linkBase = "font-mono text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded-sm text-left"
const linkInactive = `${linkBase} text-white/70 hover:text-white hover:bg-white/5`
const linkActive = `${linkBase} bg-[#FFD400] text-black`

const features = [
    {
        icon: User,
        title: "Player Profiles",
        description: "Look up any player by tag. See trophies, rank, club, and a full breakdown of every brawler they own sorted by performance.",
    },
    {
        icon: Layers,
        title: "Brawler Catalog",
        description: "Every brawler in the game, organized by rarity. Tap into any brawler to see their star powers, gadgets, and description.",
    },
    {
        icon: Map,
        title: "Map Meta",
        description: "Win rates per brawler across every active map and game mode, powered by battle data collected from top-ranked players across 6 regions.",
    },
    {
        icon: Trophy,
        title: "Leaderboards",
        description: "Global and regional rankings updated in real time. See who's at the top and how you stack up.",
    },
]

export default function About() {
    return (
        <div className="bg-black flex-1 flex">
            <Suspense>
                <AboutPage />
            </Suspense>
        </div>
    )
}

function AboutPage() {
    const searchParams = useSearchParams()
    const [active, setActive] = useState(searchParams.get("section") ?? "about")
    const activeSection = sections.find(s => s.id === active)

    return (
        <>
            <aside className="w-64 shrink-0 sticky top-0 h-[calc(100dvh-72px)] border-r border-white/10 py-10 px-5 flex flex-col gap-1.5 overflow-y-auto">
                {sections.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActive(id)}
                        className={active === id ? linkActive : linkInactive}
                    >
                        [ {label} ]
                    </button>
                ))}
            </aside>

            <main className="flex-1 min-w-0 pt-10 pb-20 px-12">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-white/30 mb-10">
                    <span>BrawlLens</span>
                    <span>›</span>
                    <span className="text-white/60">{activeSection?.label}</span>
                </div>

                {/* ── ABOUT ─────────────────────────────────────── */}
                {active === "about" && (
                    <div className="space-y-14">

                        {/* Hero */}
                        <div>
                            <p className="font-mono text-xs text-[#FFD400] font-bold mb-4 tracking-widest uppercase">[ Why this exists ]</p>
                            <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-5">
                                A stat site that doesn't get in your way.
                            </h1>
                            <p className="text-white/60 leading-relaxed text-base">
                                I built BrawlLens because every other Brawl Stars tracker was slow, cluttered with ads, or buried the data I actually wanted. This is my attempt at something cleaner — fast, focused, and free.
                            </p>
                        </div>

                        {/* Features */}
                        <div>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-5">What's inside</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                {features.map(({ icon: Icon, title, description }) => (
                                    <div key={title} className="border border-white/8 rounded-2xl p-5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#FFD400]/10 border border-[#FFD400]/20 flex items-center justify-center shrink-0">
                                                <Icon size={15} className="text-[#FFD400]" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-white">{title}</h3>
                                        </div>
                                        <p className="text-xs text-white/50 leading-relaxed">{description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Data source */}
                        <div className="border border-white/8 rounded-2xl p-5 bg-white/[0.02] flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                <Zap size={15} className="text-white/60" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">Live data, always</p>
                                <p className="text-xs text-white/40 mt-0.5">Everything pulls from the official Brawl Stars API and my own battle collector. No stale cache.</p>
                            </div>
                        </div>

                        {/* Fan content */}
                        <div className="border border-white/8 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-white">Fan Content Policy</p>
                                <p className="text-xs text-white/40 mt-0.5">Supercell is not responsible for this site.</p>
                            </div>
                            <a
                                href="https://supercell.com/en/fan-content-policy/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors shrink-0"
                            >
                                View <ArrowUpRight size={12} />
                            </a>
                        </div>
                    </div>
                )}

                {/* ── PRIVACY ───────────────────────────────────── */}
                {active === "privacy-policy" && (
                    <div className="space-y-10">
                        <div>
                            <p className="font-mono text-xs text-[#FFD400] font-bold mb-4 tracking-widest uppercase">[ Zero tracking ]</p>
                            <h1 className="text-4xl font-black text-white tracking-tight mb-4">Your data stays yours.</h1>
                            <p className="text-white/60 leading-relaxed">BrawlLens doesn't collect personal data, run ads, or share anything with third parties.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div className="border border-white/8 rounded-2xl p-5 bg-white/[0.02]">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">What I don't collect</p>
                                <ul className="space-y-2.5">
                                    {[
                                        "Your IP address",
                                        "Browser or device info",
                                        "Browsing behavior",
                                        "Cookies of any kind",
                                        "Analytics or tracking pixels",
                                        "Personal information",
                                    ].map(item => (
                                        <li key={item} className="flex items-center gap-2.5 text-sm text-white/60">
                                            <X size={13} className="text-red-400/70 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border border-white/8 rounded-2xl p-5 bg-white/[0.02]">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">What I do store</p>
                                <ul className="space-y-2.5">
                                    {[
                                        "Player tags you choose to save (locally on your device only)",
                                        "Nothing else.",
                                    ].map(item => (
                                        <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                                            <Check size={13} className="text-green-400/70 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CONTACT ───────────────────────────────────── */}
                {active === "contact" && (
                    <div className="space-y-10">
                        <div>
                            <p className="font-mono text-xs text-[#FFD400] font-bold mb-4 tracking-widest uppercase">[ Get in touch ]</p>
                            <h1 className="text-4xl font-black text-white tracking-tight mb-2">I'm listening.</h1>
                            <p className="text-white/50 text-sm">Found a bug, have a feature idea, or just want to say hi?</p>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Form */}
                            <form className="xl:col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-2">Name</label>
                                        <input
                                            placeholder="Your name"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:bg-white/8 transition-colors placeholder:text-white/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-2">Email</label>
                                        <input
                                            placeholder="your@email.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:bg-white/8 transition-colors placeholder:text-white/20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-2">Message</label>
                                    <textarea
                                        rows={8}
                                        placeholder="What's on your mind?"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:bg-white/8 transition-colors resize-none placeholder:text-white/20"
                                    />
                                </div>
                                <button className="px-6 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition-colors">
                                    Send message
                                </button>
                            </form>

                            {/* Right panel */}
                            <div className="flex flex-col gap-4">
                                <div className="border border-white/8 rounded-2xl p-6 bg-white/[0.02] flex-1">
                                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">What to expect</p>
                                    <ul className="space-y-4">
                                        {[
                                            { label: "Bug reports", note: "I'll investigate and push a fix as soon as I can." },
                                            { label: "Feature requests", note: "I read every one. No promises, but I do consider them." },
                                            { label: "General feedback", note: "Always appreciated. Good or bad." },
                                        ].map(({ label, note }) => (
                                            <li key={label}>
                                                <p className="text-sm font-semibold text-white/80 mb-0.5">{label}</p>
                                                <p className="text-xs text-white/40 leading-relaxed">{note}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="border border-white/8 rounded-2xl p-6 bg-white/[0.02]">
                                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Response time</p>
                                    <p className="text-sm text-white/60 leading-relaxed">Usually within a few days. This is a solo project, so I appreciate your patience.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    )
}

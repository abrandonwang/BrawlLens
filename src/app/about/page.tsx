"use client"
import { useState } from "react"

export default function About() {
    const [active, setActive] = useState("about")

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-16">
            <aside className="sticky top-20 hidden lg:block border-r border-white/6 pr-6">
                <nav className="flex flex-col gap-4 text-sm">
                    {[
                        { id: "about", label: "About" },
                        { id: "privacy-policy", label: "Privacy Policy" },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setActive(id)}
                            className={`text-left transition-colors ${active === id ? "text-white font-semibold" : "text-white/40 hover:text-white/70"}`}
                        >
                            {label}
                        </button>
                    ))}
                </nav>
            </aside>

            {active === "about" && (
                <main className="py-2 max-w-2xl">
                    <h1 className="text-4xl font-black text-white mb-2">BrawlLens</h1>
                    <p className="text-sm text-white/30 mb-8">Free Brawl Stars analytics</p>

                    <p className="text-sm text-white/50 leading-relaxed mb-10">
                        BrawlLens is a free Brawl Stars analytics tool built for players who want to track their progress, understand their stats, and improve their gameplay.
                    </p>

                    <h2 className="text-base font-bold text-white mb-3">What We Offer</h2>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        Track trophies, brawler performance, leaderboards, and more — all powered by the official Brawl Stars API and always up to date.
                    </p>

                    <h2 className="text-base font-bold text-white mb-4">Key Features</h2>
                    <ul className="mb-10 space-y-2.5">
                        {[
                            "Real-time event tracking",
                            "Player & club statistics",
                            "Best brawler recommendations",
                            "Battle log history",
                            "Map statistics & meta",
                        ].map((f) => (
                            <li key={f} className="flex items-center gap-3 text-sm text-white/50">
                                <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-white/6 mb-8" />

                    <h2 className="text-base font-bold text-white mb-3">Contact</h2>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        Questions or feedback? Reach us at{" "}
                        <a href="mailto:hello@brawllens.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                            hello@brawllens.com
                        </a>
                    </p>

                    <div className="rounded-2xl bg-[#1c1c1f] border border-white/8 px-6 py-5 flex items-center justify-between gap-6">
                        <div>
                            <p className="text-sm font-bold text-white mb-1">Interested in advertising on BrawlLens?</p>
                            <p className="text-xs text-white/35">Reach thousands of Brawl Stars players daily.</p>
                        </div>
                        <a
                            href="mailto:ads@brawllens.com"
                            className="shrink-0 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold tracking-wide rounded-xl transition-colors"
                        >
                            Get in touch
                        </a>
                    </div>
                </main>
            )}

            {active === "privacy-policy" && (
                <main className="py-2 max-w-2xl">
                    <h1 className="text-4xl font-black text-white mb-2">Privacy Policy</h1>
                    <p className="text-sm text-white/30 mb-8">Last updated March 2026</p>

                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        This privacy policy has been compiled to better serve those who are concerned with how their Personally Identifiable Information is being used online.
                    </p>

                    <div className="rounded-xl bg-blue-500/10 border-l-4 border-blue-500 px-5 py-4 mb-8">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Note</p>
                        <p className="text-sm text-white/55 leading-relaxed">
                            BrawlLens does not collect, store, or transmit any personal data to our servers. All player tags are saved locally on your device only.
                        </p>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2">What We Collect</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        We do not collect any personal information from visitors. Player tags are stored in your browser's local storage and never leave your device.
                    </p>

                    <h3 className="text-base font-bold text-white mb-2">Cookies</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        We use cookies to recognize your browser and remember certain preferences. If you turn cookies off, some features may not function properly.
                    </p>

                    <h3 className="text-base font-bold text-white mb-2">Third Parties</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        We do not share your information with third parties except as necessary to provide our services or comply with legal obligations.
                    </p>

                    <h3 className="text-base font-bold text-white mb-2">Changes to This Policy</h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                        We may update this policy from time to time. Changes will be posted on this page.
                    </p>
                </main>
            )}
        </div>
    )
}

"use client"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

const sections = [
    { id: "about", label: "About" },
    { id: "privacy-policy", label: "Privacy Policy" },
    { id: "contact", label: "Contact" },
]

const linkBase = "font-mono text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded-sm text-left"
const linkInactive = `${linkBase} text-white/70 hover:text-white hover:bg-white/5`
const linkActive = `${linkBase} bg-[#FFD400] text-black`

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
            <aside className="w-64 shrink-0 sticky top-0 h-screen border-r border-white/10 py-10 px-5 flex flex-col gap-1.5 overflow-y-auto">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 px-3">BrawlLens</p>
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

            <main className="flex-1 min-w-0 pt-10 pb-16 px-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-white/30 mb-8">
                    <span>BrawlLens</span>
                    <span>›</span>
                    <span className="text-white/60">{activeSection?.label}</span>
                </div>

                {active === "about" && (
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-4">About BrawlLens</h1>
                        <p className="text-white/60 leading-relaxed mb-8">
                            BrawlLens was built because I was tired of slow, ad-cluttered stat sites. I wanted something that felt like a professional tool, clean, fast, and accurate.
                        </p>

                        <h2 className="text-sm font-semibold text-white mb-3">Core principles</h2>
                        <ul className="space-y-3 text-white/60 text-sm leading-relaxed mb-10">
                            <li className="flex gap-3">
                                <span><strong className="text-white/90 font-medium">Real-time data.</strong> Everything pulls directly from the official Brawl Stars servers. No delays, no cached data from three days ago.</span>
                            </li>
                            <li className="flex gap-3">
                                <span><strong className="text-white/90 font-medium">No accounts.</strong> I don't want your email or password. Your player tag is the only thing you'll ever need.</span>
                            </li>
                            <li className="flex gap-3">
                                <span><strong className="text-white/90 font-medium">No ads.</strong> BrawlLens is a fan project. I keep it free and clean.</span>
                            </li>
                        </ul>

                        <div className="border border-white/10 rounded-xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Fan Content Policy</p>
                                <p className="text-xs text-white/40 mt-0.5">Supercell is not responsible for this site.</p>
                            </div>
                            <a
                                href="https://supercell.com/en/fan-content-policy/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                            >
                                View <ArrowUpRight size={13} />
                            </a>
                        </div>
                    </div>
                )}

                {active === "privacy-policy" && (
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-4">Privacy Policy</h1>
                        <p className="text-white/60 leading-relaxed mb-8">
                            I believe privacy is a fundamental right. BrawlLens operates a zero-tracking policy.
                        </p>

                        <div className="space-y-8">
                            <section>
                                <h2 className="text-sm font-semibold text-white mb-2">Local Storage</h2>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    When you save a player tag, it is stored exclusively on your device's <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-white/70">localStorage</code>. It is never uploaded to my servers.
                                </p>
                            </section>
                            <div className="border-t border-white/5" />
                            <section>
                                <h2 className="text-sm font-semibold text-white mb-2">Third-Party Trackers</h2>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    I do not use Google Analytics, Meta Pixels, or any third-party advertising trackers. Your browsing habits remain your own.
                                </p>
                            </section>
                            <div className="border-t border-white/5" />
                            <section>
                                <h2 className="text-sm font-semibold text-white mb-2">Cookies</h2>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    I do not set any tracking cookies. The only persistent storage I use is your browser's local storage, and only when you explicitly save a player tag.
                                </p>
                            </section>
                        </div>
                    </div>
                )}

                {active === "contact" && (
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Contact</h1>
                        <p className="text-white/50 text-sm mb-8">Found a bug or want to suggest a feature? I'm listening.</p>
                        <form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5">Name</label>
                                    <input
                                        placeholder="Your name"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
                                    <input
                                        placeholder="your@email.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5">Message</label>
                                <textarea
                                    rows={6}
                                    placeholder="What's on your mind?"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors resize-none placeholder:text-white/20"
                                />
                            </div>
                            <button className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90 transition-colors">
                                Send message
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </>
    )
}

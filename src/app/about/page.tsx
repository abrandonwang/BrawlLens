"use client"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

const sections = [
    { id: "about", label: "About" },
    { id: "privacy-policy", label: "Privacy Policy" },
    { id: "contact", label: "Contact" },
]

export default function About() {
    return (
        <div className="bg-white min-h-screen">
            <Suspense>
                <AboutContent />
            </Suspense>
        </div>
    )
}

function AboutContent() {
    const searchParams = useSearchParams()
    const [active, setActive] = useState(searchParams.get("section") ?? "about")

    const activeSection = sections.find(s => s.id === active)

    return (
        <div className="max-w-[1100px] mx-auto px-8 flex gap-0 min-h-[calc(100vh-80px)]">

            {/* LEFT SIDEBAR */}
            <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-zinc-100 py-10 pr-6">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">BrawlLens</p>
                <nav className="flex flex-col gap-0.5">
                    {sections.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setActive(id)}
                            className={`text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                                active === id
                                    ? "bg-zinc-100 text-zinc-900 font-medium"
                                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 py-10 px-12 max-w-2xl">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-8">
                    <span>BrawlLens</span>
                    <span>›</span>
                    <span className="text-zinc-700">{activeSection?.label}</span>
                </div>

                {active === "about" && (
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 mb-4">About BrawlLens</h1>
                        <p className="text-zinc-600 leading-relaxed mb-8">
                            BrawlLens was built because we were tired of slow, ad-cluttered stat sites. We wanted something that felt like a professional tool — clean, fast, and accurate.
                        </p>

                        <h2 className="text-base font-semibold text-zinc-900 mb-3">Core principles</h2>
                        <ul className="space-y-3 text-zinc-600 text-sm leading-relaxed mb-10">
                            <li className="flex gap-3">
                                <span className="text-zinc-300 shrink-0">—</span>
                                <span><strong className="text-zinc-800 font-medium">Real-time data.</strong> Everything pulls directly from the official Brawl Stars servers. No delays, no cached data from three days ago.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-zinc-300 shrink-0">—</span>
                                <span><strong className="text-zinc-800 font-medium">No accounts.</strong> We don't want your email or password. Your player tag is the only thing you'll ever need.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-zinc-300 shrink-0">—</span>
                                <span><strong className="text-zinc-800 font-medium">No ads.</strong> BrawlLens is a fan project. We keep it free and clean.</span>
                            </li>
                        </ul>

                        <div className="border border-zinc-200 rounded-xl p-5 flex items-center justify-between group">
                            <div>
                                <p className="text-sm font-medium text-zinc-900">Fan Content Policy</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Supercell is not responsible for this site.</p>
                            </div>
                            <a
                                href="https://supercell.com/en/fan-content-policy/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                            >
                                View <ArrowUpRight size={13} />
                            </a>
                        </div>
                    </div>
                )}

                {active === "privacy-policy" && (
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Privacy Policy</h1>
                        <p className="text-zinc-600 leading-relaxed mb-8">
                            We believe privacy is a fundamental right. BrawlLens operates a zero-tracking policy.
                        </p>

                        <div className="space-y-8">
                            <section>
                                <h2 className="text-sm font-semibold text-zinc-900 mb-2">Local Storage</h2>
                                <p className="text-sm text-zinc-600 leading-relaxed">
                                    When you save a player tag, it is stored exclusively on your device's <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">localStorage</code>. It is never uploaded to our servers.
                                </p>
                            </section>

                            <div className="border-t border-zinc-100" />

                            <section>
                                <h2 className="text-sm font-semibold text-zinc-900 mb-2">Third-Party Trackers</h2>
                                <p className="text-sm text-zinc-600 leading-relaxed">
                                    We do not use Google Analytics, Meta Pixels, or any third-party advertising trackers. Your browsing habits remain your own.
                                </p>
                            </section>

                            <div className="border-t border-zinc-100" />

                            <section>
                                <h2 className="text-sm font-semibold text-zinc-900 mb-2">Cookies</h2>
                                <p className="text-sm text-zinc-600 leading-relaxed">
                                    We do not set any tracking cookies. The only persistent storage we use is your browser's local storage, and only when you explicitly save a player tag.
                                </p>
                            </section>
                        </div>
                    </div>
                )}

                {active === "contact" && (
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Contact</h1>
                        <p className="text-zinc-500 text-sm mb-8">Found a bug or want to suggest a feature? We're listening.</p>

                        <form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Name</label>
                                    <input
                                        placeholder="Your name"
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Email</label>
                                    <input
                                        placeholder="your@email.com"
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-300"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Message</label>
                                <textarea
                                    rows={6}
                                    placeholder="What's on your mind?"
                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors resize-none placeholder:text-zinc-300"
                                />
                            </div>
                            <button className="px-5 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors">
                                Send message
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    )
}

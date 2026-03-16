"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Send, CheckCircle } from "lucide-react"

const sections = [
    { id: "about", label: "About" },
    { id: "privacy-policy", label: "Privacy Policy" },
    { id: "contact", label: "Contact" },
]

export default function About() {
    return (
        <Suspense>
            <AboutContent />
        </Suspense>
    )
}

function AboutContent() {
    const searchParams = useSearchParams()
    const [active, setActive] = useState(searchParams.get("section") ?? "about")

    useEffect(() => {
        const section = searchParams.get("section")
        if (section) setActive(section)
    }, [searchParams])

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-16 lg:items-start">
            <aside className="self-stretch sticky top-20 hidden lg:block border-r border-white/6 pr-6">
                <nav className="flex flex-col gap-4 text-sm">
                    {sections.map(({ id, label }) => (
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

            {/* Mobile nav */}
            <div className="flex gap-4 mb-8 lg:hidden">
                {sections.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActive(id)}
                        className={`text-sm transition-colors ${active === id ? "text-white font-semibold" : "text-white/40 hover:text-white/70"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {active === "about" && (
                <main className="py-2 max-w-2xl">
                    <h1 className="text-4xl font-black text-white mb-2">BrawlLens</h1>
                    <p className="text-sm text-white/30 mb-8">Free Brawl Stars analytics, built for players.</p>

                    <p className="text-sm text-white/50 leading-relaxed mb-10">
                        BrawlLens is a free Brawl Stars stats site built for players who actually care about their numbers. No account required, no setup. Just enter your player tag and get a full picture of your profile: trophies, brawler stats, ranks, and everything in between.
                    </p>

                    <h2 className="text-base font-bold text-white mb-3">How It Works</h2>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        Everything pulls straight from the official Brawl Stars API, so the data is always current. There are no accounts to create, no subscriptions to manage, and no features locked behind a paywall. It's all free, and it always will be.
                    </p>

                    <h2 className="text-base font-bold text-white mb-4">Key Features</h2>
                    <ul className="mb-10 space-y-2.5">
                        {[
                            "Full player profile with per-brawler breakdown",
                            "Trophy tracking and progression over time",
                            "Brawler stats including power level, rank, gadgets, and star powers",
                            "Global and regional leaderboards",
                            "Coverage across all game modes and maps",
                            "No login required, just your player tag",
                        ].map((f) => (
                            <li key={f} className="flex items-center gap-3 text-sm text-white/50">
                                <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-white/6 mb-8" />

                    <h2 className="text-base font-bold text-white mb-3">Disclaimer</h2>
                    <p className="text-sm text-white/50 leading-relaxed mb-10">
                        Not affiliated with, endorsed, sponsored, or approved by Supercell. Supercell is not responsible for this site. For more info see{" "}
                        <a href="https://www.supercell.com/fan-content-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Supercell's Fan Content Policy
                        </a>.
                    </p>

                    <div className="rounded-2xl bg-[#1c1c1f] border border-white/8 px-6 py-5 flex items-center justify-between gap-6">
                        <div>
                            <p className="text-sm font-bold text-white mb-1">Interested in advertising on BrawlLens?</p>
                            <p className="text-xs text-white/35">Reach thousands of Brawl Stars players daily.</p>
                        </div>
                        <button
                            onClick={() => setActive("contact")}
                            className="shrink-0 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold tracking-wide rounded-xl transition-colors cursor-pointer"
                        >
                            Get in touch
                        </button>
                    </div>
                </main>
            )}

            {active === "privacy-policy" && (
                <main className="py-2 max-w-2xl">
                    <h1 className="text-4xl font-black text-white mb-2">Privacy Policy</h1>
                    <p className="text-sm text-white/30 mb-8">Last updated March 2026</p>

                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        We built BrawlLens to be as lightweight as possible, and that extends to data too. We don't want your info. Here's exactly what that means.
                    </p>

                    <div className="rounded-xl bg-blue-500/10 border-l-4 border-blue-500 px-5 py-4 mb-10">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Summary</p>
                        <p className="text-sm text-white/55 leading-relaxed">
                            BrawlLens does not collect, store, or transmit any personal data. Player tags are saved locally on your own device and never touch our servers.
                        </p>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2">What We Collect</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        Nothing. Player tags you enter are stored in your browser's local storage so the site remembers them between visits. That data never leaves your device. There are no accounts, no sign-ins, and nothing stored on our end.
                    </p>

                    <h3 className="text-base font-bold text-white mb-2">How Player Data Is Used</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        When you look up a player, the tag is sent to the official Brawl Stars API to fetch publicly available game data. This is the same data visible inside the game itself. We don't log it, store it, or pass it anywhere.
                    </p>

                    <h3 className="text-base font-bold text-white mb-2">Cookies</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        We only use cookies that are necessary to keep the site running. There are no tracking cookies and no third-party ad cookies. You can disable cookies in your browser settings, though some features may stop working.
                    </p>

                    <h3 className="text-base font-bold text-white mb-2">Third Parties</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        The only external service BrawlLens communicates with is the official Brawl Stars API. We don't work with advertisers, analytics providers, or any other third parties.
                    </p>

                    <h3 className="text-base font-bold text-white mb-2">Young Players</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        Since we collect no personal data at all, BrawlLens is safe for players of any age. There's nothing to worry about here.
                    </p>

                    <h3 className="text-base font-bold text-white mb-2">Changes to This Policy</h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                        If anything changes, we'll update this page and bump the date at the top. Continuing to use the site after an update means you're okay with it.
                    </p>
                </main>
            )}

            {active === "contact" && <ContactSection />}
        </div>
    )
}

function ContactSection() {
    const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" })
    const [submitted, setSubmitted] = useState(false)

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitted(true)
    }

    const inputClass = "w-full bg-[#111113] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors"

    if (submitted) {
        return (
            <main className="py-2 max-w-2xl">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <CheckCircle size={40} className="text-blue-400 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Message sent</h2>
                    <p className="text-sm text-white/40">We'll get back to you within a few days.</p>
                    <button
                        onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "general", message: "" }) }}
                        className="mt-8 text-xs text-white/30 hover:text-white/60 transition-colors"
                    >
                        Send another message
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="py-2 max-w-2xl">
            <h1 className="text-4xl font-black text-white mb-2">Contact</h1>
            <p className="text-sm text-white/30 mb-8">Drop us a line.</p>

            <p className="text-sm text-white/50 leading-relaxed mb-10">
                Found a bug, have a feature request, or want to talk advertising? We read every message. Fill out the form below and we'll get back to you as soon as we can.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-white/30 uppercase tracking-widest">Name</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Your name"
                            className={inputClass}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-white/30 uppercase tracking-widest">Email</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="your@email.com"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/30 uppercase tracking-widest">Subject</label>
                    <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className={inputClass}
                    >
                        <option value="general">General Question</option>
                        <option value="bug">Bug Report</option>
                        <option value="feedback">Feedback</option>
                        <option value="advertising">Advertising</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/30 uppercase tracking-widest">Message</label>
                    <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        placeholder="Tell us what's on your mind..."
                        className={inputClass + " resize-none"}
                    />
                </div>

                <button
                    type="submit"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-400 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
                >
                    <Send size={15} />
                    Send Message
                </button>
            </form>
        </main>
    )
}

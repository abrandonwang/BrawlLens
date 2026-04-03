"use client"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { sendContactEmail } from "@/app/actions/contact"

const sections = [
    { id: "about", label: "About" },
    { id: "privacy-policy", label: "Privacy Policy" },
    { id: "contact", label: "Contact" },
]

const linkBase = "text-xs font-semibold tracking-tight transition-all duration-200 px-3 py-1.5 text-left whitespace-nowrap"
const linkInactive = `${linkBase} text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5`
const linkActive = `${linkBase} bg-red-500 text-white dark:bg-[#FFD400] dark:text-black`

export default function About() {
    return (
        <div className="bg-white flex flex-col overflow-hidden text-zinc-900 dark:bg-black dark:text-white/90">
            <Suspense>
                <AboutPage />
            </Suspense>
        </div>
    )
}

function AboutPage() {
    const searchParams = useSearchParams()
    const [active, setActive] = useState(searchParams.get("section") ?? "about")

    return (
        <main className="flex-1 overflow-y-auto px-8 pt-8 pb-10 lg:px-12 lg:pt-12">
            <div className="flex flex-row gap-1.5 overflow-x-auto scrollbar-none mb-10 pb-1">
                {sections.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActive(id)}
                        className={active === id ? linkActive : linkInactive}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {active === "about" && (
                <article className="space-y-12">
                    <section>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 dark:text-white/30">What is BrawlLens</p>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4 dark:text-white">A stats platform built for serious Brawl Stars players.</h1>
                        <p className="text-zinc-500 text-sm leading-relaxed dark:text-white/40">
                            BrawlLens aggregates live battle data from top-ranked players across six global regions to surface statistics that actually matter in competitive play. No ads, no account required, no clutter. Just fast, accurate data from the game.
                        </p>
                    </section>

                    <section>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-5 dark:text-white/30">Features</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                {
                                    title: "Player Profiles",
                                    desc: "Look up any player by tag to see their trophies, win counts, and a full breakdown of every brawler they own — including rank, power level, gadgets, star powers, gears, and hypercharges.",
                                },
                                {
                                    title: "Map Meta",
                                    desc: "Win rates for every brawler on every map, calculated from real battles. Filter by game mode, search by map name, and drill into per-map brawler rankings to find who is actually strong right now.",
                                },
                                {
                                    title: "Brawler Catalog",
                                    desc: "Browse all brawlers with full stats, rarity, class, star powers, gadgets, and gear descriptions. Filter by rarity or search by name to find exactly what you are looking for.",
                                },
                                {
                                    title: "Leaderboards",
                                    desc: "Global and regional trophy leaderboards updated in near real time. See where the top players stand across every region and track how the competitive landscape shifts each season.",
                                },
                                {
                                    title: "AI Chat",
                                    desc: "Ask anything about the game in plain English. The assistant can look up player stats, recommend brawlers for specific maps, compare win rates, and pull leaderboard data on demand.",
                                },
                                {
                                    title: "Live Rotation",
                                    desc: "Maps currently in the active event rotation are marked in real time so you always know where to focus your meta research today.",
                                },
                            ].map(f => (
                                <div key={f.title} className="bg-black/[0.02] border border-black/[0.06] p-5 dark:bg-white/[0.02] dark:border-white/[0.06]">
                                    <h3 className="text-sm font-bold text-zinc-900 mb-2 dark:text-white">{f.title}</h3>
                                    <p className="text-sm text-zinc-500 leading-relaxed dark:text-white/40">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 dark:text-white/30">Data</p>
                        <p className="text-sm text-zinc-500 leading-relaxed dark:text-white/40">
                            Battle data is collected continuously from the official Brawl Stars API across six regions: US, Europe, Asia, Latin America, Middle East, and Africa. Only matches from players in the top trophy ranges are included, keeping the dataset relevant to competitive play. Aggregated statistics are refreshed regularly so win rates reflect the current meta.
                        </p>
                    </section>

                    <section className="pt-6 border-t border-black/8 dark:border-white/8">
                        <p className="text-xs text-zinc-400 leading-5 dark:text-white/30">
                            This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell. Supercell is not responsible for it.
                        </p>
                        <a
                            href="https://supercell.com/en/fan-content-policy/"
                            className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-[#FFD400] mt-2 hover:underline"
                        >
                            Supercell Fan Content Policy <ArrowUpRight size={12} />
                        </a>
                    </section>
                </article>
            )}

            {active === "privacy-policy" && (
                <article className="space-y-12">
                    <section>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 dark:text-white/30">Privacy Policy</p>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4 dark:text-white">Your data stays yours.</h1>
                        <p className="text-zinc-500 text-sm leading-relaxed dark:text-white/40">
                            BrawlLens does not use trackers, third-party analytics, or persistent cookies. The site exists to show you game data, not to collect information about you.
                        </p>
                    </section>

                    <section>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-5 dark:text-white/30">What we do not collect</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { title: "IP Addresses", desc: "No IP addresses or geolocation data are logged or stored." },
                                { title: "Browser Fingerprints", desc: "No browser type, hardware specs, or device identifiers are collected." },
                                { title: "Behavioral Data", desc: "No click tracking, session recording, or analytics of any kind." },
                                { title: "Personal Identity", desc: "No names, emails, or accounts are required to use the site." },
                            ].map(f => (
                                <div key={f.title} className="bg-black/[0.02] border border-black/[0.06] p-5 dark:bg-white/[0.02] dark:border-white/[0.06]">
                                    <h3 className="text-sm font-bold text-zinc-900 mb-2 dark:text-white">{f.title}</h3>
                                    <p className="text-sm text-zinc-500 leading-relaxed dark:text-white/40">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 dark:text-white/30">Local Storage</p>
                        <p className="text-sm text-zinc-500 leading-relaxed dark:text-white/40">
                            Your theme preference is stored in your browser's local storage so the site remembers your setting between visits. This data never leaves your device and is never transmitted to our servers.
                        </p>
                    </section>
                </article>
            )}

            {active === "contact" && (
                <article>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 dark:text-white/30">Contact</p>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-2 dark:text-white">Get in touch.</h1>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-8 dark:text-white/40">
                        Bug reports, feature requests, and general feedback are all welcome. Typically respond within 48 hours.
                    </p>
                    <ContactForm />
                </article>
            )}

        </main>
    )
}

function ContactForm() {
    const [pending, setPending] = useState(false)
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setPending(true)
        const result = await sendContactEmail(new FormData(e.currentTarget))
        setPending(false)
        setStatus(result.error ? "error" : "success")
    }

    if (status === "success") {
        return (
            <div className="border border-black/10 bg-black/[0.03] p-6 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
                <p className="font-bold text-zinc-900 mb-1 dark:text-white">Message received.</p>
                <p>Thank you for reaching out.</p>
            </div>
        )
    }

    const inputClass = "w-full bg-black/[0.04] border border-black/[0.08] px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-black/20 transition-colors dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-white/20"
    const labelClass = "text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/30"

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className={labelClass}>Name</label>
                    <input name="name" required className={inputClass} />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Email</label>
                    <input name="email" type="email" required className={inputClass} />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className={labelClass}>Type</label>
                <div className="flex gap-2">
                    {["Bug report", "Feature request", "Feedback"].map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name="type" value={t} defaultChecked={t === "Feedback"} className="accent-red-500 dark:accent-[#FFD400]" />
                            <span className="text-xs text-zinc-500 dark:text-white/40">{t}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="space-y-1.5">
                <label className={labelClass}>Message</label>
                <textarea
                    name="message"
                    rows={5}
                    required
                    className={`${inputClass} resize-none`}
                />
            </div>

            <div className="flex items-center gap-4 pt-1">
                <button
                    type="submit"
                    disabled={pending}
                    className="bg-zinc-900 text-white px-4 py-2 text-[13px] font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                    {pending ? "Sending..." : "Send message"}
                </button>
                {status === "error" && (
                    <span className="text-xs text-red-400">An error occurred. Please try again.</span>
                )}
            </div>
        </form>
    )
}

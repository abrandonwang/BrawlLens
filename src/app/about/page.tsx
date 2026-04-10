"use client"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { sendContactEmail } from "@/app/actions/contact"

const sections = [
    { id: "about", label: "About" },
    { id: "privacy-policy", label: "Privacy" },
    { id: "contact", label: "Contact" },
]

const linkBase = "font-mono text-xs transition-all duration-200 px-3 py-1.5 text-left whitespace-nowrap"
const linkInactive = `${linkBase} text-zinc-400 hover:text-zinc-900 dark:text-white/40 dark:hover:text-white`
const linkActive = `${linkBase} text-zinc-900 dark:text-white`

export default function About() {
    return (
        <div className="flex flex-col text-zinc-900 dark:text-white/90">
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
        <main className="flex-1 overflow-y-auto px-8 pt-8 pb-10 lg:px-12 lg:pt-12 font-mono flex flex-col items-center">
            <div className="w-full max-w-xl">
            <div className="flex flex-row gap-0 overflow-x-auto scrollbar-none mb-10 justify-center">
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
                <article className="space-y-8 w-full">
                    <section>
                        <p className="text-xs text-zinc-400 mb-3 dark:text-white/40 text-center">brawllens</p>
                        <p className="text-sm text-zinc-600 leading-6 dark:text-white/60">
                            Battle stats from top-ranked players across 6 regions. No account required, no ads.
                        </p>
                    </section>

                    <section>
                        <p className="text-xs text-zinc-400 mb-3 dark:text-white/40 text-center">features</p>
                        <div className="space-y-2">
                            {[
                                ["player", "Trophies, brawler ranks, gadgets, star powers, gears, hypercharges"],
                                ["map meta", "Win rates per brawler per map from real high-trophy matches"],
                                ["brawlers", "Full catalog — stats, rarity, class, abilities"],
                                ["leaderboards", "Global and regional trophy rankings, updated live"],
                                ["ai chat", "Ask about players, brawler picks, win rates in plain English"],
                                ["rotation", "Active event maps flagged in real time"],
                            ].map(([name, desc]) => (
                                <div key={name} className="grid grid-cols-[100px_1fr] gap-4 text-sm">
                                    <span className="text-zinc-400 dark:text-white/40">{name}</span>
                                    <span className="text-zinc-600 dark:text-white/60">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <p className="text-xs text-zinc-400 mb-3 dark:text-white/40 text-center">data</p>
                        <p className="text-sm text-zinc-600 leading-6 dark:text-white/60">
                            Official Brawl Stars API. Regions: US, EU, Asia, LATAM, ME, Africa. Top trophy ranges only. Refreshed continuously.
                        </p>
                    </section>

                    <section className="pt-6 border-t border-black/8 dark:border-white/8">
                        <p className="text-xs text-zinc-400 leading-5 dark:text-white/40">
                            Not affiliated with or endorsed by Supercell.
                        </p>
                        <a
                            href="https://supercell.com/en/fan-content-policy/"
                            className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-[#FFD400] mt-1 hover:underline"
                        >
                            Fan Content Policy <ArrowUpRight size={11} />
                        </a>
                    </section>
                </article>
            )}

            {active === "privacy-policy" && (
                <article className="space-y-8 w-full">
                    <section>
                        <p className="text-xs text-zinc-400 mb-3 dark:text-white/40 text-center">privacy</p>
                        <p className="text-sm text-zinc-600 leading-6 dark:text-white/60">
                            No trackers, no analytics, no cookies. The site shows game data — nothing is collected about you.
                        </p>
                    </section>

                    <section>
                        <p className="text-xs text-zinc-400 mb-3 dark:text-white/40 text-center">not collected</p>
                        <div className="space-y-2">
                            {[
                                ["ip / location", "Not logged or stored"],
                                ["browser / device", "No fingerprinting"],
                                ["behavior", "No click tracking or session recording"],
                                ["identity", "No account required"],
                            ].map(([name, desc]) => (
                                <div key={name} className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                                    <span className="text-zinc-400 dark:text-white/40">{name}</span>
                                    <span className="text-zinc-600 dark:text-white/60">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <p className="text-xs text-zinc-400 mb-3 dark:text-white/40 text-center">local storage</p>
                        <p className="text-sm text-zinc-600 leading-6 dark:text-white/60">
                            Theme preference stored locally in your browser. Never transmitted to any server.
                        </p>
                    </section>
                </article>
            )}

            {active === "contact" && (
                <article className="w-full">
                    <p className="text-xs text-zinc-400 mb-1 dark:text-white/40 text-center">contact</p>
                    <p className="text-sm text-zinc-600 mb-8 dark:text-white/60">Bug reports, feature requests, feedback. Reply within 48h.</p>
                    <ContactForm />
                </article>
            )}
            </div>
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
            <div className="border border-black/10 p-5 text-sm font-mono text-zinc-500 dark:border-white/10 dark:text-white/50">
                <p className="text-zinc-900 mb-1 dark:text-white">message received.</p>
                <p className="text-xs">reply within 48h.</p>
            </div>
        )
    }

    const inputClass = "w-full bg-transparent border border-black/[0.12] px-3 py-2 text-sm font-mono text-zinc-900 outline-none focus:border-black/30 transition-colors dark:border-white/[0.12] dark:text-white dark:focus:border-white/30"
    const labelClass = "text-xs font-mono text-zinc-400 dark:text-white/40"

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
                            <span className="text-xs text-zinc-500 dark:text-white/60">{t}</span>
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
                    className="border border-black/20 text-zinc-900 px-4 py-2 text-xs font-mono hover:bg-black/5 transition-colors disabled:opacity-40 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
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

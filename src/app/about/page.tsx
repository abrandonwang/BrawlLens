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

const linkBase = "text-xs font-semibold tracking-tight transition-all duration-200 px-3 py-1.5 text-left"
const linkInactive = `${linkBase} text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5`
const linkActive = `${linkBase} bg-red-500 text-white dark:bg-[#FFD400] dark:text-black`

export default function About() {
    return (
        <div className="bg-white h-[calc(100dvh-52px)] flex flex-col lg:flex-row overflow-hidden text-zinc-900 dark:bg-black dark:text-white/90">
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
        <>
            <aside className="w-full lg:w-64 shrink-0 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-black/10 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto px-4 py-3 lg:px-5 lg:pt-10 lg:pb-10 dark:border-white/10">
                <p className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-1 dark:text-white/30">Info</p>
                {sections.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActive(id)}
                        className={active === id ? linkActive : linkInactive}
                    >
                        {label}
                    </button>
                ))}
            </aside>

            <main className="flex-1 overflow-y-auto px-8 pt-6 pb-6">
                <div className="max-w-2xl">

                    {active === "about" && (
                        <article className="space-y-10">
                            <section>
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-3 dark:text-white">About BrawlLens</h1>
                                <p className="text-zinc-500 text-sm leading-relaxed dark:text-white/40">
                                    A specialized statistics platform for Brawl Stars players. No ads, no clutter — just direct access to game data.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/30">Features</h2>
                                {[
                                    { title: "Player Profiles", desc: "Trophies, rankings, and brawler-specific performance metrics." },
                                    { title: "Brawler Catalog", desc: "Star powers, gadgets, and descriptions for every brawler." },
                                    { title: "Map Meta", desc: "Win rate analysis across active maps using global high-rank data." },
                                    { title: "Leaderboards", desc: "Global and regional rankings for competitive tracking." },
                                ].map(f => (
                                    <div key={f.title} className="border-l border-black/10 pl-4 dark:border-white/10">
                                        <h3 className="text-sm font-semibold text-zinc-900 mb-0.5 dark:text-white">{f.title}</h3>
                                        <p className="text-sm text-zinc-500 dark:text-white/40">{f.desc}</p>
                                    </div>
                                ))}
                            </section>

                            <section className="pt-6 border-t border-black/10 dark:border-white/10">
                                <p className="text-xs text-zinc-400 leading-5 dark:text-white/30">
                                    This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it.
                                </p>
                                <a
                                    href="https://supercell.com/en/fan-content-policy/"
                                    className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-[#FFD400] mt-2 hover:underline"
                                >
                                    Fan Content Policy <ArrowUpRight size={12} />
                                </a>
                            </section>
                        </article>
                    )}

                    {active === "privacy-policy" && (
                        <article className="space-y-10">
                            <section>
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-3 dark:text-white">Privacy Policy</h1>
                                <p className="text-zinc-500 text-sm leading-relaxed dark:text-white/40">
                                    BrawlLens does not use trackers, third-party analytics, or persistent cookies.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/30">Data Collection</h2>
                                <div className="border-l border-black/10 pl-4 space-y-1 dark:border-white/10">
                                    {[
                                        "IP addresses or geolocation data",
                                        "Browser or hardware specifications",
                                        "Behavioral analytics or clickstream data",
                                        "Personal identity information",
                                    ].map(item => (
                                        <p key={item} className="text-sm text-zinc-500 dark:text-white/40">{item}</p>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-400 dark:text-white/30">None of the above are collected or stored.</p>
                            </section>

                            <section className="space-y-2">
                                <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/30">Local Storage</h2>
                                <p className="text-sm text-zinc-500 leading-relaxed dark:text-white/40">
                                    Any saved data such as your player tag is stored in your browser's local storage only — never transmitted to our servers.
                                </p>
                            </section>
                        </article>
                    )}

                    {active === "contact" && (
                        <article className="space-y-10">
                            <section>
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-3 dark:text-white">Contact</h1>
                                <p className="text-zinc-500 text-sm leading-relaxed dark:text-white/40">
                                    Feedback and bug reports are welcome. Typically respond within 48 hours.
                                </p>
                            </section>

                            <ContactForm />
                        </article>
                    )}

                </div>
            </main>
        </>
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

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/30">Name</label>
                    <input
                        name="name"
                        required
                        className="w-full bg-black/[0.04] border border-black/[0.08] px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-black/20 transition-colors dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-white/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/30">Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full bg-black/[0.04] border border-black/[0.08] px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-black/20 transition-colors dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-white/20"
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/30">Message</label>
                <textarea
                    name="message"
                    rows={5}
                    required
                    className="w-full bg-black/[0.04] border border-black/[0.08] px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-black/20 transition-colors resize-none dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-white/20"
                />
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    disabled={pending}
                    className="bg-zinc-900 text-white px-4 py-2 text-[13px] font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                    {pending ? "Sending..." : "Submit"}
                </button>
                {status === "error" && (
                    <span className="text-xs text-red-400">An error occurred. Please try again.</span>
                )}
            </div>
        </form>
    )
}

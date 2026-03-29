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

const linkBase = "text-xs font-semibold tracking-tight transition-all duration-200 px-3 py-1.5 rounded text-left"
const linkInactive = `${linkBase} text-white/50 hover:text-white hover:bg-white/5`
const linkActive = `${linkBase} bg-[#FFD400] text-black`

export default function About() {
    return (
        <div className="bg-black h-[calc(100dvh-52px)] flex flex-col lg:flex-row overflow-hidden font-sans antialiased text-white/90">
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
            <aside className="w-full lg:w-64 shrink-0 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 py-5 lg:py-10 px-5 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto">
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

            <main className="flex-1 overflow-y-auto selection:bg-[#FFD400] selection:text-black">
                <div className="max-w-2xl mx-auto py-16 px-8 lg:px-12">
                    
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-[13px] text-white/40 mb-12 border-b border-white/10 pb-4">
                        <span className="hover:text-white/60 cursor-default">BrawlLens</span>
                        <span className="text-white/20">/</span>
                        <span className="text-white/80">{activeSection?.label}</span>
                    </nav>

                    {/* About Section */}
                    {active === "about" && (
                        <article className="space-y-10">
                            <section>
                                <h1 className="text-3xl font-bold tracking-tight mb-6">About BrawlLens</h1>
                                <p className="text-[15px] leading-7 text-white/70 mb-4">
                                    BrawlLens is a specialized statistics platform designed for Brawl Stars players. 
                                    Unlike most trackers, this site prioritizes performance and clarity, removing ads 
                                    and unnecessary visual clutter to provide direct access to game data.
                                </p>
                                <p className="text-[15px] leading-7 text-white/70">
                                    The project is maintained as a free resource for the community, pulling live data 
                                    directly from official channels and independent battle collectors.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Core Features</h2>
                                <div className="space-y-6">
                                    {[
                                        { title: "Player Profiles", desc: "Detailed breakdown of trophies, rankings, and brawler-specific performance metrics." },
                                        { title: "Brawler Catalog", desc: "A clean database of star powers, gadgets, and technical descriptions for every brawler." },
                                        { title: "Map Meta", desc: "Win rate analysis across active maps and modes using global high-rank data." },
                                        { title: "Leaderboards", desc: "Real-time global and regional rankings for competitive tracking." },
                                    ].map(f => (
                                        <div key={f.title}>
                                            <h3 className="text-[15px] font-bold text-white mb-1">{f.title}</h3>
                                            <p className="text-[14px] text-white/50 leading-6">{f.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="pt-6 border-t border-white/10">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-white/30 mb-4">Legal</h2>
                                <p className="text-xs text-white/40 leading-5 italic">
                                    This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell 
                                    and Supercell is not responsible for it. For more information see Supercell’s Fan Content Policy.
                                </p>
                                <a 
                                    href="https://supercell.com/en/fan-content-policy/" 
                                    className="inline-flex items-center gap-1 text-xs text-[#FFD400] mt-3 hover:underline"
                                >
                                    Fan Content Policy <ArrowUpRight size={12} />
                                </a>
                            </section>
                        </article>
                    )}

                    {/* Privacy Section */}
                    {active === "privacy-policy" && (
                        <article className="space-y-10">
                            <section>
                                <h1 className="text-3xl font-bold tracking-tight mb-6">Privacy Policy</h1>
                                <p className="text-[15px] leading-7 text-white/70">
                                    BrawlLens is designed to be as non-intrusive as possible. We do not use trackers, 
                                    third-party analytics, or persistent cookies.
                                </p>
                            </section>

                            <div className="grid grid-cols-1 gap-10">
                                <section>
                                    <h2 className="text-lg font-semibold mb-4 text-white/90">Data Collection</h2>
                                    <p className="text-[14px] text-white/50 leading-relaxed mb-4">
                                        We do not collect or store any of the following information:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-[14px] text-white/50 ml-2">
                                        <li>IP addresses or geolocation data</li>
                                        <li>Browser or hardware specifications</li>
                                        <li>Behavioral analytics or clickstream data</li>
                                        <li>Personal identity information</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-lg font-semibold mb-4 text-white/90">Local Storage</h2>
                                    <p className="text-[14px] text-white/50 leading-relaxed">
                                        Any "saved" data, such as your player tag or favorite brawlers, is stored 
                                        strictly within your browser's local storage. This data is never transmitted 
                                        to our servers and remains entirely under your control.
                                    </p>
                                </section>
                            </div>
                        </article>
                    )}

                    {/* Contact Section */}
                    {active === "contact" && (
                        <article className="space-y-10">
                            <section>
                                <h1 className="text-3xl font-bold tracking-tight mb-6">Contact</h1>
                                <p className="text-[15px] leading-7 text-white/70">
                                    Feedback and bug reports are welcome. I typically respond to inquiries 
                                    within 48 hours.
                                </p>
                            </section>

                            <ContactForm />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 pt-8 border-t border-white/5">
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase mb-2">Technical Issues</h4>
                                    <p className="text-xs text-white/40 leading-5">Please include your player tag and browser version if reporting a visual bug.</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase mb-2">Feature Requests</h4>
                                    <p className="text-xs text-white/40 leading-5">Suggestions for map data visualizations or brawler metrics are highly encouraged.</p>
                                </div>
                            </div>
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
            <div className="bg-white/5 border border-white/10 p-6 rounded text-sm text-white/70">
                <p className="font-bold text-white mb-1">Message received.</p>
                <p>Thank you for reaching out.</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-white/50">Name</label>
                        <input
                            name="name"
                            required
                            className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-white/30 transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-white/50">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-white/30 transition-colors"
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-white/50">Message</label>
                    <textarea
                        name="message"
                        rows={5}
                        required
                        className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-white/30 transition-colors resize-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    disabled={pending}
                    className="bg-white text-black px-4 py-2 text-[13px] font-bold rounded hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                    {pending ? "Sending..." : "Submit Message"}
                </button>
                {status === "error" && (
                    <span className="text-xs text-red-400">An error occurred. Please try again.</span>
                )}
            </div>
        </form>
    )
}
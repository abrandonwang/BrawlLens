"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Send, CheckCircle, ArrowUpRight } from "lucide-react"

const sections = [
    { id: "about", label: "About", sub: "The vision for BrawlLens" },
    { id: "privacy-policy", label: "Privacy", sub: "Data & transparency" },
    { id: "contact", label: "Contact", sub: "Get in touch with us" },
]

export default function About() {
    return (
        <div className="bg-[#f4f4f5] min-h-screen pt-32 pb-20">
            <Suspense>
                <AboutContent />
            </Suspense>
        </div>
    )
}

function AboutContent() {
    const searchParams = useSearchParams()
    const [active, setActive] = useState(searchParams.get("section") ?? "about")

    return (
        <div className="max-w-[1200px] mx-auto px-10 lg:grid lg:grid-cols-[280px_1fr] lg:gap-24">
            
            {/* LEFT SIDE: PROFESSIONAL NAV */}
            <aside className="hidden lg:block sticky top-32 h-fit">
                <div className="space-y-10">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-8">Documentation</h3>
                        <nav className="flex flex-col gap-6">
                            {sections.map(({ id, label, sub }) => (
                                <button
                                    key={id}
                                    onClick={() => setActive(id)}
                                    className={`group text-left about-aside-item ${active === id ? "about-aside-active" : ""}`}
                                >
                                    <p className={`text-sm font-black uppercase tracking-widest transition-colors ${active === id ? "text-zinc-950" : "text-zinc-400 group-hover:text-zinc-600"}`}>
                                        {label}
                                    </p>
                                    <p className="text-[11px] font-medium text-zinc-400 mt-1">{sub}</p>
                                </button>
                            ))}
                        </nav>
                    </div>
                    
                    <div className="pt-10 border-t border-zinc-200">
                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] leading-relaxed">
                            BrawlLens is an independent <br />fan project.
                        </p>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-2xl">
                {active === "about" && (
                    <main className="animate-fade-in">
                        <h1 className="text-6xl font-black tracking-tighter text-zinc-950 mb-6">Designed for <br/>competitive play.</h1>
                        <p className="text-xl text-zinc-500 font-medium leading-relaxed mb-12">
                            BrawlLens was built because we were tired of slow, ad-cluttered stat sites. We wanted something that felt like a professional tool—clean, fast, and accurate.
                        </p>

                        <div className="grid grid-cols-1 gap-12 mb-20">
                            <div className="space-y-4">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-950">01 / Real Time API</h2>
                                <p className="text-zinc-500 leading-relaxed">Everything pulls directly from the official Brawl Stars servers. No delays, no cached data from three days ago.</p>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-950">02 / No Accounts</h2>
                                <p className="text-zinc-500 leading-relaxed">We don't want your email. We don't want your password. Your player tag is the only thing you'll ever need.</p>
                            </div>
                        </div>

                        <a href="https://supercell.com/en/fan-content-policy/" target="_blank" rel="noopener noreferrer" className="p-8 bg-zinc-950 rounded-[32px] text-white flex items-center justify-between group cursor-pointer">
                            <div>
                                <h4 className="text-lg font-bold">Fan Content Policy</h4>
                                <p className="text-zinc-500 text-sm mt-1">Supercell is not responsible for this site.</p>
                            </div>
                            <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                    </main>
                )}

                {active === "privacy-policy" && (
                    <main className="animate-fade-in space-y-12">
                        <h1 className="text-5xl font-black tracking-tighter text-zinc-950">Privacy First.</h1>
                        <div className="prose prose-zinc space-y-8 text-zinc-500 leading-relaxed">
                            <p>We believe that privacy is a fundamental right. On BrawlLens, we have implemented a zero-tracking policy. Here is how we handle your data:</p>
                            
                            <section className="space-y-4">
                                <h3 className="text-zinc-950 font-bold uppercase text-[11px] tracking-widest">Local Storage</h3>
                                <p>When you save a player tag, it is stored exclusively on your device's <code>localStorage</code>. It is never uploaded to our servers.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-zinc-950 font-bold uppercase text-[11px] tracking-widest">Third Party</h3>
                                <p>We do not use Google Analytics, Meta Pixels, or any third-party advertising trackers. Your browsing habits remain your own.</p>
                            </section>
                        </div>
                    </main>
                )}

                {active === "contact" && (
                   <ContactSection />
                )}
            </div>
        </div>
    )
}

function ContactSection() {
    return (
        <main className="animate-fade-in">
            <h1 className="text-5xl font-black tracking-tighter text-zinc-950 mb-6">Let's talk.</h1>
            <p className="text-zinc-500 text-lg mb-12">Whether you found a bug or want to suggest a feature, we're listening.</p>
            
            <form className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <input placeholder="NAME" className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-xs font-black tracking-widest outline-none focus:border-black transition-colors" />
                    <input placeholder="EMAIL" className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-xs font-black tracking-widest outline-none focus:border-black transition-colors" />
                </div>
                <textarea rows={6} placeholder="YOUR MESSAGE" className="w-full bg-white border border-zinc-200 rounded-3xl px-6 py-4 text-xs font-black tracking-widest outline-none focus:border-black transition-colors resize-none" />
                <button className="w-full bg-zinc-950 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all">
                    Send Message
                </button>
            </form>
        </main>
    )
}
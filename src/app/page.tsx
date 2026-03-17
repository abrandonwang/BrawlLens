"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Swords, TrendingUp, Trophy, ArrowRight } from "lucide-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  const router = useRouter()
  const [userInput, setUserInput] = useState("")
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`)
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  useEffect(() => {
    gsap.fromTo(".hero-animate", 
        { opacity: 0, y: 40 }, 
        { opacity: 1, y: 0, duration: 1, ease: "power4.out", stagger: 0.1 }
    )
    const cards = cardsRef.current?.querySelectorAll<HTMLElement>(".feature-card")
    if (!cards) return
    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: i * 0.1,
          scrollTrigger: { trigger: card, start: "top 88%", toggleActions: "play none none none" }
        }
      )
    })
  }, [])

  const handleSearch = () => {
    const tag = userInput.trim().replace("#", "").toUpperCase()
    if (tag) router.push(`/player/${tag}`)
  }

  return (
    <main className="relative pt-64 pb-16 spotlight-bg">
      <div className="max-w-[1440px] mx-auto px-10">

        {/* HERO SECTION */}
        <section className="max-w-4xl mx-auto text-center space-y-12 mb-64">
          <div className="space-y-4 hero-animate">
            <h1 className="text-7xl md:text-[140px] font-black tracking-[-0.08em] leading-[0.75] text-zinc-950">
              Brawl Stars <span className="text-blue-500">made clear.</span>
            </h1>
          </div>

          <p className="hero-animate text-2xl text-zinc-500 font-medium max-w-xl mx-auto leading-relaxed">
            Look up any player, track your brawlers, <br />and see what the best in the world are doing.
          </p>

          {/* SEARCH */}
          <div className="hero-animate relative max-w-[600px] mx-auto pt-10">
            <div className="flex items-center bg-white border border-zinc-200 rounded-2xl px-5 py-3 shadow-sm focus-within:border-zinc-400 transition-all duration-300">
              <span className="text-zinc-400 font-black text-xl mr-2">#</span>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter player tag"
                className="flex-1 bg-transparent py-2 text-lg font-bold outline-none text-zinc-950 placeholder:text-zinc-300 tracking-tight"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all duration-300 shrink-0"
              >
                Search
              </button>
            </div>
            <p className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] text-center">
              Tap your profile icon in-game to find your tag 
            </p>
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section ref={cardsRef} className="flex flex-col gap-6">
          {[
            { id: "01", title: "Brawlers",     desc: "Every brawler, every stat — powers, gadgets, and hidden values all in one place.", icon: Swords     },
            { id: "02", title: "Meta",         desc: "Win rates and pick rates pulled from live global matches, updated constantly.",      icon: TrendingUp },
            { id: "03", title: "Leaderboards", desc: "Track the top players worldwide and drill down by individual brawler.",             icon: Trophy     },
          ].map((item) => (
            <div key={item.id} className="feature-card opacity-0 group relative bg-zinc-100 hover:bg-zinc-200/60 border border-zinc-200 hover:border-zinc-300 rounded-[32px] px-12 py-12 flex items-center gap-10 cursor-pointer transition-all duration-500 overflow-hidden">

              {/* Icon */}
              <div className="w-16 h-16 rounded-3xl bg-blue-500 flex items-center justify-center shrink-0 shadow-xl shadow-blue-500/25 group-hover:scale-105 transition-transform duration-500">
                <item.icon size={28} className="text-white" />
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3 className="text-3xl font-black tracking-tight text-zinc-950">{item.title}</h3>
                <p className="text-base font-medium text-zinc-500 mt-2 leading-relaxed max-w-lg">{item.desc}</p>
              </div>

              {/* Arrow */}
              <ArrowRight size={22} className="relative shrink-0 text-zinc-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />

            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
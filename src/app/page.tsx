"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react";
import ScrambleText from "@/components/ScrambleText"
import ThreeScene from "@/components/ThreeScene"

const exampleTags = ["YP90U0YL", "2PP8LCQG", "QLCCRG20", "9RULJP8V"]

export default function Home() {
  const router = useRouter();
  const [userInput, setUserInput] = useState("");
  const [playerData, setPlayerData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [attackTick, setAttackTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % exampleTags.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  async function handleSearch() {
    if (!userInput.trim()) return;
    setPlayerData(null);
    setNotFound(false);
    try {
      const response = await fetch(`/api/player?tag=${userInput}`);
      const data = await response.json();
      if (data.reason) {
        setNotFound(true);
      } else {
        setPlayerData(data);
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
      setNotFound(true);
    }
  }

  return (
    <div className="w-full px-6 pt-16 pb-12 flex flex-col items-center text-center">
      <ThreeScene attack={attackTick} />
      <div className="max-w-3xl mx-auto mb-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 mb-4">
              Improve Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Brawl Stars</span> Experience
          </h1>
          <p className="text-lg text-gray-500">Track your progress. Master your picks.</p>
      </div>
      <div className="max-w-lg mx-auto text-center">
        <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-3">Player Tag</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="relative flex items-center bg-white border-2 border-gray-300 rounded-xl shadow-sm focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all">
                <span className="text-lg font-bold text-blue-500 pl-4 select-none">#</span>
                {userInput === "" && (
                    <span className="absolute left-10 text-gray-400 font-semibold pointer-events-none">
                        <ScrambleText texts={exampleTags} />
                    </span>
                )}
                <input
                    className="text-base font-semibold tracking-wide py-3 px-3 w-56 sm:w-60 outline-none bg-transparent"
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                />
            </div>
            <button
                className="w-full sm:w-auto py-3 px-7 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold tracking-wide rounded-xl shadow-md shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                onClick={handleSearch}
            >
                SAVE
            </button>
        </div>
      </div>
      <button
        onClick={() => setAttackTick(t => t + 1)}
        className="fixed bottom-50 right-64 w-20 h-20 rounded-full cursor-pointer
          bg-gradient-to-b from-red-400 to-red-600
          border-4 border-red-800
          shadow-[0_6px_0_#7f1d1d,0_0_24px_rgba(239,68,68,0.5)]
          active:shadow-[0_2px_0_#7f1d1d,0_0_24px_rgba(239,68,68,0.5)]
          active:translate-y-1
          transition-all flex items-center justify-center
          text-white text-3xl font-black select-none z-50"
      >
      </button>
      {playerData && (
        <div className="mt-6 w-full max-w-sm animate-[slideUp_0.35s_ease-out]">
          <div className="bg-white rounded-2xl border border-black/6 shadow-xl shadow-black/8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-black text-lg leading-tight">{playerData.name}</p>
                <p className="text-blue-100 text-xs font-semibold tracking-wide mt-0.5">#{userInput.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-black text-xl">{playerData.trophies.toLocaleString()}</p>
                <p className="text-blue-100 text-xs font-semibold mt-0.5">trophies</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <button
                onClick={() => router.push(`/player/${userInput}`)}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold tracking-widest rounded-xl shadow-md shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                VIEW PROFILE →
              </button>
            </div>
          </div>
        </div>
      )}
      {notFound && (
          <div className="text-center px-6 py-8 animate-[slideUp_0.35s_ease-out]">
              <p className="inline-block text-sm font-semibold text-red-500 bg-red-50 px-5 py-2.5 rounded-xl border border-red-200">
                  Player not found. Check the tag and try again.
              </p>
          </div>
      )}
    </div>
  );
}

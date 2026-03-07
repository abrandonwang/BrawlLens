"use client"

// YP90U0YL

import { PlayerBrawler } from "@/types/brawler";
import BrawlerCard from "@/components/BrawlerCard"; 
import { useState } from "react";

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [playerData, setPlayerData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

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
    <>
      <div className = "hero-section p-8 bg-transparent text-graphite text-center">
        <h1 className = "text-4xl font-bold mb-4">Improve Your <span className = "text-blue-400">Brawl Stars</span> Experience</h1>
        <p className = "text-lg">Track your progress. Master your picks.</p>
      </div>
      <div className = "search-section p-8 bg-transparent text-graphite text-center">
        <h2 className = "text-2xl font-semibold mb-4">Progress Tracking</h2>
        <p className = "mb-4">Track trophies, battles, brawler progress, and club activity in real time</p>
        <p className = "text-sm text-blue-500 font-bold">PLAYER TAG</p>
        <span className="inline-flex items-center border-2 border-blue-300 focus-within:border-blue-500 rounded mr-2 overflow-hidden">
          <span className="text-blue-500 font-bold px-3 py-1.5 select-none">#</span>
          <input
            className="py-1.5 font-bold outline-none w-100"
            type="text"
            placeholder="A0A0A0A0"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
        </span>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" onClick={handleSearch}>SAVE</button>
      </div>
      {playerData && (
        <div className="fade-slide-in pb-8 px-8 bg-transparent text-graphite text-center flex flex-row items-center justify-center gap-4">
          <p className="text-sm font-semibold">are you {playerData.name}?</p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">GO</button>
        </div>
      )}
      {notFound && (
        <div className="fade-slide-in pb-8 px-8 text-center">
          <p className="text-sm font-semibold text-red-500">Player not found. Check the tag and try again.</p>
        </div>
      )}
    </>
  );
}

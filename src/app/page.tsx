"use client"

// YP90U0YL

import { PlayerBrawler } from "@/types/brawler";
import BrawlerCard from "@/components/BrawlerCard"; 
import { useEffect, useState } from "react";

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!userInput.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/player?tag=${userInput}`);
      const data = await response.json();
      setPlayerData(data);
    } catch (error) {
      console.error("Error fetching player data:", error);
    } finally {
      setLoading(false);
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
      {loading && <p>Loading...</p>} 
      {playerData && (
        <div>
          <h2>Player Data</h2>
          <p>Name: {playerData.name}</p>
          <p>Tag: {playerData.tag}</p>
          <p>Trophies: {playerData.trophies}</p>
          <p>Prestige: {playerData.totalPrestigeLevel}</p>
          {playerData.brawlers?.map((brawler: PlayerBrawler) => (
              <BrawlerCard key={brawler.id} {...brawler} />
          ))}
        </div>
      )}
    </>
  );
}

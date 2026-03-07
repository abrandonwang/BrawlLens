"use client"

import { PlayerBrawler } from "@/types/brawler";
import BrawlerCard from "@/components/BrawlerCard"; 
import { useEffect, useState } from "react";

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
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
      <h1>Brawl Tracker</h1>
      <p>Welcome to Brawl Tracker!</p>

      <input type = "text" placeholder = "Enter player tag" value = {userInput} onChange = {(e) => setUserInput(e.target.value)} />
      <button onClick = {handleSearch}>Search</button>
      {loading && <p>Loading...</p>} 
      {playerData && (
        <div>
          <h2>Player Data</h2>
          <p>Name: {playerData.name}</p>
          <p>Tag: {playerData.tag}</p>
          <p>Trophies: {playerData.trophies}</p>
          <p>Prestige: {playerData.totalPrestigeLevel}</p>
          {playerData.brawlers.map((brawler: PlayerBrawler) => (
              <BrawlerCard key={brawler.id} {...brawler} />
          ))} 
        </div>
      )}
    </>
  );
}

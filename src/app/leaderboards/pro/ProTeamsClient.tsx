"use client"

import {
  FeatureCardRail,
  LeaderboardBoard,
  LeaderboardHero,
  LeaderboardPageShell,
  professionalTeamCards,
} from "../LeaderboardDpmShell"

export default function ProTeamsClient() {
  return (
    <LeaderboardPageShell active="pro">
      <LeaderboardHero
        title="Pro Teams"
        description={`Featured competitive Brawl Stars rosters tracked across ${professionalTeamCards.length} regions.`}
      />

      <LeaderboardBoard>
        <FeatureCardRail cards={professionalTeamCards} />
      </LeaderboardBoard>
    </LeaderboardPageShell>
  )
}

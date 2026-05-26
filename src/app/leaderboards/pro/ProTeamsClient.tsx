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
        description={`Track the competitive rosters BrawlLens follows — ${professionalTeamCards.length} teams featured across regions. Open a team for player breakdowns.`}
      />

      <LeaderboardBoard>
        <FeatureCardRail cards={professionalTeamCards} />
      </LeaderboardBoard>
    </LeaderboardPageShell>
  )
}

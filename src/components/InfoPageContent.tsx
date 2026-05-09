"use client"

import { useState, type ReactNode, type SyntheticEvent } from "react"
import { sendContactEmail } from "@/app/actions/contact"

type InfoItem = {
  title: string
  summary: string
  body: ReactNode
}

type InfoGroup = {
  title: string
  items: InfoItem[]
}

const infoGroups: InfoGroup[] = [
  {
    title: "What the product tracks",
    items: [
      {
        title: "Leaderboards",
        summary: "Player, club, and brawler trophy ladders.",
        body: (
          <InfoList
            items={[
              "Player rankings are ordered by trophy snapshots from the public leaderboard data.",
              "Club rankings use total club trophies, then add compact enrichment like members, average trophies, top member, prestige, and update age when available.",
              "Brawler rankings show the highest trophy players for a selected brawler and estimate non-top-200 placement with percentile-style context where the API allows it.",
            ]}
          />
        ),
      },
      {
        title: "Brawlers",
        summary: "Catalog metadata plus tracked performance stats.",
        body: (
          <InfoList
            items={[
              "Static metadata covers names, rarities, classes, ability text, gadgets, star powers, gears, hypercharges, and icons.",
              "Performance rows use tracked battle aggregates. Win rate and pick rate are not hand-authored labels.",
              "Tier labels are derived from win rate and sample volume so low-data rows do not look stronger than they are.",
            ]}
          />
        ),
      },
      {
        title: "Maps",
        summary: "Live rotation context and map-level brawler data.",
        body: (
          <InfoList
            items={[
              "The maps page combines layout metadata, mode labels, observed battle volume, and live rotation markers.",
              "The spotlight map is the map with the most tracked battles in the current data, not a subjective recommendation.",
              "Per-map brawler tables aggregate picks and wins before calculating win rate.",
            ]}
          />
        ),
      },
      {
        title: "Player profiles",
        summary: "Public account stats, brawler lists, clubs, and recent battles.",
        body: (
          <InfoList
            items={[
              "Profiles use public player data and recent battle logs for current context.",
              "Prestige, peak brawlers, club links, and battle rows appear only when the upstream data includes enough information.",
              "Team quality labels should be read as formulas based on battle context, not as proof that a player made the correct decision.",
            ]}
          />
        ),
      },
    ],
  },
  {
    title: "Metric rules",
    items: [
      {
        title: "Win rate",
        summary: "Wins divided by picks after counts are aggregated.",
        body: (
          <>
            <Formula>wins / picks * 100</Formula>
            <p>
              Counts are summed before the rate is calculated. A row with 10 picks does not receive the same influence
              as a row with 1,000 picks.
            </p>
          </>
        ),
      },
      {
        title: "Pick rate",
        summary: "A brawler's picks compared with the eligible tracked pool.",
        body: (
          <>
            <Formula>brawler picks / total eligible picks * 100</Formula>
            <p>
              Pick rate is a popularity and confidence signal. It does not mean the brawler is stronger by itself.
            </p>
          </>
        ),
      },
      {
        title: "Tier score",
        summary: "A compact score built from win rate, sample size, and stability.",
        body: (
          <InfoList
            items={[
              "Win rate is the primary input.",
              "Volume uses a softened/log-style contribution so popularity matters without dominating.",
              "Stability rewards brawlers that qualify across more than one slice of the data.",
              "Rows with very low samples are guarded so one lucky batch does not become the top recommendation.",
            ]}
          />
        ),
      },
      {
        title: "Leaderboard placement",
        summary: "Top rows use true rank; non-top rows use calculated context.",
        body: (
          <p>
            When a player or brawler is not in a visible top list, BrawlLens estimates context from available ordered
            data rather than showing a blank dash. The label is meant to be directional, not a permanent official rank.
          </p>
        ),
      },
    ],
  },
  {
    title: "Data quality",
    items: [
      {
        title: "Freshness",
        summary: "Different surfaces update on different rhythms.",
        body: (
          <InfoList
            items={[
              "Static brawler metadata changes only when the source catalog changes.",
              "Leaderboards depend on public ranking snapshots.",
              "Tracked brawler and map aggregates depend on collected battle rows.",
              "Recent battle rows can shift faster than season-level rankings.",
            ]}
          />
        ),
      },
      {
        title: "Empty states",
        summary: "Usually a filter or sample-size issue, not a broken page.",
        body: (
          <p>
            If a table is empty, the selected map, mode, rarity, class, region, or minimum-pick filter may not have
            enough matching data. Clearing filters is the fastest check.
          </p>
        ),
      },
      {
        title: "Interpretation",
        summary: "Stats compare signals; they do not remove game context.",
        body: (
          <p>
            A high win rate can come from map shape, mode, team composition, player skill, matchup pool, or sample size.
            Use the number as a starting signal, then inspect the surrounding columns.
          </p>
        ),
      },
    ],
  },
  {
    title: "Privacy and contact",
    items: [
      {
        title: "Privacy",
        summary: "Most of the app uses public game data and local UI state.",
        body: (
          <InfoList
            items={[
              "No account is required for public lookup and rankings.",
              "Player searches request public game data for the searched tag.",
              "Small interface preferences can be stored locally in the browser.",
              "Contact form submissions use the email you provide so a reply can be sent.",
            ]}
          />
        ),
      },
      {
        title: "Contact",
        summary: "Send bugs, confusing stats, missing data, or design notes.",
        body: <ContactForm />,
      },
    ],
  },
]

export function AboutContent() {
  return (
    <main className="bl-doc-shell">
      <section className="bl-doc-title" aria-labelledby="about-title">
        <h1 id="about-title">About</h1>
      </section>

      <div className="bl-doc-groups">
        {infoGroups.map(group => (
          <section
            key={group.title}
            id={slug(group.title)}
            className="bl-doc-group"
            aria-labelledby={`${slug(group.title)}-title`}
          >
            <h2 id={`${slug(group.title)}-title`}>{group.title}</h2>
            <div className="bl-doc-rows">
              {group.items.map((item, index) => (
                <details key={item.title} className="bl-doc-row" open={index === 0}>
                  <summary>
                    <span className="bl-doc-row-title">{item.title}</span>
                    <span className="bl-doc-row-summary">{item.summary}</span>
                  </summary>
                  <div className="bl-doc-row-body">{item.body}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function InfoList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function Formula({ children }: { children: ReactNode }) {
  return <code className="bl-doc-formula">{children}</code>
}

function ContactForm() {
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const startedAt = useState(() => Date.now())[0]

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (Date.now() - startedAt < 1500) {
      setStatus("success")
      return
    }

    setPending(true)
    const result = await sendContactEmail(new FormData(e.currentTarget))
    setPending(false)

    if (result.error) {
      setErrorMessage(result.error)
      setStatus("error")
      return
    }

    setStatus("success")
  }

  if (status === "success") {
    return <p className="bl-doc-status">Message received. Thanks, it is in the inbox now.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="bl-doc-form">
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </label>

      <label>
        <span>Message</span>
        <textarea name="message" rows={4} placeholder="What should BrawlLens fix or add?" required />
      </label>

      {status === "error" && <p className="bl-doc-error">{errorMessage}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Sending" : "Send message"}
      </button>
    </form>
  )
}

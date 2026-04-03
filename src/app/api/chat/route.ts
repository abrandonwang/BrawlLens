import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const SYSTEM_PROMPT = `You are BrawlLens AI, an assistant built into BrawlLens — a Brawl Stars analytics platform powered by real battle data from top-ranked players across 6 regions.

You have tools to look up real win rate data. Always use them when asked about brawler performance, map stats, or win rates — never guess or make up numbers.

When a user mentions a player tag (starting with # or alphanumeric that looks like a tag), tell them you can look it up and suggest they visit /player/[tag].
When they ask about brawlers, suggest /brawlers or /brawlers/[id].
When they ask about maps or modes, suggest /meta.
When they ask about leaderboards or rankings, use the get_leaderboard tool to fetch live data, then suggest /leaderboards for the full list.

Formatting rules — always follow these:
- Use **bold** for brawler names, mode names, and key terms
- Use bullet points for lists of brawlers, tips, or options
- Separate distinct topics into short paragraphs
- Always include at least one relevant link using markdown link syntax, e.g. [View Shelly](/brawlers/16000000) or [See Maps](/meta) or [Leaderboards](/leaderboards)
- Links should be natural and placed in context, not just appended at the end
- Keep responses concise — 3 to 6 sentences or equivalent bullets per topic
- Be direct and helpful like a knowledgeable teammate, not a formal assistant
- When presenting win rate data, mention the pick count so the user knows how statistically significant it is
- Sentences should always end with a period, exclamation mark, or question mark — never an ellipsis, and should have a space after it. Never end a sentence with a colon or dash.`


const tools: Anthropic.Tool[] = [
  {
    name: "get_map_brawler_stats",
    description: "Get real win rates and pick counts for all brawlers on a specific map. Use this whenever asked about brawler performance or best picks on a map.",
    input_schema: {
      type: "object" as const,
      properties: {
        map_name: { type: "string", description: "The map name to look up (partial match works)" }
      },
      required: ["map_name"]
    }
  },
  {
    name: "get_brawler_stats",
    description: "Get win rates for a specific brawler across all maps. Use this when asked how a brawler performs generally or which maps they excel on.",
    input_schema: {
      type: "object" as const,
      properties: {
        brawler_name: { type: "string", description: "The brawler name to look up (partial match works)" }
      },
      required: ["brawler_name"]
    }
  },
  {
    name: "get_all_maps",
    description: "Get all available maps with their game modes and battle counts. Use this to answer questions about what maps exist, or to find the correct name of a map before calling get_map_brawler_stats.",
    input_schema: {
      type: "object" as const,
      properties: {}
    }
  },
  {
    name: "get_leaderboard",
    description: "Get the top players for a region's trophy leaderboard. Use this when asked about top players, rankings, or who is leading globally or in a specific region.",
    input_schema: {
      type: "object" as const,
      properties: {
        region: { type: "string", description: "Region code: global, US, KR, BR, DE, or JP. Default to global if unspecified." },
        limit: { type: "number", description: "Number of top players to return (default 10, max 50)" }
      },
      required: ["region"]
    }
  },
  {
    name: "get_player_info",
    description: "Get basic info about a player by their tag, including their top brawlers and recent performance. Use this when a user mentions a player tag or asks about a specific player's stats.",
    input_schema: {
      type: "object" as const,
      properties: {
        player_tag: { type: "string", description: "The player's tag, starting with # (e.g. #123ABC)" }
      },
      required: ["player_tag"]
    }
  },
]

async function executeTool(name: string, input: Record<string, string>): Promise<string> {
  if (name === "get_map_brawler_stats") {
    const { data, error } = await supabase
      .from("map_brawler_stats")
      .select("map, brawler_name, picks, wins, win_rate")
      .ilike("map", `%${input.map_name}%`)
      .order("picks", { ascending: false })
      .limit(60)

    if (error) return `Error fetching data: ${error.message}`
    if (!data?.length) return `No data found for map matching "${input.map_name}".`

    const mapName = data[0].map
    const lines = data.map(r =>
      `${r.brawler_name}: ${r.win_rate}% win rate, ${r.picks} picks`
    ).join("\n")
    return `Win rates on ${mapName}:\n${lines}`
  }

  if (name === "get_brawler_stats") {
    const { data, error } = await supabase
      .from("map_brawler_stats")
      .select("map, brawler_name, picks, wins, win_rate")
      .ilike("brawler_name", `%${input.brawler_name}%`)
      .order("picks", { ascending: false })
      .limit(50)

    if (error) return `Error fetching data: ${error.message}`
    if (!data?.length) return `No data found for brawler matching "${input.brawler_name}".`

    const brawlerName = data[0].brawler_name
    const lines = data.map(r =>
      `${r.map}: ${r.win_rate}% win rate, ${r.picks} picks`
    ).join("\n")
    return `${brawlerName} stats across maps:\n${lines}`
  }

  if (name === "get_all_maps") {
    const { data, error } = await supabase
      .from("map_stats")
      .select("map, mode, battle_count")
      .order("battle_count", { ascending: false })

    if (error) return `Error fetching data: ${error.message}`
    if (!data?.length) return "No map data available."

    return data.map(r => `${r.map} (${r.mode}): ${r.battle_count} battles`).join("\n")
  }

  if (name === "get_leaderboard") {
    const region = input.region?.toLowerCase() || "global"
    const limit = Math.min(Number(input.limit) || 10, 50)
    const { data, error } = await supabase
      .from("leaderboards")
      .select("rank, player_name, player_tag, trophies, club_name")
      .eq("region", region)
      .order("rank", { ascending: true })
      .limit(limit)

    if (error) return `Error fetching leaderboard: ${error.message}`
    if (!data?.length) return `No leaderboard data found for region "${region}".`

    const lines = data.map(r =>
      `#${r.rank} ${r.player_name} (${r.player_tag}) — ${r.trophies.toLocaleString()} trophies${r.club_name ? ` [${r.club_name}]` : ""}`
    ).join("\n")
    return `Top ${data.length} players in ${region.toUpperCase()} leaderboard:\n${lines}`
  }

  if (name === "get_player_info") {
  }

  return "Unknown tool"
}

type AssistantBlock = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, string> }

async function runStream(
  messages: Anthropic.MessageParam[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  depth = 0
): Promise<void> {
  if (depth > 5) return

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  })

  const assistantContent: AssistantBlock[] = []
  const toolUseBlocks: { id: string; name: string; input: Record<string, string> }[] = []
  let currentToolUse: { id: string; name: string; inputJson: string } | null = null

  for await (const event of stream) {
    if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        currentToolUse = { id: event.content_block.id, name: event.content_block.name, inputJson: "" }
        assistantContent.push({ type: "tool_use", id: event.content_block.id, name: event.content_block.name, input: {} })
      } else if (event.content_block.type === "text") {
        assistantContent.push({ type: "text", text: "" })
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        controller.enqueue(encoder.encode(event.delta.text))
        const last = assistantContent[assistantContent.length - 1]
        if (last?.type === "text") last.text += event.delta.text
      } else if (event.delta.type === "input_json_delta" && currentToolUse) {
        currentToolUse.inputJson += event.delta.partial_json
      }
    } else if (event.type === "content_block_stop" && currentToolUse) {
      const parsed = JSON.parse(currentToolUse.inputJson || "{}")
      const block = assistantContent.find(b => b.type === "tool_use" && b.id === currentToolUse!.id)
      if (block?.type === "tool_use") block.input = parsed
      toolUseBlocks.push({ id: currentToolUse.id, name: currentToolUse.name, input: parsed })
      currentToolUse = null
    }
  }

  const finalMsg = await stream.finalMessage()

  if (finalMsg.stop_reason === "tool_use" && toolUseBlocks.length > 0) {
    const toolResults = await Promise.all(
      toolUseBlocks.map(async tb => ({
        type: "tool_result" as const,
        tool_use_id: tb.id,
        content: await executeTool(tb.name, tb.input)
      }))
    )

    const hasText = assistantContent.some(b => b.type === "text" && b.text.trim())
    if (hasText) controller.enqueue(encoder.encode("\n\n"))

    await runStream(
      [
        ...messages,
        { role: "assistant", content: assistantContent },
        { role: "user", content: toolResults },
      ],
      controller,
      encoder,
      depth + 1
    )
  }
}

export async function POST(request: Request) {
  const { messages } = await request.json()
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      await runStream(messages, controller, encoder)
      controller.close()
    }
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  })
}

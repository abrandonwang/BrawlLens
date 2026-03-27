import Anthropic from "@anthropic-ai/sdk"
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
    const { messages } = await request.json();

    const stream = await client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: "your system prompt here",
        messages: messages,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
        async start(controller) {
            for await (const event of stream) {
                if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                    controller.enqueue(encoder.encode(event.delta.text));
                }
            }
            controller.close();
        }
    })

    return new Response(readable, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8"
        },
    });
}

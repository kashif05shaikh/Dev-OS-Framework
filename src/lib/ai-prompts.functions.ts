import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Mode = "improve" | "generate";

export const craftPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { mode: Mode; text: string; category?: string }) => {
    const mode: Mode = input?.mode === "generate" ? "generate" : "improve";
    const text = String(input?.text ?? "").trim();
    if (!text) throw new Error("Write something first.");
    if (text.length > 6000) throw new Error("That prompt is too long (6000 characters max).");
    return { mode, text, category: String(input?.category ?? "general").slice(0, 40) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const system =
      data.mode === "generate"
        ? "You are a prompt engineer. Write one high-quality, reusable prompt for the user's described task. Include role, context, constraints and desired output format. Return ONLY the prompt text, no commentary, no markdown fences."
        : "You are a prompt engineer. Rewrite the user's prompt so it is clearer, more specific and more reliable. Keep their intent and any placeholders. Return ONLY the improved prompt text, no commentary, no markdown fences.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Category: ${data.category}\n\n${data.text}` },
        ],
      }),
    });

    if (response.status === 429) throw new Error("AI rate limit reached — try again in a moment.");
    if (response.status === 402)
      throw new Error("AI credits exhausted. Add credits in Settings → Plans & credits.");
    if (!response.ok) {
      const body = await response.text();
      console.error(`AI gateway error [${response.status}]: ${body}`);
      throw new Error("The AI service failed. Please try again.");
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("The AI returned an empty response.");
    return { text: content };
  });
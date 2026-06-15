/**
 * Exa Web Search — grounded live data for agents.
 * Fails gracefully: returns "" on any error so the pipeline never crashes.
 */

import Exa from "exa-js";

let client: Exa | null = null;

function getClient(): Exa | null {
  if (client) return client;
  const key = process.env.EXA_API_KEY;
  if (!key) {
    console.warn("[exa] EXA_API_KEY is not set — web search disabled");
    return null;
  }
  client = new Exa(key);
  return client;
}

function truncate(text: string, maxLen = 600): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

export async function getTodayContext(): Promise<string> {
  try {
    const raw = await searchWeb(
      "Singapore weather today, current date and day of week, and any public holiday or major event happening in Singapore today"
    );
    if (!raw) return "";
    // Truncate to ~200 chars
    return raw.length > 200 ? raw.slice(0, 200).trimEnd() + "…" : raw;
  } catch {
    return "";
  }
}

export async function searchWeb(query: string): Promise<string> {
  try {
    const exa = getClient();
    if (!exa) return "";

    // Prefer exa.answer for a concise cited answer
    try {
      const answerRes = await (exa as any).answer(query);
      if (answerRes?.answer) {
        return truncate(answerRes.answer);
      }
    } catch {
      // fallback to search
    }

    // Fallback: exa.search with highlights
    const searchRes = await exa.search(query, {
      type: "auto",
      contents: { highlights: true },
    } as any);

    const highlights = (searchRes.results ?? [])
      .flatMap((r: any) => r.highlights ?? [])
      .join(" ");

    return truncate(highlights || "");
  } catch (e) {
    console.error("[exa] searchWeb error:", e);
    return "";
  }
}

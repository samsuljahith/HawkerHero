/**
 * Mem0 persistent memory — remembers business context across sessions.
 * Uses Mem0 Platform (managed cloud). Fails gracefully on error.
 *
 * API pattern: import MemoryClient from 'mem0ai';
 * Methods: client.add(messages, { user_id }), client.search(query, { filters: { user_id } })
 */

import MemoryClient from "mem0ai";

let client: MemoryClient | null = null;

function getClient(): MemoryClient | null {
  if (client) return client;
  const key = process.env.MEM0_API_KEY;
  if (!key) {
    console.warn("[mem0] MEM0_API_KEY is not set — memory disabled");
    return null;
  }
  client = new MemoryClient({ apiKey: key });
  return client;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "business";
}

/**
 * Retrieve prior context for this business from Mem0.
 * Returns a short string summary, or "" if none / on error.
 */
export async function getBusinessMemory(businessName: string): Promise<string> {
  try {
    const mem0 = getClient();
    if (!mem0) return "";

    const userId = toSlug(businessName);
    const results: any = await mem0.search(businessName, {
      user_id: userId,
    });

    // v3 returns { results: [...] } or an array directly
    const items = results?.results || results || [];
    if (!Array.isArray(items) || items.length === 0) return "";

    const memories = items
      .slice(0, 5)
      .map((r: any) => r.memory || r.content || r.text || "")
      .filter(Boolean)
      .join(" | ");

    return memories.slice(0, 800) || "";
  } catch (e) {
    console.error("[mem0] getBusinessMemory error:", e);
    return "";
  }
}

/**
 * Save business context to Mem0 for future visits.
 */
export async function saveBusinessMemory(
  businessName: string,
  content: string
): Promise<void> {
  try {
    const mem0 = getClient();
    if (!mem0) return;

    const userId = toSlug(businessName);
    await mem0.add([{ role: "user", content }], { user_id: userId });
  } catch (e) {
    console.error("[mem0] saveBusinessMemory error:", e);
    // Non-blocking, don't throw
  }
}

/**
 * GET /api/history?businessId=...  — load history for a business
 * POST /api/history                — save a history entry
 *
 * History is stored in Mem0 per business (user_id = "hawkerhero-history-{businessId}").
 * Each entry is a JSON object with type, timestamp, summary, and data.
 */

import { NextRequest, NextResponse } from "next/server";
import MemoryClient from "mem0ai";

function getClient(): MemoryClient | null {
  const key = process.env.MEM0_API_KEY;
  if (!key) return null;
  return new MemoryClient({ apiKey: key });
}

function historyUserId(businessId: string): string {
  return `hawkerhero-history-${businessId}`;
}

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ entries: [] });
  }

  try {
    const mem0 = getClient();
    if (!mem0) return NextResponse.json({ entries: [] });

    const results: any = await mem0.search("history entries", {
      user_id: historyUserId(businessId),
    });

    const items = results?.results || results || [];
    const entries: any[] = [];

    for (const item of items) {
      const text = item.memory || item.content || item.text || "";
      // Try to parse as JSON history entry
      try {
        const parsed = JSON.parse(text);
        if (parsed.type && parsed.timestamp) {
          entries.push(parsed);
        }
      } catch {
        // Not a JSON entry — could be a raw memory
        if (text.length > 10) {
          entries.push({
            type: "memory",
            timestamp: item.created_at || Date.now(),
            summary: text.slice(0, 200),
          });
        }
      }
    }

    // Sort newest first
    entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return NextResponse.json({ entries });
  } catch (e: any) {
    console.error("[history] GET error:", e);
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { businessId, entry } = await req.json();
    if (!businessId || !entry) {
      return NextResponse.json({ error: "businessId and entry required" }, { status: 400 });
    }

    const mem0 = getClient();
    if (!mem0) return NextResponse.json({ ok: true }); // graceful if no Mem0

    const content = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp || Date.now(),
    });

    await mem0.add(
      [{ role: "user", content }],
      { user_id: historyUserId(businessId) }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[history] POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

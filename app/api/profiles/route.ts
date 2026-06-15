/**
 * GET /api/profiles — list all saved business profiles
 * POST /api/profiles — save a new or updated profile
 * DELETE /api/profiles?id=... — delete a profile
 *
 * Profiles stored in Mem0 under user_id "hawkerhero-profiles".
 * NO demo profiles. Returns empty array if none exist.
 */

import { NextRequest, NextResponse } from "next/server";
import { BusinessProfile } from "@/lib/profiles";
import MemoryClient from "mem0ai";

const PROFILES_USER_ID = "hawkerhero-profiles-store";

function getClient(): MemoryClient | null {
  const key = process.env.MEM0_API_KEY;
  if (!key) return null;
  return new MemoryClient({ apiKey: key });
}

async function loadProfiles(): Promise<BusinessProfile[]> {
  try {
    const mem0 = getClient();
    if (!mem0) return [];

    const results: any = await mem0.search("business profiles list", {
      user_id: PROFILES_USER_ID,
    });

    const items = results?.results || results || [];
    if (!Array.isArray(items) || items.length === 0) return [];

    for (const item of items) {
      const text = item.memory || item.content || item.text || "";
      if (text.includes('"id"') && text.includes('"name"')) {
        try {
          // Try to extract JSON from the text (may be prefixed with label)
          const jsonStart = text.indexOf("[");
          const jsonStr = jsonStart >= 0 ? text.slice(jsonStart) : text;
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // not valid, skip
        }
      }
    }

    return [];
  } catch (e) {
    console.error("[profiles] loadProfiles error:", e);
    return [];
  }
}

async function persistProfiles(profiles: BusinessProfile[]): Promise<void> {
  try {
    const mem0 = getClient();
    if (!mem0) return;

    const content = JSON.stringify(profiles);
    await mem0.add(
      [{ role: "user", content: `business profiles list: ${content}` }],
      { user_id: PROFILES_USER_ID }
    );
  } catch (e) {
    console.error("[profiles] persistProfiles error:", e);
  }
}

export async function GET() {
  const profiles = await loadProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  try {
    const profile: BusinessProfile = await req.json();
    if (!profile.id || !profile.name) {
      return NextResponse.json(
        { error: "Profile must have id and name" },
        { status: 400 }
      );
    }

    // Ensure createdAt
    if (!profile.createdAt) profile.createdAt = Date.now();

    const existing = await loadProfiles();
    const idx = existing.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      existing[idx] = profile;
    } else {
      existing.push(profile);
    }

    await persistProfiles(existing);
    return NextResponse.json({ profiles: existing });
  } catch (e: any) {
    console.error("[profiles] POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const existing = await loadProfiles();
    const filtered = existing.filter((p) => p.id !== id);
    await persistProfiles(filtered);
    return NextResponse.json({ profiles: filtered });
  } catch (e: any) {
    console.error("[profiles] DELETE error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

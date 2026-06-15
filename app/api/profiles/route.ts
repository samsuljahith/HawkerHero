/**
 * GET /api/profiles — list all saved business profiles
 * POST /api/profiles — save a new or updated profile
 *
 * Profiles are stored in Mem0 under user_id "hawkerhero-profiles".
 * Since Mem0 is a memory layer (not a CRUD DB), we store all profiles
 * as a JSON blob in a single memory entry for simplicity.
 * Fallback: returns demo profiles if Mem0 is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { BusinessProfile, DEMO_PROFILES } from "@/lib/profiles";
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
    if (!mem0) return DEMO_PROFILES;

    const results: any = await mem0.search("business profiles list", {
      user_id: PROFILES_USER_ID,
    });

    const items = results?.results || results || [];
    if (!Array.isArray(items) || items.length === 0) return DEMO_PROFILES;

    // Find the most recent memory that contains valid JSON profiles
    for (const item of items) {
      const text = item.memory || item.content || item.text || "";
      if (text.includes('"id"') && text.includes('"name"')) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // not valid JSON, skip
        }
      }
    }

    return DEMO_PROFILES;
  } catch (e) {
    console.error("[profiles] loadProfiles error:", e);
    return DEMO_PROFILES;
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

/**
 * GET /api/proxy-image?url=...
 * Proxies an external image and returns it as a base64 data URL.
 * This avoids CORS issues when html-to-image tries to capture the poster.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (e: any) {
    console.error("[proxy-image] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

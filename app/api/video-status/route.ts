/**
 * GET /api/video-status?taskId=...
 * Polls Agnes video generation status.
 * Returns { status, videoUrl } — never errors, degrades gracefully.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVideoTask } from "@/lib/agnes";

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json(
      { error: "taskId query parameter is required" },
      { status: 400 }
    );
  }

  const result = await getVideoTask(taskId);

  // Normalise: if status is still pending/processing, return "rendering" for the UI
  const status =
    result.status === "completed"
      ? "completed"
      : result.status === "failed"
      ? "failed"
      : "rendering";

  return NextResponse.json({ status, videoUrl: result.videoUrl });
}

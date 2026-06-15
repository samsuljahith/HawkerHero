/**
 * GET /api/video-status?taskId=...
 * Polls Agnes video generation status.
 * Returns { status, videoUrl } — never errors, degrades gracefully.
 *
 * Agnes statuses: queued, in_progress, completed, failed
 * We normalise to: rendering | completed | failed
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

  // Normalise status for the client
  const status =
    result.status === "completed"
      ? "completed"
      : result.status === "failed"
      ? "failed"
      : "rendering"; // queued + in_progress both show as "rendering"

  return NextResponse.json({ status, videoUrl: result.videoUrl });
}

/**
 * Agnes AI API — centralised helper.
 * All calls go through here so they're trivial to fix.
 *
 * Based on official docs at https://agnes-ai.com/doc
 *
 * Text:  POST /v1/chat/completions (agnes-2.0-flash)
 * Image: POST /v1/images/generations (agnes-image-2.1-flash)
 *        - response_format goes inside extra_body, NOT top-level
 *        - Prompt structure: [Subject] + [Scene] + [Style] + [Lighting] + [Composition] + [Quality]
 * Video: POST /v1/videos (agnes-video-v2.0) — async task creation
 *        - Returns video_id (recommended) and task_id
 *        - Retrieve: GET /agnesapi?video_id=<VIDEO_ID> (recommended)
 *        - Legacy:   GET /v1/videos/{task_id}
 *        - Final URL is in "remixed_from_video_id" when status === "completed"
 *        - num_frames must be 8n+1 and <= 441
 */

const BASE_URL = "https://apihub.agnes-ai.com";
const API_V1 = `${BASE_URL}/v1`;

function headers(): Record<string, string> {
  const key = process.env.AGNES_API_KEY;
  if (!key) throw new Error("AGNES_API_KEY is not set");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
}

// ─── TEXT ────────────────────────────────────────────────────────────────────

export async function generateText(prompt: string, maxTokens: number = 900): Promise<string> {
  try {
    const res = await fetch(`${API_V1}/chat/completions`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        model: "agnes-2.0-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[agnes/text] API error:", res.status, err);
      throw new Error(`Agnes text API ${res.status}`);
    }
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    console.error("[agnes/text] Error:", e);
    throw e;
  }
}

// ─── IMAGE ───────────────────────────────────────────────────────────────────
// Per docs: response_format must be inside extra_body, not top-level.
// Prompt best practice: [Subject] + [Scene/Environment] + [Style] + [Lighting] + [Composition] + [Quality]

export async function generateImage(
  prompt: string,
  size: string = "1024x768"
): Promise<string> {
  try {
    const res = await fetch(`${API_V1}/images/generations`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        model: "agnes-image-2.1-flash",
        prompt,
        size,
        extra_body: {
          response_format: "url",
        },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[agnes/image] API error:", res.status, err);
      throw new Error(`Agnes image API ${res.status}`);
    }
    const json = await res.json();
    const item = json.data?.[0];
    if (item?.url) return item.url;
    if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
    throw new Error("No image URL or b64_json in response");
  } catch (e) {
    console.error("[agnes/image] Error:", e);
    throw e;
  }
}

// ─── VIDEO (async task creation + retrieval) ─────────────────────────────────
//
// Per official docs (https://agnes-ai.com/doc/agnes-video-v20):
// - Create: POST /v1/videos
// - Response contains video_id (recommended for retrieval) and task_id
// - Retrieve (recommended): GET /agnesapi?video_id=<VIDEO_ID>
// - Retrieve (legacy):      GET /v1/videos/{task_id}
// - Final video URL is in "remixed_from_video_id" when status === "completed"
// - num_frames must be 8n+1 and <= 441
// - Recommended: num_frames 81 (~3s) or 121 (~5s) at frame_rate 24
// - Status: queued → in_progress → completed | failed
// ─────────────────────────────────────────────────────────────────────────────

function validateNumFrames(n: number): boolean {
  return n > 0 && n <= 441 && (n - 1) % 8 === 0;
}

export interface VideoStatus {
  status: string; // "queued" | "in_progress" | "completed" | "failed"
  videoUrl: string | null;
}

/**
 * Create a video generation task.
 * Returns the video_id (preferred for retrieval).
 * Defaults: num_frames=81 (~3.4s), frame_rate=24, 9:16 vertical (768x1152).
 * Retries once on 5xx provider errors.
 */
export async function createVideoTask(
  prompt: string,
  numFrames: number = 81,
  frameRate: number = 24
): Promise<string> {
  if (!validateNumFrames(numFrames)) {
    throw new Error(
      `Invalid num_frames (${numFrames}): must be 8n+1 and <= 441. Try 81 or 121.`
    );
  }

  const body = {
    model: "agnes-video-v2.0",
    prompt,
    num_frames: numFrames,
    frame_rate: frameRate,
    // 9:16 vertical for social media (Reels/TikTok)
    height: 1152,
    width: 768,
  };

  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${API_V1}/videos`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text();
        lastError = `Agnes video API ${res.status}: ${errBody}`;
        console.error(`[agnes/video] Attempt ${attempt + 1} failed:`, res.status, errBody);

        // Retry on 5xx (transient provider errors like "division by zero")
        if (res.status >= 500 && attempt === 0) {
          console.log("[agnes/video] Retrying once after provider error…");
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw new Error(lastError);
      }

      const json = await res.json();

      // Per docs: response contains video_id (recommended) and task_id/id
      const videoId = json.video_id || json.id || json.task_id;
      if (!videoId) {
        console.error("[agnes/video] No video_id/task_id in response:", JSON.stringify(json));
        throw new Error("No video_id returned from video API");
      }

      console.log("[agnes/video] Task created:", {
        video_id: json.video_id,
        task_id: json.task_id,
        status: json.status,
        seconds: json.seconds,
        size: json.size,
      });

      return videoId;
    } catch (e: any) {
      if (attempt === 1 || !e.message?.includes("Agnes video API 5")) {
        throw e;
      }
      console.log("[agnes/video] Retrying once after error:", e.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  throw new Error(lastError || "Video task creation failed after retries");
}

/**
 * Retrieve video task status and URL.
 * Uses the recommended /agnesapi?video_id= endpoint.
 * Falls back to legacy /v1/videos/{taskId} if the first fails.
 * Only status === "completed" means done.
 * Video URL is in "remixed_from_video_id" field.
 */
export async function getVideoTask(taskId: string): Promise<VideoStatus> {
  try {
    // Recommended method: GET /agnesapi?video_id=<VIDEO_ID>
    let res = await fetch(
      `${BASE_URL}/agnesapi?video_id=${encodeURIComponent(taskId)}&model_name=agnes-video-v2.0`,
      { method: "GET", headers: headers() }
    );

    // If recommended endpoint fails, try legacy
    if (!res.ok) {
      console.log("[agnes/video-status] Recommended endpoint failed, trying legacy…");
      res = await fetch(`${API_V1}/videos/${encodeURIComponent(taskId)}`, {
        method: "GET",
        headers: headers(),
      });
    }

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[agnes/video-status] API error:", res.status, errBody);
      return { status: "queued", videoUrl: null };
    }

    const json = await res.json();
    const status: string = json.status ?? "queued";

    // Per docs: video URL is in "remixed_from_video_id" when completed
    let videoUrl: string | null = null;
    if (status === "completed") {
      videoUrl =
        json.remixed_from_video_id ||
        json.video_url ||
        json.url ||
        null;
    }

    return { status, videoUrl };
  } catch (e) {
    console.error("[agnes/video-status] Error:", e);
    return { status: "queued", videoUrl: null };
  }
}

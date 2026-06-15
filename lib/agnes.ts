/**
 * Agnes AI API — centralised helper.
 * All calls go through here so they're trivial to fix.
 */

const BASE_URL = "https://apihub.agnes-ai.com/v1";

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
    const res = await fetch(`${BASE_URL}/chat/completions`, {
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

export async function generateImage(
  prompt: string,
  size: string = "1024x1024"
): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/images/generations`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        model: "agnes-image-2.1-flash",
        prompt,
        size,
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

// ─── VIDEO (async task) ──────────────────────────────────────────────────────

export interface VideoTaskResponse {
  taskId?: string;
  id?: string;
  status?: string;
  videoUrl?: string;
  video_url?: string;
  result?: { url?: string; video_url?: string };
}

export async function createVideoTask(prompt: string): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/video/generations`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        model: "agnes-video-v2.0",
        prompt,
        num_frames: 49,  // must be 8n+1 and <=441; 49 = 8*6+1, ~2s at 24fps
        frame_rate: 24,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[agnes/video] API error:", res.status, err);
      throw new Error(`Agnes video API ${res.status}`);
    }
    const json: VideoTaskResponse = await res.json();
    // The response may use "id" or "taskId" — handle both
    const taskId = json.taskId || json.id;
    if (!taskId) {
      console.error("[agnes/video] No task ID in response:", json);
      throw new Error("No task ID returned from video API");
    }
    return taskId;
  } catch (e) {
    console.error("[agnes/video] Error:", e);
    throw e;
  }
}

export interface VideoStatus {
  status: string; // "pending" | "processing" | "completed" | "failed"
  videoUrl: string | null;
}

export async function getVideoTask(taskId: string): Promise<VideoStatus> {
  try {
    // Try GET with query param first, fallback patterns handled below
    const res = await fetch(`${BASE_URL}/video/generations/${taskId}`, {
      method: "GET",
      headers: headers(),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[agnes/video-status] API error:", res.status, err);
      return { status: "pending", videoUrl: null };
    }
    const json: VideoTaskResponse = await res.json();
    const status = json.status ?? "pending";
    const videoUrl =
      json.videoUrl ||
      json.video_url ||
      json.result?.url ||
      json.result?.video_url ||
      null;
    return { status, videoUrl };
  } catch (e) {
    console.error("[agnes/video-status] Error:", e);
    return { status: "pending", videoUrl: null };
  }
}

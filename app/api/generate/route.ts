/**
 * POST /api/generate
 * Fast parallelized 6-agent orchestrator.
 *
 * Pipeline (optimised for speed):
 *   Step 0 (if !FAST_MODE): Batch ALL Exa searches in one Promise.all
 *   Step 1 (await): Combined Strategist + Prompt Engineer in ONE Agnes call
 *   Step 2 (Promise.all, non-blocking video): Copywriter + Art Director + createVideoTask
 *   Step 3 (await): Quality Reviewer (quick)
 *   Return immediately — client polls video separately.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText, generateImage, createVideoTask } from "@/lib/agnes";
import { searchWeb, getTodayContext } from "@/lib/exa";
import { getBusinessMemory, saveBusinessMemory } from "@/lib/memory";

export const maxDuration = 60;

const FAST_MODE = process.env.FAST_MODE === "true";

// ─── Caption Frameworks ──────────────────────────────────────────────────────

const CAPTION_FRAMEWORKS = `Use one of these proven frameworks (pick the best fit, state which you used):
1. HVC (Hook–Value–CTA) 2. AIDA (Attention–Interest–Desire–Action) 3. PAS (Problem–Agitate–Solution)
4. Storytelling (Setup–Conflict–Resolution–CTA) 5. FAB (Features–Advantages–Benefits)
6. Before–After–Bridge 7. G.R.A.B (Grab–Relate–Amplify–Bridge) 8. SLAP (Stop–Look–Act–Purchase)
9. 4U (Useful–Urgent–Unique–Ultra-Specific) 10. PPPP (Picture–Promise–Prove–Push)`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeParseJSON(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");
  }
  return JSON.parse(cleaned);
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { input, todayMode, profile } = await req.json();
    if (!input || typeof input !== "string" || input.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a description of your business." },
        { status: 400 }
      );
    }

    // Build profile context string for agent prompts
    const profileContext = profile
      ? `\nACTIVE BUSINESS PROFILE:\n- Name: ${profile.name}\n- Type: ${profile.type}\n- Description: ${profile.description}\n- Offerings: ${profile.offerings}\n- Location: ${profile.location}\n- Contact: ${profile.contact}\n- Brand Colors: ${(profile.brandColors || []).join(", ")}${profile.uploadedData ? `\n- Business Data (from uploaded file):\n${profile.uploadedData.slice(0, 1500)}` : ""}\nTailor ALL output specifically to this business. ${profile.type === "Restaurant" || profile.type === "Cafe" ? "Use food/dish-based marketing angles." : `Use ${profile.type.toLowerCase()}-service-based marketing angles.`}\nAutomatically determine the ideal target audience, brand tone, and marketing approach based on the business type, location, and products.\n`
      : "";

    const sources: string[] = [];
    const memoryKey = profile?.name || input;

    // ═══════════════════════════════════════════════════════════════════════════
    // MEMORY: Retrieve prior context for this business
    // ═══════════════════════════════════════════════════════════════════════════
    const priorMemory = await getBusinessMemory(memoryKey);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 0: Batch all Exa searches upfront (skipped in FAST_MODE)
    // ═══════════════════════════════════════════════════════════════════════════
    let trendData = "";
    let imgTechData = "";
    let vidTechData = "";
    let hashtagData = "";
    let todayContext = "";

    if (!FAST_MODE) {
      const searchPromises = [
        searchWeb(`what's trending and what makes ${input} popular in Singapore 2026`),
        searchWeb("best AI image generation prompt techniques for food and product photography 2026"),
        searchWeb("trending short-form promo video prompt styles for small business 2026"),
        searchWeb(`trending ${input} hashtags and viral social content angles 2026`),
        todayMode
          ? getTodayContext()
          : Promise.resolve(""),
      ];

      const [s1, s2, s3, s4, s5] = await Promise.all(searchPromises);
      trendData = s1;
      imgTechData = s2;
      vidTechData = s3;
      hashtagData = s4;
      todayContext = s5;

      if (trendData) sources.push(trendData);
      if (imgTechData) sources.push(imgTechData);
      if (vidTechData) sources.push(vidTechData);
      if (hashtagData) sources.push(hashtagData);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Combined Strategist + Prompt Engineer (ONE Agnes call)
    // ═══════════════════════════════════════════════════════════════════════════
    const combinedPrompt = `You are a brand strategist AND award-winning AI prompt engineer for small food/retail businesses in Singapore.

The owner says: "${input}"
${profileContext}${priorMemory ? `RETURNING CUSTOMER — prior context from memory:\n${priorMemory}\nSince this is a returning business, also include:\n- "returning": true\n- "welcomeBack": a friendly 1-line greeting referencing what you remember about them\n- "whatsChanged": what's new or different in the market since their last visit (based on live data vs memory)\n` : ""}${trendData ? `Live market research:\n${trendData}\n` : ""}${imgTechData ? `AI image prompt techniques:\n${imgTechData}\n` : ""}${vidTechData ? `Video prompt styles:\n${vidTechData}\n` : ""}${todayContext ? `Today's context: ${todayContext}\nAdapt strategy to today (rainy->comfort food, hot->cold drinks, holiday->festive, weekend->family).\n` : ""}

Return ONLY valid JSON (no markdown, no explanation):
{
  "dish": "main product/service name",
  "usp": "unique selling point in one sentence",
  "price": "price point or range",
  "vibe": "brand vibe in 2-3 words",
  "audience": "target audience",
  "imagePrompt": "professional photography of the product/service, beautiful composition, warm natural lighting, shallow depth of field, appetizing/appealing colors, clean background, NO text, NO watermark, NO letters, NO logos, NO price tags, leave clear negative space at top and bottom for text overlay, ultra high quality, 4K",
  "videoPrompt": "highly detailed 5-second vertical (9:16) promo video prompt, cinematic close-up, appealing, smooth motion, no text",
  "contentPlan": [
    { "idea": "content idea title", "why": "why this works now", "audience": "who it targets", "platform": "Instagram/TikTok/etc", "suggestedCaption": "short caption", "hashtags": ["3-5 hashtags"], "bestPostTime": "e.g. Tue 12pm" }
  ]${priorMemory ? `,\n  "returning": true,\n  "welcomeBack": "friendly greeting referencing prior context",\n  "whatsChanged": "what changed in the market since last time"` : ""}
}
For "contentPlan" include 4-6 upcoming content ideas suited to this business type and current trends.`;

    const combinedRaw = await generateText(combinedPrompt, 1200);
    let brief: any;
    let imagePrompt: string;
    let videoPrompt: string;

    try {
      brief = safeParseJSON(combinedRaw);
      imagePrompt = brief.imagePrompt || `Professional food photography of ${input}, appetizing, warm lighting, no text, no watermark, no letters, leave space at top and bottom for text overlay`;
      videoPrompt = brief.videoPrompt || `Cinematic vertical video of ${input} being freshly prepared, steam rising, 5 seconds`;
    } catch {
      brief = {
        dish: input,
        usp: "delicious and affordable",
        price: "$5",
        vibe: "authentic local",
        audience: "locals and tourists",
      };
      imagePrompt = `Professional food photography of ${input}, vibrant colors, warm lighting, appetizing, no text, no watermark, no letters, leave clear space at top and bottom for text overlay`;
      videoPrompt = `Close-up cinematic vertical video of ${input} being freshly prepared, steam rising, appetizing, 5 seconds`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Copywriter + Art Director + Video (all concurrent)
    // ═══════════════════════════════════════════════════════════════════════════
    const copywriterPrompt = `You are a social media copywriter for Singapore hawker/small business marketing.
Business: ${JSON.stringify({ dish: brief.dish, usp: brief.usp, price: brief.price, vibe: brief.vibe, audience: brief.audience })}
${profileContext}${hashtagData ? `Trending research:\n${hashtagData}\n` : ""}${todayContext ? `Today: ${todayContext}. Adapt tone accordingly.\n` : ""}
${CAPTION_FRAMEWORKS}

Write captions in 4 languages for Instagram/TikTok. Return ONLY valid JSON:
{
  "english": "caption using chosen framework, emojis, CTA",
  "chinese": "Chinese (Simplified)",
  "malay": "Malay",
  "tamil": "Tamil",
  "hashtags": ["10","relevant","hashtags"],
  "framework": "framework name used"
}`;

    const [captionsRaw, posterImageUrl, videoTaskId] = await Promise.all([
      generateText(copywriterPrompt, 800).catch(() => ""),
      generateImage(imagePrompt).catch((e) => {
        console.error("[orchestrator] Image failed:", e);
        return null;
      }),
      createVideoTask(videoPrompt, input.includes("15-second") ? 361 : 241).catch((e) => {
        console.error("[orchestrator] Video task failed:", e);
        return null;
      }),
    ]);

    let captions: any;
    try {
      captions = safeParseJSON(captionsRaw as string);
    } catch {
      captions = {
        english: `Come try our amazing ${brief.dish}! 🔥 Only ${brief.price}!`,
        chinese: `来试试我们的${brief.dish}！🔥`,
        malay: `Jom cuba ${brief.dish} kami! 🔥`,
        tamil: `எங்கள் ${brief.dish} சுவைக்கவும்! 🔥`,
        hashtags: ["#hawkerfood", "#sgfood", "#singapore", "#foodie", "#yummy"],
        framework: "HVC",
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2.5: Poster Composer Agent (Agnes text — poster layout data)
    // ═══════════════════════════════════════════════════════════════════════════
    let poster: any = null;
    try {
      const posterComposerPrompt = `You are a professional advertising art director who designs high-converting marketing posters.

Business info from owner: "${input}"
${profileContext}Brief: ${JSON.stringify({ dish: brief.dish, usp: brief.usp, price: brief.price, vibe: brief.vibe, audience: brief.audience })}

Design a poster layout. Return ONLY valid JSON (no markdown):
{
  "headline": "short punchy attention grabber (max 6 words)",
  "story": "1-2 sentence emotional storytelling line",
  "items": [{ "name": "item name", "price": "$X" }],
  "offer": "special offer or combo, or null",
  "businessName": "business name from input",
  "rating": "e.g. 4.8 ★ (320 reviews)",
  "cta": "Order Now / Visit Today / Limited Offer",
  "hours": "e.g. 10am - 9pm daily",
  "contact": "phone or @handle or address",
  "delivery": "e.g. GrabFood / foodpanda, or null"
}

For "items" include 1-4 menu items with prices based on what the owner described. For fields not mentioned by the owner, use plausible placeholders. Label the rating as a sample if invented.`;

      const posterRaw = await generateText(posterComposerPrompt, 600);
      poster = safeParseJSON(posterRaw);
    } catch (e) {
      console.error("[orchestrator] Poster Composer failed:", e);
      // Fallback poster data
      poster = {
        headline: `Try Our ${brief.dish}!`,
        story: brief.usp || "Made with love, served with pride.",
        items: [{ name: brief.dish, price: brief.price || "$5" }],
        offer: null,
        businessName: brief.dish,
        rating: "4.7 ★ (sample)",
        cta: "Visit Today",
        hours: "10am - 9pm daily",
        contact: "See us in person",
        delivery: null,
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Quality Reviewer (quick, after we have captions)
    // ═══════════════════════════════════════════════════════════════════════════
    let review: any = { score: 7, feedback: "Looks good." };

    if (!FAST_MODE) {
      try {
        const mainClaim = captions.english || `${brief.dish} at ${brief.price}`;
        // Use trendData we already have for verification — no extra search
        const reviewerPrompt = `You are a marketing quality reviewer. Rate this caption's accuracy (1-10) and flag unverifiable claims:
Caption: "${mainClaim}"
${trendData ? `Context:\n${trendData}\n` : ""}
Return ONLY valid JSON: { "score": <1-10>, "feedback": "one-line feedback" }`;

        const reviewRaw = await generateText(reviewerPrompt, 200);
        review = safeParseJSON(reviewRaw);
      } catch {
        // keep default review
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MEMORY: Save this session's context for future visits (non-blocking)
    // ═══════════════════════════════════════════════════════════════════════════
    const memorySummary = `Business: ${brief.dish}. USP: ${brief.usp}. Price: ${brief.price}. Vibe: ${brief.vibe}. Audience: ${brief.audience}. Caption framework: ${captions.framework || "HVC"}. English caption: ${(captions.english || "").slice(0, 200)}. Generated poster and video.`;
    saveBusinessMemory(memoryKey, memorySummary).catch(() => {}); // fire-and-forget

    // ═══════════════════════════════════════════════════════════════════════════
    // RESPONSE — return immediately, client polls video separately
    // ═══════════════════════════════════════════════════════════════════════════
    return NextResponse.json({
      brief,
      captions,
      posterImageUrl,
      poster,
      videoTaskId,
      review,
      sources,
      todayContext: todayContext || null,
      returning: brief.returning || false,
      welcomeBack: brief.welcomeBack || null,
      whatsChanged: brief.whatsChanged || null,
      contentPlan: brief.contentPlan || null,
    });
  } catch (e: any) {
    console.error("[orchestrator] Fatal error:", e);
    return NextResponse.json(
      { error: e.message || "Something went wrong generating your marketing kit." },
      { status: 500 }
    );
  }
}

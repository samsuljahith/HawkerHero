/**
 * POST /api/generate
 * The 6-agent orchestrator — plain TypeScript, no frameworks.
 *
 * Pipeline order (optimised for speed):
 *   1. Brand Strategist (Exa + Agnes text)
 *   2. Prompt Engineer (Exa + Agnes text) — optimises image/video prompts
 *   3. Video Producer — fires createVideoTask IMMEDIATELY (async, non-blocking)
 *   4. Copywriter (Exa + Agnes text) — runs in parallel with video rendering
 *   5. Art Director (Agnes image)
 *   6. Quality Reviewer (Exa + Agnes text)
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText, generateImage, createVideoTask } from "@/lib/agnes";
import { searchWeb, getTodayContext } from "@/lib/exa";

export const maxDuration = 120;

// ─── Caption Frameworks Reference ────────────────────────────────────────────

const CAPTION_FRAMEWORKS = `
You MUST use one or more of these proven caption frameworks. Pick the best fit for the business:

1. HVC (Hook–Value–CTA): Grab attention → Provide insight/emotion → Ask for engagement.
2. AIDA (Attention–Interest–Desire–Action): Open strong → Build curiosity → Spark connection → Direct next move.
3. PAS (Problem–Agitate–Solution): Identify pain point → Add urgency → Present your offer.
4. Storytelling (Setup–Conflict–Resolution–CTA): Relatable moment → Obstacle → What changed → Invite engagement.
5. FAB (Features–Advantages–Benefits): What it is → Why it's better → What's in it for the user.
6. Before–After–Bridge: Current struggle → Ideal future → How your product connects them.
7. 4C's (Clear–Concise–Compelling–Credible): Simple, short, engaging, backed by proof.
8. QUEST (Qualify–Understand–Educate–Stimulate–Transition): Address audience → Acknowledge problem → Provide insight → Make them want → Lead to CTA.
9. G.R.A.B (Grab–Relate–Amplify–Bridge): Hook → Connect emotionally → Build excitement → CTA.
10. SLAP (Stop–Look–Act–Purchase): Capture attention → Make interesting → Drive engagement → Guide to conversion.
11. PPPP (Picture–Promise–Prove–Push): Paint scenario → State gain → Back it up → Call to act.
12. 4U (Useful–Urgent–Unique–Ultra-Specific): Value + timeliness + fresh angle + concrete detail.

Choose the framework that best suits the product, audience, and platform. State which framework you used.
`;

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
    const { input, todayMode } = await req.json();
    if (!input || typeof input !== "string" || input.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a description of your business." },
        { status: 400 }
      );
    }

    const sources: string[] = [];

    // ═══════════════════════════════════════════════════════════════════════════
    // TODAY MODE — fetch real-world context
    // ═══════════════════════════════════════════════════════════════════════════
    let todayContext = "";
    if (todayMode) {
      todayContext = await getTodayContext();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AGENT 1 — Brand Strategist (uses Exa)
    // ═══════════════════════════════════════════════════════════════════════════
    const trendQuery = `what's trending and what makes ${input} popular in Singapore 2026`;
    const trendData = await searchWeb(trendQuery);
    if (trendData) sources.push(trendData);

    const strategistPrompt = `You are a brand strategist for small food/retail businesses in Singapore.
The owner says: "${input}"
${trendData ? `Live market research data:\n${trendData}\n` : ""}${todayContext ? `Today's real-world context: ${todayContext}\nAdapt your strategy to today's context (e.g. rainy weather -> comfort food angle, hot day -> refreshing/cold angle, holiday eve -> festive angle, weekend -> family outing angle).\n` : ""}
Analyse and return ONLY valid JSON (no markdown, no explanation) with these keys:
{
  "dish": "main product name",
  "usp": "unique selling point in one sentence",
  "price": "price point",
  "vibe": "brand vibe in 2-3 words",
  "audience": "target audience",
  "posterPrompt": "a detailed image generation prompt for a mouth-watering promotional poster of this product, vibrant food photography style, warm lighting, no text overlay",
  "videoPrompt": "a detailed 5-second vertical video prompt showing this product being freshly prepared/served, close-up cinematic, steam rising, appetizing"
}`;

    const briefRaw = await generateText(strategistPrompt);
    let brief: any;
    try {
      brief = safeParseJSON(briefRaw);
    } catch {
      brief = {
        dish: input,
        usp: "delicious and affordable",
        price: "$5",
        vibe: "authentic local",
        audience: "locals and tourists",
        posterPrompt: `Professional food photography of ${input}, vibrant colors, warm lighting, appetizing, promotional poster style`,
        videoPrompt: `Close-up cinematic vertical video of ${input} being freshly prepared, steam rising, appetizing, 5 seconds`,
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AGENT 2 — Prompt Engineer (uses Exa for prompt technique research)
    // ═══════════════════════════════════════════════════════════════════════════
    let imagePrompt = brief.posterPrompt || `Appetizing promotional poster of ${input}`;
    let videoPrompt = brief.videoPrompt || `Cinematic vertical video of ${input} being served, appetizing, 5 seconds`;

    try {
      const [imgTechData, vidTechData] = await Promise.all([
        searchWeb("best AI image generation prompt techniques for food and product photography 2026"),
        searchWeb("trending short-form promo video prompt styles for small business 2026"),
      ]);
      if (imgTechData) sources.push(imgTechData);
      if (vidTechData) sources.push(vidTechData);

      const promptEngineerPrompt = `You are an award-winning AI art director and prompt engineer who specializes in mouth-watering food/product photography and scroll-stopping short-form promo video. You write prompts optimized for generative image and video models.

Business brief: ${JSON.stringify(brief)}

${imgTechData ? `Latest AI image prompt techniques research:\n${imgTechData}\n` : ""}
${vidTechData ? `Latest short-form video prompt styles research:\n${vidTechData}\n` : ""}

Based on the brief and latest techniques, write two highly detailed, optimized prompts:
- imagePrompt: for generating a stunning promotional poster (food/product photography style, no text overlay, ultra detailed, professional lighting)
- videoPrompt: for generating a 5-second vertical (9:16) promo video (cinematic, appetizing, close-up, smooth motion)

Return ONLY valid JSON (no markdown, no explanation):
{
  "imagePrompt": "your optimized image prompt here",
  "videoPrompt": "your optimized video prompt here"
}`;

      const promptEngRaw = await generateText(promptEngineerPrompt);
      const promptEngResult = safeParseJSON(promptEngRaw);
      if (promptEngResult.imagePrompt) imagePrompt = promptEngResult.imagePrompt;
      if (promptEngResult.videoPrompt) videoPrompt = promptEngResult.videoPrompt;
    } catch (e) {
      console.error("[orchestrator] Prompt Engineer failed, using brief defaults:", e);
      // Falls back to brief.posterPrompt / brief.videoPrompt — already set above
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AGENT 3 — Video Producer (fire IMMEDIATELY, don't block)
    // ═══════════════════════════════════════════════════════════════════════════
    let videoTaskId: string | null = null;
    try {
      videoTaskId = await createVideoTask(videoPrompt);
    } catch (e) {
      console.error("[orchestrator] Video task creation failed:", e);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AGENT 4 — Copywriter (uses Exa) + Caption Frameworks
    // Runs while video is rendering in the background
    // ═══════════════════════════════════════════════════════════════════════════
    const hashtagQuery = `trending ${brief.dish || input} hashtags and viral social content angles 2026`;
    const hashtagData = await searchWeb(hashtagQuery);
    if (hashtagData) sources.push(hashtagData);

    const copywriterPrompt = `You are a social media copywriter specialising in Singapore hawker/small business marketing.
Business brief: ${JSON.stringify(brief)}
${hashtagData ? `Trending hashtag & content research:\n${hashtagData}\n` : ""}${todayContext ? `Today's real-world context: ${todayContext}\nAdapt the tone and angle to today (e.g. rainy -> cozy comfort food vibes, hot -> refreshing/cooling angle, holiday -> festive celebration, weekend -> family/friends gathering).\n` : ""}

${CAPTION_FRAMEWORKS}

Write promotional captions in 4 languages for Instagram/TikTok using the best caption framework for this business. Return ONLY valid JSON (no markdown):
{
  "english": "caption using the chosen framework, with emojis and call to action",
  "chinese": "Chinese caption (Simplified) using same framework",
  "malay": "Malay caption using same framework",
  "tamil": "Tamil caption using same framework",
  "hashtags": ["list", "of", "10", "relevant", "hashtags"],
  "framework": "name of the framework used (e.g. HVC, AIDA, PAS)"
}`;

    const captionsRaw = await generateText(copywriterPrompt);
    let captions: any;
    try {
      captions = safeParseJSON(captionsRaw);
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
    // AGENT 5 — Art Director (image generation)
    // ═══════════════════════════════════════════════════════════════════════════
    let posterUrl: string | null = null;
    try {
      posterUrl = await generateImage(imagePrompt);
    } catch (e) {
      console.error("[orchestrator] Image generation failed:", e);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AGENT 6 — Quality Reviewer (uses Exa)
    // ═══════════════════════════════════════════════════════════════════════════
    const mainClaim = captions.english || `${brief.dish} at ${brief.price}`;
    const factCheckData = await searchWeb(mainClaim);
    if (factCheckData) sources.push(factCheckData);

    const reviewerPrompt = `You are a marketing quality reviewer. Check this social media caption for accuracy:
Caption: "${mainClaim}"
${factCheckData ? `Web verification data:\n${factCheckData}\n` : "No web data available for verification."}
Return ONLY valid JSON:
{
  "score": <number 1-10>,
  "feedback": "one-line feedback, flag any unverifiable claims"
}`;

    let review: any;
    try {
      const reviewRaw = await generateText(reviewerPrompt);
      review = safeParseJSON(reviewRaw);
    } catch {
      review = { score: 7, feedback: "Could not fully verify all claims." };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════════════════════
    return NextResponse.json({
      brief,
      captions,
      posterUrl,
      videoTaskId,
      review,
      sources,
      todayContext: todayContext || null,
    });
  } catch (e: any) {
    console.error("[orchestrator] Fatal error:", e);
    return NextResponse.json(
      { error: e.message || "Something went wrong generating your marketing kit." },
      { status: 500 }
    );
  }
}

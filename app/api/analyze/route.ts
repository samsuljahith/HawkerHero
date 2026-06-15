/**
 * POST /api/analyze
 * Product-aware Market Analysis Agent.
 *
 * Takes a business profile (including uploaded product data) and performs:
 * 1. Product/service inventory extraction
 * 2. Live market trend research (Exa)
 * 3. Trend-to-product matching
 * 4. Promotion recommendations (which products to push and why)
 * 5. Content plan generation
 *
 * Returns structured, beginner-friendly analysis with plain-language explanations.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/agnes";
import { searchWeb } from "@/lib/exa";
import { getBusinessMemory, saveBusinessMemory } from "@/lib/memory";

export const maxDuration = 60;

const FAST_MODE = process.env.FAST_MODE === "true";

function safeParseJSON(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");
  }
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const { profile, language } = await req.json();

    if (!profile?.name) {
      return NextResponse.json({ error: "Business profile is required." }, { status: 400 });
    }

    const lang = language || "english";
    const sources: string[] = [];

    // Build the full business context
    const businessContext = `
Business: ${profile.name}
Type: ${profile.type}
Description: ${profile.description}
Products/Services/Menu: ${profile.offerings || "Not provided"}
Target Audience: ${profile.targetAudience || "General local customers"}
Brand Personality: ${profile.branding || "Friendly and professional"}
Location: ${profile.location || "Singapore"}
${profile.uploadedData ? `\nUploaded Business Data (catalog/menu/services):\n${profile.uploadedData.slice(0, 2000)}` : ""}`;

    // Retrieve memory
    const priorMemory = await getBusinessMemory(profile.name);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Live market research (Exa)
    // ═══════════════════════════════════════════════════════════════════════════
    let trendData = "";
    let competitorData = "";
    let productTrendData = "";

    if (!FAST_MODE) {
      const [t1, t2, t3] = await Promise.all([
        searchWeb(`what ${profile.type} products and services are trending in Singapore 2026, popular items, customer demand`),
        searchWeb(`top ${profile.type} competitors in ${profile.location || "Singapore"} 2026, what makes them successful`),
        searchWeb(`trending ${profile.offerings?.split("\n")[0] || profile.type} social media marketing content 2026 engagement`),
      ]);
      trendData = t1;
      competitorData = t2;
      productTrendData = t3;
      if (t1) sources.push(t1);
      if (t2) sources.push(t2);
      if (t3) sources.push(t3);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Product-aware analysis (Agnes)
    // ═══════════════════════════════════════════════════════════════════════════
    const analysisPrompt = `You are a friendly marketing consultant for small businesses. You explain things in simple, clear language that any business owner can understand — even if they have no marketing experience.

${businessContext}

${priorMemory ? `Previous analysis context (returning customer):\n${priorMemory}\n` : ""}
${trendData ? `Current market trends:\n${trendData}\n` : ""}
${competitorData ? `Competitor landscape:\n${competitorData}\n` : ""}
${productTrendData ? `Content & engagement trends:\n${productTrendData}\n` : ""}

Analyze this business and respond in ${lang === "english" ? "English" : lang}. Return ONLY valid JSON (no markdown):
{
  "businessSummary": {
    "name": "business name",
    "whatYouDo": "simple 1-sentence explanation of this business",
    "mainProducts": ["list", "of", "main", "products/services", "identified"],
    "priceRange": "price range"
  },
  "marketInsights": {
    "overview": "2-3 sentence plain-language market overview. Explain what customers in this area are looking for.",
    "whatsHot": "What's currently popular and trending in this business category. Use simple language.",
    "opportunity": "The biggest opportunity for this business right now. Explain why."
  },
  "productRecommendations": [
    {
      "product": "specific product/service name from their menu/catalog",
      "reason": "why this should be promoted now — in simple terms",
      "trendMatch": "what market trend this matches",
      "suggestedAction": "specific, easy action the owner can take",
      "priority": "high/medium/low"
    }
  ],
  "competitorInsights": {
    "overview": "What competitors in this area are doing well. Simple language.",
    "yourAdvantage": "What makes this business different/better. Simple language.",
    "gap": "An opportunity competitors are missing that this business could fill."
  },
  "contentPlan": [
    {
      "idea": "content idea",
      "product": "which product to feature",
      "why": "why this will work — simple explanation",
      "platform": "Instagram/TikTok/Facebook",
      "bestTime": "best day and time to post",
      "contentType": "image/video/carousel/story",
      "suggestedCaption": "ready-to-use caption"
    }
  ],
  "quickWins": [
    "immediate action 1 — something they can do today",
    "immediate action 2",
    "immediate action 3"
  ],
  "score": {
    "overall": 7,
    "explanation": "What this score means for your business — in plain language"
  }${priorMemory ? `,\n  "returning": true,\n  "welcomeBack": "friendly greeting referencing what you remember",\n  "whatsChanged": "what's different in the market since last time — simple language"` : ""}
}

IMPORTANT RULES:
- "productRecommendations" MUST reference specific products from the uploaded menu/catalog/services. Analyze ALL items and pick the top 3-5 to recommend.
- All explanations must be in simple, everyday language. Imagine explaining to a 60-year-old business owner who has never used social media marketing tools.
- Every recommendation must include a clear "why" and a specific action.
- "contentPlan" should have 4-6 ideas, each tied to a specific product.
- Do NOT use marketing jargon without explaining it.`;

    const analysisRaw = await generateText(analysisPrompt, 2000);
    let analysis: any;

    try {
      analysis = safeParseJSON(analysisRaw);
    } catch {
      analysis = {
        businessSummary: {
          name: profile.name,
          whatYouDo: profile.description || "Local business",
          mainProducts: profile.offerings?.split("\n").slice(0, 5).map((l: string) => l.split("$")[0].split("—")[0].trim()) || [],
          priceRange: "Varies",
        },
        marketInsights: {
          overview: "Market analysis could not be fully completed. Please try again.",
          whatsHot: "Unable to determine current trends.",
          opportunity: "Run the analysis again for better results.",
        },
        productRecommendations: [],
        competitorInsights: {
          overview: "Competitor data not available.",
          yourAdvantage: profile.description || "Your unique offerings.",
          gap: "Try again for competitor insights.",
        },
        contentPlan: [],
        quickWins: ["Complete your business profile with more details", "Upload your full product catalog", "Try running the analysis again"],
        score: { overall: 5, explanation: "Analysis incomplete — please try again." },
      };
    }

    // Save to memory
    const summary = `Analysis for ${profile.name}: ${analysis.marketInsights?.overview || ""}. Top recommendation: ${analysis.productRecommendations?.[0]?.product || "none"} - ${analysis.productRecommendations?.[0]?.reason || ""}`;
    saveBusinessMemory(profile.name, summary).catch(() => {});

    return NextResponse.json({
      analysis,
      sources,
      returning: analysis.returning || false,
      welcomeBack: analysis.welcomeBack || null,
      whatsChanged: analysis.whatsChanged || null,
    });
  } catch (e: any) {
    console.error("[analyze] Fatal error:", e);
    return NextResponse.json(
      { error: e.message || "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

# 🦸 HawkerHero — AI Marketing Studio for Small Businesses

> Built for Agnes AI Hackathon @ SMU

Describe your business in **one plain-language sentence** and HawkerHero's 6-agent AI pipeline generates a complete marketing kit:

- 📝 Multilingual captions (English, Chinese, Malay, Tamil) using proven caption frameworks
- 🎨 A professional promotional poster (optimised by a dedicated Prompt Engineer agent)
- 🎬 A short vertical promo video (9:16, ready for Reels/TikTok)
- ✅ Quality review score with fact-checking
- 📅 "Today Mode" — adapts your post to today's real weather, events, and vibe

---

## 🤖 The 6-Agent Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                │
│   "I sell chicken rice at Maxwell, tender, $4, family recipe"   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────▼────────────────┐
          │  🧠 AGENT 1: Brand Strategist  │ ◄── 🌐 Exa Web Search
          │  Analyses trends, creates brief │     (live market data)
          └───────────────┬────────────────┘
                          │
          ┌───────────────▼────────────────┐
          │  🖋️ AGENT 2: Prompt Engineer   │ ◄── 🌐 Exa Web Search
          │  Optimises image & video prompts│     (AI prompt techniques)
          └───────────────┬────────────────┘
                          │
          ┌───────────────▼────────────────┐
          │  🎬 AGENT 3: Video Producer    │
          │  Fires video render immediately │ (async, non-blocking)
          └───────────────┬────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                                   │
┌───────▼──────────┐             ┌──────────▼──────────┐
│ ✍️ AGENT 4:      │             │ 🎨 AGENT 5:         │
│ Copywriter       │ ◄── 🌐 Exa │ Art Director         │
│ (captions +      │    Search   │ (poster image)       │
│  frameworks)     │             │                      │
└───────┬──────────┘             └──────────┬──────────┘
        │                                   │
        └─────────────────┬─────────────────┘
                          │
          ┌───────────────▼────────────────┐
          │  🕵️ AGENT 6: Quality Reviewer  │ ◄── 🌐 Exa Web Search
          │  Fact-checks claims, scores kit │     (verification data)
          └───────────────┬────────────────┘
                          │
          ┌───────────────▼────────────────┐
          │         MARKETING KIT           │
          │  captions + poster + video +    │
          │  review score + sources         │
          └────────────────────────────────┘
```

---

## 📐 Caption Frameworks

The Copywriter agent uses proven marketing caption frameworks:

| Framework | Best For |
|-----------|----------|
| HVC (Hook–Value–CTA) | Instagram & TikTok engagement |
| AIDA (Attention–Interest–Desire–Action) | Paid ads, conversions |
| PAS (Problem–Agitate–Solution) | Addressing audience frustrations |
| Storytelling (Setup–Conflict–Resolution–CTA) | Brand-building |
| FAB (Features–Advantages–Benefits) | Product showcases |
| Before–After–Bridge | Transformations |
| G.R.A.B (Grab–Relate–Amplify–Bridge) | Reels & short-form |
| SLAP (Stop–Look–Act–Purchase) | Impulse-driving posts |
| 4U (Useful–Urgent–Unique–Ultra-Specific) | Promotional captions |
| QUEST / PPPP / 4C's | Educational & authority posts |

The agent automatically picks the best framework for each business type.

---

## 🌐 Live Web Search (Exa)

Four search calls ground the output in real, current data:

1. **Brand Strategist** — current market trends
2. **Prompt Engineer** — latest AI image/video prompt techniques (×2 searches)
3. **Copywriter** — trending hashtags and viral content angles
4. **Quality Reviewer** — fact-checks the main caption claim

All search sources are displayed in the UI.

---

## 📅 Today Mode

Click "📅 Make today's post" to adapt the entire kit to today's real-world context (weather, day of week, holidays, events in Singapore).

---

## 🛠 Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Agnes AI API** (text, image, video generation)
- **Exa** (live web search)
- Custom lightweight orchestrator — no LangGraph, no heavy frameworks

---

## 📦 Setup

See **[SETUP.md](./SETUP.md)** for step-by-step installation commands.

### Environment Variables

Create a `.env.local` file:

```env
AGNES_API_KEY=your_agnes_api_key_here
EXA_API_KEY=your_exa_api_key_here
```

---

## 📁 Project Structure

```
hawkerhero/
├── app/
│   ├── api/
│   │   ├── generate/route.ts      # 6-agent orchestrator
│   │   └── video-status/route.ts  # Video polling endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Main UI (single page app)
├── lib/
│   ├── agnes.ts                   # Agnes AI API helpers
│   └── exa.ts                     # Exa web search helper
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── README.md
└── SETUP.md
```

---

## 🚀 One App, One Deployment

The entire app — frontend, orchestrator, API routes — deploys as a single Next.js application. No separate backend, no microservices.

---

## 📜 License

Built for the Agnes AI Hackathon @ SMU. MIT License.

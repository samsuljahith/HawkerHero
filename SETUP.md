# HawkerHero — Setup Instructions

Run these commands in order from the project root (`HawkerHero/` directory).

---

## 1. Install dependencies

```bash
npm install
```

This installs all dependencies including `html-to-image` (poster PNG export), `mem0ai` (persistent memory), and `xlsx` (Excel file parsing for business data upload).

---

## 2. Create your environment file

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in your keys:

```
AGNES_API_KEY=your_agnes_api_key_here
EXA_API_KEY=your_exa_api_key_here
MEM0_API_KEY=your_mem0_api_key_here
FAST_MODE=false
```

Set `FAST_MODE=true` to skip all Exa web searches (for fast testing without an Exa key).
`MEM0_API_KEY` enables persistent memory — the app remembers returning businesses. Get a key from https://app.mem0.ai. Leave blank to disable memory (the app still works without it).

---

## 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Build for production (optional)

```bash
npm run build
npm start
```

---

## 5. Push to GitHub (for your teammates)

```bash
git init
git add .
git commit -m "Initial commit: HawkerHero 6-agent marketing studio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/HawkerHero.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. Create the repo on GitHub first (empty, no README).

Your teammates can then clone and run:

```bash
git clone https://github.com/YOUR_USERNAME/HawkerHero.git
cd HawkerHero
npm install
cp .env.example .env.local
# Fill in API keys in .env.local
npm run dev
```

---

## Troubleshooting

- **"AGNES_API_KEY is not set"** — Make sure `.env.local` exists and contains your key. Restart the dev server after changing env vars.
- **Exa search returns empty** — The pipeline degrades gracefully. Content still generates without search data.
- **Video takes a long time** — Video generation is async. The UI polls every 5s for ~4 minutes. Captions and posters are ready immediately.
- **Video not generating at all** — Check that the Agnes video API is responding. The endpoint is POST /v1/videos. num_frames must be 8n+1 (we use 241 for 10s, 361 for 15s).
- **Mem0 memory disabled** — If `MEM0_API_KEY` is not set, memory/history features are disabled but the app still works.
- **Excel upload not parsing** — Make sure the `xlsx` package is installed. Simple spreadsheets parse best.
- **Type errors on install** — Make sure you're on Node.js 18+ and npm 9+.

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| /api/profiles | GET/POST/DELETE | Business profile CRUD (Mem0-backed) |
| /api/analyze | POST | Product-aware market analysis |
| /api/generate | POST | Content generation (captions, poster, video) |
| /api/video-status | GET | Poll video rendering status |
| /api/history | GET/POST | Activity history per business |
| /api/proxy-image | GET | Image proxy for poster download |

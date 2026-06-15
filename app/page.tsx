"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Brief {
  dish: string;
  usp: string;
  price: string;
  vibe: string;
  audience: string;
}

interface Captions {
  english: string;
  chinese: string;
  malay: string;
  tamil: string;
  hashtags: string[];
  framework?: string;
}

interface Review {
  score: number;
  feedback: string;
}

interface GenerateResult {
  brief: Brief;
  captions: Captions;
  posterUrl: string | null;
  videoTaskId: string | null;
  review: Review;
  sources: string[];
  todayContext: string | null;
}

type PipelineStep =
  | "strategist"
  | "promptengineer"
  | "copywriter"
  | "artdirector"
  | "producer"
  | "reviewer"
  | "done";

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: "strategist", label: "🧠 Strategist searching live trends…" },
  { key: "promptengineer", label: "🖋️ Prompt Engineer optimising prompts…" },
  { key: "producer", label: "🎬 Producer starting video render…" },
  { key: "copywriter", label: "✍️ Copywriter writing captions…" },
  { key: "artdirector", label: "🎨 Art Director designing poster…" },
  { key: "reviewer", label: "🕵️ Reviewer fact-checking…" },
];

const EXAMPLES = [
  "I sell Hainanese chicken rice at Maxwell, very tender, $4, family recipe",
  "Bubble tea shop in Tampines, brown sugar boba, cheese foam, open till late",
  "Small florist in Tiong Bahru, hand-tied bouquets, same-day delivery, $35",
];

type LangKey = "english" | "chinese" | "malay" | "tamil";
const LANGUAGES: { key: LangKey; label: string }[] = [
  { key: "english", label: "English" },
  { key: "chinese", label: "中文" },
  { key: "malay", label: "Melayu" },
  { key: "tamil", label: "தமிழ்" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<LangKey>("english");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPolling, setVideoPolling] = useState(false);

  // Animated step cycling while loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setCurrentStep((s) => (s + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  // Video polling — 3s interval, ~90s timeout, graceful degradation
  const pollVideo = useCallback(async (taskId: string) => {
    setVideoPolling(true);
    const maxAttempts = 30; // ~90s
    let attempts = 0;
    const poll = async () => {
      if (attempts >= maxAttempts) {
        // Timeout — don't error, just keep showing "rendering"
        setVideoPolling(false);
        return;
      }
      attempts++;
      try {
        const res = await fetch(`/api/video-status?taskId=${taskId}`);
        const data = await res.json();
        if (data.status === "completed" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setVideoPolling(false);
          return;
        }
        if (data.status === "failed") {
          setVideoPolling(false);
          return;
        }
      } catch {
        // continue polling
      }
      setTimeout(poll, 3000);
    };
    poll();
  }, []);

  const handleGenerate = async (todayMode = false) => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setVideoUrl(null);
    setVideoPolling(false);
    setCurrentStep(0);
    setActiveLang("english");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), todayMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data);
      if (data.videoTaskId) {
        pollVideo(data.videoTaskId);
      }
    } catch (e: any) {
      setError(e.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="pt-10 pb-6 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-red-500 to-amber-500 bg-clip-text text-transparent">
          🦸 HawkerHero
        </h1>
        <p className="mt-2 text-lg text-gray-600 max-w-xl mx-auto">
          AI Marketing Studio for Small Businesses — describe your business in
          one sentence and get a full marketing kit in seconds.
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span>🌐</span> Powered by 6 AI agents with live web search
        </div>
      </header>

      {/* Input Section */}
      <section className="max-w-2xl mx-auto px-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your business in one sentence…"
            rows={3}
            className="w-full rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 px-5 py-4 text-lg resize-none outline-none transition-all placeholder:text-gray-400"
          />
          <button
            onClick={() => handleGenerate(false)}
            disabled={loading || !input.trim()}
            className="mt-3 w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 active:scale-[0.98]"
          >
            {loading ? "Generating…" : "✨ Generate Marketing Kit"}
          </button>
          <button
            onClick={() => handleGenerate(true)}
            disabled={loading || !input.trim()}
            className="mt-2 w-full py-3 rounded-xl font-bold text-base text-orange-700 bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? "Generating…" : "📅 Make today's post"}
          </button>
        </div>

        {/* Example Prompts */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setInput(ex)}
              className="px-3 py-1.5 text-sm rounded-full bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-700 transition-colors"
            >
              {ex.slice(0, 40)}…
            </button>
          ))}
        </div>
      </section>

      {/* Loading Steps */}
      {loading && (
        <section className="mt-10 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            <p className="text-lg font-semibold text-gray-700 animate-pulse">
              {STEPS[currentStep].label}
            </p>
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i <= currentStep
                      ? "bg-orange-500 scale-110"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Error */}
      {error && (
        <section className="mt-8 max-w-2xl mx-auto px-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <p className="font-medium">⚠️ {error}</p>
          </div>
        </section>
      )}

      {/* Results */}
      {result && (
        <section className="mt-10 max-w-4xl mx-auto px-4 pb-20 space-y-8 animate-fadeIn">
          {/* Today Context Badge */}
          {result.todayContext && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-sm font-medium">
              <span>🌦️</span> Adapted to today: {result.todayContext}
            </div>
          )}

          {/* Brief Card */}
          <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              📋 Brand Strategy Brief
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Product", value: result.brief.dish },
                { label: "USP", value: result.brief.usp },
                { label: "Price", value: result.brief.price },
                { label: "Vibe", value: result.brief.vibe },
                { label: "Audience", value: result.brief.audience },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-lg bg-orange-50 border border-orange-100"
                >
                  <p className="text-xs font-medium text-orange-600 uppercase">
                    {item.label}
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Captions Card */}
          <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              ✍️ Social Captions
            </h2>
            {/* Language Tabs */}
            <div className="flex gap-1 mb-4 p-1 rounded-lg bg-gray-100 w-fit">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.key}
                  onClick={() => setActiveLang(lang.key)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeLang === lang.key
                      ? "bg-white shadow text-orange-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 min-h-[80px]">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {result.captions[activeLang]}
              </p>
            </div>
            {/* Hashtags */}
            {result.captions.hashtags && (
              <div className="mt-3 flex flex-wrap gap-2">
                {result.captions.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100"
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}
            {/* Framework Badge */}
            {result.captions.framework && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
                <span>📐</span> Framework: {result.captions.framework}
              </div>
            )}
          </div>

          {/* Poster */}
          {result.posterUrl && (
            <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                🎨 Promo Poster
              </h2>
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.posterUrl}
                  alt="Generated promotional poster"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}

          {/* Video */}
          <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              🎬 Promo Video
            </h2>
            {videoUrl ? (
              <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-gray-200 shadow-md aspect-[9/16]">
                <video
                  src={videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            ) : videoPolling || result.videoTaskId ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin" />
                <p className="text-amber-700 text-sm font-medium">
                  🎬 Video rendering… This runs in the background (1-3 min). Your kit is ready below!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Video generation was not available for this request.
              </p>
            )}
          </div>

          {/* Review Badge */}
          <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  🕵️ Quality Review
                </h2>
                <p className="text-gray-600 text-sm">{result.review.feedback}</p>
              </div>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${
                  result.review.score >= 8
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : result.review.score >= 5
                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {result.review.score}/10
              </div>
            </div>
          </div>

          {/* Sources / Grounded Badge */}
          {result.sources && result.sources.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-600 font-bold text-sm">
                  🌐 Grounded with live web search
                </span>
              </div>
              <ul className="space-y-1">
                {result.sources.map((src, i) => (
                  <li
                    key={i}
                    className="text-xs text-emerald-800 bg-white/60 px-3 py-1.5 rounded-lg border border-emerald-100 line-clamp-2"
                  >
                    {src}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

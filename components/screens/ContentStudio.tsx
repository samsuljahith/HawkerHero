"use client";

import { useState, useCallback, useEffect } from "react";
import { BusinessProfile } from "@/lib/profiles";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import AgentProgress from "@/components/ui/AgentProgress";
import Poster, { PosterData } from "@/components/Poster";

const AGENT_STEPS = [
  { label: "Strategist + Prompt Engineer", icon: "🧠" },
  { label: "Copywriter (captions)", icon: "✍️" },
  { label: "Art Director (poster)", icon: "🎨" },
  { label: "Video Producer", icon: "🎬" },
  { label: "Quality Reviewer", icon: "🕵️" },
];

type LangKey = "english" | "chinese" | "malay" | "tamil";
const LANGS: { key: LangKey; label: string }[] = [
  { key: "english", label: "EN" },
  { key: "chinese", label: "中文" },
  { key: "malay", label: "BM" },
  { key: "tamil", label: "தமிழ்" },
];

interface ContentStudioProps {
  profile: BusinessProfile;
}

export default function ContentStudio({ profile }: ContentStudioProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<LangKey>("english");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPolling, setVideoPolling] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window));
  }, []);

  const handleMic = () => {
    if (!speechSupported) return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR || listening) { setListening(false); return; }
    const r = new SR(); r.lang = "en-US"; r.interimResults = true; r.continuous = false;
    r.onstart = () => setListening(true);
    r.onresult = (e: any) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setInput(t); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  };

  const pollVideo = useCallback(async (taskId: string) => {
    setVideoPolling(true); let a = 0;
    const poll = async () => {
      if (a >= 30) { setVideoPolling(false); return; } a++;
      try { const r = await fetch(`/api/video-status?taskId=${taskId}`); const d = await r.json(); if (d.status === "completed" && d.videoUrl) { setVideoUrl(d.videoUrl); setVideoPolling(false); return; } if (d.status === "failed") { setVideoPolling(false); return; } } catch {}
      setTimeout(poll, 3000);
    }; poll();
  }, []);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null); setResult(null); setVideoUrl(null); setVideoPolling(false); setStep(0);
    const si = setInterval(() => setStep(s => Math.min(s + 1, 4)), 4000);
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: input.trim(), profile }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setResult(data);
      if (data.videoTaskId) pollVideo(data.videoTaskId);
    } catch (e: any) { setError(e.message); }
    finally { clearInterval(si); setStep(5); setLoading(false); }
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text).catch(() => {}); };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Content Studio</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">Generate marketing assets for {profile.name}</p>
      </div>

      {/* Input */}
      <Card>
        <div className="relative">
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={3}
            placeholder={`What would you like to promote? e.g. "our new lunch set, $6.90, comes with drink"`}
            className="w-full bg-[#FAF8F5] border border-[#ECE6DF] rounded-[10px] px-4 py-3 pr-12 text-sm resize-none outline-none focus:border-[#F2541B] transition-colors placeholder:text-[#6B6B6B]/60"
          />
          {speechSupported && (
            <button onClick={handleMic} className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${listening ? "bg-red-100 text-red-600 animate-pulse" : "bg-[#ECE6DF] text-[#6B6B6B] hover:bg-orange-50 hover:text-[#F2541B]"}`}>🎤</button>
          )}
        </div>
        {listening && <p className="text-xs text-red-500 mt-1 animate-pulse">Listening…</p>}
        <div className="mt-3 flex gap-2">
          <Button onClick={handleGenerate} disabled={loading || !input.trim()}>
            {loading ? "Generating…" : "✨ Generate"}
          </Button>
        </div>
      </Card>

      {/* Progress */}
      {loading && (
        <Card padding="sm">
          <AgentProgress steps={AGENT_STEPS} currentStep={step} />
        </Card>
      )}

      {loading && !result && (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-[14px]" />
          <Skeleton className="h-64 rounded-[14px]" />
        </div>
      )}

      {error && <Card><p className="text-red-600 text-sm">⚠️ {error}</p></Card>}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-slideUp">
          {/* Captions */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">✍️ Captions</h3>
              {result.captions?.framework && <Badge variant="accent">{result.captions.framework}</Badge>}
            </div>
            <p className="text-xs text-[#6B6B6B] mb-3">Copy and paste to your platform. Best for Instagram/TikTok.</p>
            <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-[#FAF8F5] w-fit">
              {LANGS.map(l => (
                <button key={l.key} onClick={() => setLang(l.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${lang === l.key ? "bg-white shadow-sm text-[#F2541B]" : "text-[#6B6B6B]"}`}>{l.label}</button>
              ))}
            </div>
            <div className="relative p-4 bg-[#FAF8F5] rounded-[10px] border border-[#ECE6DF] min-h-[60px]">
              <p className="text-sm text-[#1A1410] whitespace-pre-wrap pr-8">{result.captions?.[lang] || "—"}</p>
              <button onClick={() => copyText(result.captions?.[lang] || "")} title="Copy"
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md bg-white border border-[#ECE6DF] text-xs hover:border-[#F2541B] transition-colors">📋</button>
            </div>
            {result.captions?.hashtags && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.captions.hashtags.map((t: string, i: number) => (
                  <span key={i} className="text-xs text-[#2563EB] font-medium">{t.startsWith("#") ? t : `#${t}`}</span>
                ))}
              </div>
            )}
          </Card>

          {/* Poster */}
          {result.posterImageUrl && result.poster && (
            <Card>
              <h3 className="text-base font-semibold mb-1">🎨 Poster</h3>
              <p className="text-xs text-[#6B6B6B] mb-3">Download for Instagram feed (4:5). Best posted 11am–1pm or 7–9pm.</p>
              <Poster data={result.poster} imageUrl={result.posterImageUrl} />
            </Card>
          )}

          {/* Video */}
          <Card>
            <h3 className="text-base font-semibold mb-1">🎬 Video</h3>
            <p className="text-xs text-[#6B6B6B] mb-3">Best for Reels / TikTok (9:16 vertical).</p>
            {videoUrl ? (
              <div className="max-w-[240px] mx-auto rounded-[14px] overflow-hidden border border-[#ECE6DF] aspect-[9/16]">
                <video src={videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              </div>
            ) : videoPolling || result.videoTaskId ? (
              <div className="flex items-center gap-3 p-4 rounded-[10px] bg-amber-50 border border-amber-200">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin" />
                <p className="text-amber-700 text-xs font-medium">Rendering video… (1-3 min)</p>
              </div>
            ) : (
              <p className="text-xs text-[#6B6B6B]">Video not available for this request.</p>
            )}
          </Card>

          {/* Quality */}
          {result.review && (
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🕵️</span>
                  <span className="text-xs text-[#6B6B6B]">{result.review.feedback}</span>
                </div>
                <Badge variant={result.review.score >= 8 ? "success" : result.review.score >= 5 ? "warning" : "default"}>
                  {result.review.score}/10
                </Badge>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

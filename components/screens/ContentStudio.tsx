"use client";

import { useState, useCallback, useEffect } from "react";
import { BusinessProfile } from "@/lib/profiles";
import { useAnalysisStore } from "@/lib/analysisStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import AgentProgress from "@/components/ui/AgentProgress";
import Poster, { PosterData } from "@/components/Poster";

const AGENT_STEPS = [
  { label: "Planning your content", icon: "🧠" },
  { label: "Writing captions", icon: "✍️" },
  { label: "Creating poster image", icon: "🎨" },
  { label: "Producing video", icon: "🎬" },
  { label: "Quality check", icon: "✅" },
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
  const { getStudio, setStudio, getEntry, addHistoryEntry, updateLastHistoryVideo } = useAnalysisStore();
  const studio = getStudio(profile.id);
  const analysisEntry = getEntry(profile.id);
  const recommendations = (analysisEntry.analysis as any)?.analysis?.productRecommendations || [];

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<LangKey>("english");
  const [videoPolling, setVideoPolling] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [videoDuration, setVideoDuration] = useState<"10s" | "15s">("10s");

  const input = studio.input;
  const result = studio.result;
  const videoUrl = studio.videoUrl;
  const wantPoster = studio.wantPoster;
  const wantVideo = studio.wantVideo;

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window));
  }, []);

  const handleMic = () => {
    if (!speechSupported) return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR || listening) { setListening(false); return; }
    const r = new SR(); r.lang = "en-US"; r.interimResults = true; r.continuous = false;
    r.onstart = () => setListening(true);
    r.onresult = (e: any) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setStudio(profile.id, { input: t }); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  };

  const pollVideo = useCallback(async (taskId: string) => {
    setVideoPolling(true); let a = 0;
    const poll = async () => {
      if (a >= 48) { setVideoPolling(false); return; } a++;
      try {
        const r = await fetch(`/api/video-status?taskId=${taskId}`);
        const d = await r.json();
        if (d.status === "completed" && d.videoUrl) {
          setStudio(profile.id, { videoUrl: d.videoUrl });
          // Update most recent history entry with the video URL
          updateLastHistoryVideo(profile.id, d.videoUrl);
          setVideoPolling(false); return;
        }
        if (d.status === "failed") { setVideoPolling(false); return; }
      } catch {}
      setTimeout(poll, 5000);
    }; poll();
  }, [profile.id, setStudio]);

  useEffect(() => {
    if (result?.videoTaskId && !videoUrl && !videoPolling) pollVideo(result.videoTaskId);
  }, [result?.videoTaskId, videoUrl, videoPolling, pollVideo]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true); setStep(0);
    setStudio(profile.id, { result: null, videoUrl: null });
    const si = setInterval(() => setStep(s => Math.min(s + 1, 4)), 4000);
    try {
      // Add video duration hint to the input
      const fullInput = `${input.trim()}${wantVideo ? ` [Generate a ${videoDuration === "10s" ? "10-second" : "15-second"} promotional video focusing specifically on this product]` : ""}`;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: fullInput, profile }),
      });
      const data = await res.json();
      if (!res.ok) { setStudio(profile.id, { result: { error: data.error } }); return; }
      setStudio(profile.id, { result: data });
      // Save FULL content to history simultaneously
      addHistoryEntry(profile.id, {
        type: "generation",
        summary: `Created content for: ${input.slice(0, 80)}`,
        input: input,
        captions: data.captions || null,
        posterImageUrl: data.posterImageUrl || null,
        poster: data.poster || null,
        videoUrl: null, // will be updated when video completes
        review: data.review || null,
        brief: data.brief || null,
      });
      if (data.videoTaskId && wantVideo) pollVideo(data.videoTaskId);
    } catch (e: any) {
      setStudio(profile.id, { result: { error: e.message } });
    } finally { clearInterval(si); setStep(5); setLoading(false); }
  };

  const selectProduct = (product: string) => {
    setStudio(profile.id, { input: `Promote our ${product} — create marketing content that highlights this product` });
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text).catch(() => {}); };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Content Studio</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">Create marketing content for {profile.name}</p>
      </div>

      {/* Product Recommendations (if analysis has been run) */}
      {recommendations.length > 0 && !result && (
        <Card>
          <h3 className="text-sm font-semibold text-[#1A1410] mb-2">🎯 Recommended Products to Promote</h3>
          <p className="text-xs text-[#6B6B6B] mb-3">Based on your market analysis, these products will perform best right now:</p>
          <div className="flex flex-wrap gap-2">
            {recommendations.slice(0, 5).map((rec: any, i: number) => (
              <button
                key={i}
                onClick={() => selectProduct(rec.product)}
                className={`px-3 py-2 rounded-[10px] border text-left transition-all hover:border-[#F2541B] hover:bg-orange-50/50 ${rec.priority === "high" ? "border-[#F2541B] bg-orange-50/30" : "border-[#ECE6DF]"}`}
              >
                <p className="text-sm font-medium text-[#1A1410]">{rec.product}</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">{rec.reason?.slice(0, 50)}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Input */}
      <Card>
        <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-2 block">
          What would you like to promote?
        </label>
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setStudio(profile.id, { input: e.target.value })}
            rows={3}
            placeholder="e.g. 'Our Chicken Biryani — it's our best seller, very aromatic, family recipe'"
            className="w-full bg-[#FAF8F5] border border-[#ECE6DF] rounded-[10px] px-4 py-3 pr-12 text-sm resize-none outline-none focus:border-[#F2541B] transition-colors placeholder:text-[#6B6B6B]/50"
          />
          {speechSupported && (
            <button onClick={handleMic} className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${listening ? "bg-red-100 text-red-600 animate-pulse" : "bg-[#ECE6DF] text-[#6B6B6B] hover:bg-orange-50 hover:text-[#F2541B]"}`}>🎤</button>
          )}
        </div>
        {listening && <p className="text-xs text-red-500 mt-1 animate-pulse">🔴 Listening…</p>}

        {/* Options */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={wantPoster} onChange={e => setStudio(profile.id, { wantPoster: e.target.checked })}
              className="w-4 h-4 rounded border-[#ECE6DF] text-[#F2541B] focus:ring-[#F2541B]" />
            <span className="text-sm text-[#1A1410]">🎨 Poster</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={wantVideo} onChange={e => setStudio(profile.id, { wantVideo: e.target.checked })}
              className="w-4 h-4 rounded border-[#ECE6DF] text-[#F2541B] focus:ring-[#F2541B]" />
            <span className="text-sm text-[#1A1410]">🎬 Video</span>
          </label>
          {wantVideo && (
            <div className="flex items-center gap-2 ml-2">
              <button onClick={() => setVideoDuration("10s")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${videoDuration === "10s" ? "bg-[#F2541B] text-white" : "bg-[#FAF8F5] border border-[#ECE6DF] text-[#6B6B6B]"}`}>
                10 sec
              </button>
              <button onClick={() => setVideoDuration("15s")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${videoDuration === "15s" ? "bg-[#F2541B] text-white" : "bg-[#FAF8F5] border border-[#ECE6DF] text-[#6B6B6B]"}`}>
                15 sec
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <Button onClick={handleGenerate} disabled={loading || !input.trim()} size="lg">
            {loading ? "Creating your content…" : "✨ Generate Content"}
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
          <Skeleton className="h-48 rounded-[14px]" />
        </div>
      )}

      {result?.error && <Card><p className="text-red-600 text-sm">⚠️ {result.error}</p></Card>}

      {/* Results */}
      {result && !result.error && (
        <div className="space-y-6 animate-slideUp">
          {/* Captions */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">✍️ Your Captions</h3>
              {result.captions?.framework && <Badge variant="accent">{result.captions.framework}</Badge>}
            </div>
            <p className="text-xs text-[#6B6B6B] mb-3">Ready to copy and paste to Instagram, TikTok, or Facebook.</p>
            <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-[#FAF8F5] w-fit">
              {LANGS.map(l => (
                <button key={l.key} onClick={() => setLang(l.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${lang === l.key ? "bg-white shadow-sm text-[#F2541B]" : "text-[#6B6B6B]"}`}>{l.label}</button>
              ))}
            </div>
            <div className="relative p-5 bg-[#FAF8F5] rounded-[10px] border border-[#ECE6DF] min-h-[120px]">
              <p className="text-base text-[#1A1410] whitespace-pre-wrap leading-relaxed pr-10">
                {result.captions?.[lang] || "—"}
              </p>
              <button onClick={() => copyText(result.captions?.[lang] || "")} title="Copy"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md bg-white border border-[#ECE6DF] text-sm hover:border-[#F2541B] transition-colors">📋</button>
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
          {wantPoster && result.posterImageUrl && result.poster && (
            <Card>
              <h3 className="text-base font-semibold mb-1">🎨 Your Poster</h3>
              <p className="text-xs text-[#6B6B6B] mb-3">Download and share on Instagram or Facebook. Best size for feed posts.</p>
              <Poster data={result.poster} imageUrl={result.posterImageUrl} />
            </Card>
          )}

          {/* Video */}
          {wantVideo && (
            <Card>
              <h3 className="text-base font-semibold mb-1">🎬 Your Video</h3>
              <p className="text-xs text-[#6B6B6B] mb-3">Share on Reels, TikTok, or YouTube Shorts.</p>
              {videoUrl ? (
                <div className="max-w-[240px] mx-auto rounded-[14px] overflow-hidden border border-[#ECE6DF] aspect-[9/16]">
                  <video src={videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                </div>
              ) : videoPolling || result.videoTaskId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-[10px] bg-amber-50 border border-amber-200">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin" />
                    <p className="text-amber-700 text-xs font-medium">Creating your video… This usually takes 1-3 minutes. Your captions and poster are ready above!</p>
                  </div>
                  <div className="max-w-[240px] mx-auto rounded-[14px] overflow-hidden border border-[#ECE6DF] aspect-[9/16] bg-[#1A1410] flex items-center justify-center">
                    <div className="text-center p-4">
                      <span className="text-3xl block mb-2">🎬</span>
                      <p className="text-white/70 text-xs">Your video will appear here</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#6B6B6B]">Video was not generated for this content.</p>
              )}
            </Card>
          )}

          {/* Quality */}
          {result.review && (
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✅</span>
                  <span className="text-xs text-[#6B6B6B]">{result.review.feedback}</span>
                </div>
                <Badge variant={result.review.score >= 8 ? "success" : "warning"}>
                  Quality: {result.review.score}/10
                </Badge>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

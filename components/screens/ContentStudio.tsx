"use client";

import { useState, useCallback, useEffect } from "react";
import { BusinessProfile } from "@/lib/profiles";
import { useAnalysisStore, Campaign } from "@/lib/analysisStore";
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
  { key: "english", label: "EN" }, { key: "chinese", label: "中文" },
  { key: "malay", label: "BM" }, { key: "tamil", label: "தமிழ்" },
];

interface ContentStudioProps {
  profile: BusinessProfile;
}

export default function ContentStudio({ profile }: ContentStudioProps) {
  const {
    getEntry, getActiveCampaign, activeCampaignId,
    setActiveCampaignId, createCampaign, addCampaignActivity, updateCampaignAssets,
  } = useAnalysisStore();

  const analysisEntry = getEntry(profile.id);
  const recommendations = (analysisEntry.analysis as any)?.analysis?.productRecommendations || [];
  const campaign = getActiveCampaign(profile.id);

  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignProduct, setCampaignProduct] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<LangKey>("english");
  const [videoPolling, setVideoPolling] = useState(false);
  const [videoDuration, setVideoDuration] = useState<"10s" | "15s">("10s");
  const [wantPoster, setWantPoster] = useState(true);
  const [wantVideo, setWantVideo] = useState(true);
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
    r.onresult = (e: any) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setCampaignProduct(t); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  };

  const pollVideo = useCallback(async (taskId: string, cId: string) => {
    setVideoPolling(true); let a = 0;
    const poll = async () => {
      if (a >= 48) { setVideoPolling(false); return; } a++;
      try {
        const r = await fetch(`/api/video-status?taskId=${taskId}`);
        const d = await r.json();
        if (d.status === "completed" && d.videoUrl) {
          updateCampaignAssets(profile.id, cId, { videoUrl: d.videoUrl });
          addCampaignActivity(profile.id, cId, { type: "video_generation", label: "Video Ready", summary: "Video generated successfully", data: { videoUrl: d.videoUrl } });
          setVideoPolling(false); return;
        }
        if (d.status === "failed") { setVideoPolling(false); return; }
      } catch {}
      setTimeout(poll, 5000);
    }; poll();
  }, [profile.id, updateCampaignAssets, addCampaignActivity]);

  // Resume polling if campaign has taskId but no videoUrl
  useEffect(() => {
    if (campaign?.videoTaskId && !campaign.videoUrl && !videoPolling) {
      pollVideo(campaign.videoTaskId, campaign.id);
    }
  }, [campaign?.videoTaskId, campaign?.videoUrl, campaign?.id, videoPolling, pollVideo]);

  const handleCreateCampaign = () => {
    if (!campaignProduct.trim()) { alert("Please describe what you want to promote."); return; }
    const c = createCampaign(
      profile.id,
      campaignName || `${campaignProduct.slice(0, 30)} Campaign`,
      campaignProduct,
      campaignGoal || "Increase visibility and sales"
    );
    addCampaignActivity(profile.id, c.id, { type: "market_analysis", label: "Campaign Created", summary: `New campaign: ${c.name}` });
    setShowNewCampaign(false);
    setCampaignName(""); setCampaignProduct(""); setCampaignGoal("");
    // Auto-trigger content generation after a brief render cycle
    setTimeout(() => handleGenerateForCampaign(c), 100);
  };

  const handleGenerateForCampaign = async (c: Campaign) => {
    setLoading(true); setStep(0);
    const si = setInterval(() => setStep(s => Math.min(s + 1, 4)), 4000);
    try {
      const fullInput = `Promote: ${c.product}. Campaign goal: ${c.goal}.${wantVideo ? ` [Generate a ${videoDuration === "10s" ? "10-second" : "15-second"} promotional video focusing on ${c.product}]` : ""}`;
      addCampaignActivity(profile.id, c.id, { type: "content_generation", label: "Generating Content", summary: `Creating marketing content for ${c.product}` });
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: fullInput, profile }) });
      const data = await res.json();
      if (!res.ok) { addCampaignActivity(profile.id, c.id, { type: "content_generation", label: "Error", summary: data.error || "Failed" }); return; }
      updateCampaignAssets(profile.id, c.id, { captions: data.captions, posterImageUrl: data.posterImageUrl, poster: data.poster, videoTaskId: data.videoTaskId, review: data.review });
      if (data.captions) addCampaignActivity(profile.id, c.id, { type: "content_generation", label: "Captions Created", summary: data.captions.english?.slice(0, 80) || "Done", data: data.captions });
      if (data.posterImageUrl) addCampaignActivity(profile.id, c.id, { type: "image_generation", label: "Poster Created", summary: "Marketing poster generated" });
      if (data.videoTaskId) { addCampaignActivity(profile.id, c.id, { type: "video_generation", label: "Video Started", summary: "Video rendering started" }); if (wantVideo) pollVideo(data.videoTaskId, c.id); }
      if (data.review) addCampaignActivity(profile.id, c.id, { type: "recommendation", label: "Quality Review", summary: `Score: ${data.review.score}/10` });
    } catch (e: any) { addCampaignActivity(profile.id, c.id, { type: "content_generation", label: "Error", summary: e.message }); }
    finally { clearInterval(si); setStep(5); setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!campaign) return;
    setLoading(true); setStep(0);
    const si = setInterval(() => setStep(s => Math.min(s + 1, 4)), 4000);
    try {
      const fullInput = `Promote: ${campaign.product}. Campaign goal: ${campaign.goal}.${wantVideo ? ` [Generate a ${videoDuration === "10s" ? "10-second" : "15-second"} promotional video focusing on ${campaign.product}]` : ""}`;

      addCampaignActivity(profile.id, campaign.id, { type: "content_generation", label: "Generating Content", summary: `Creating marketing content for ${campaign.product}` });

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: fullInput, profile }),
      });
      const data = await res.json();
      if (!res.ok) { addCampaignActivity(profile.id, campaign.id, { type: "content_generation", label: "Error", summary: data.error || "Generation failed" }); return; }

      // Save all assets to campaign
      updateCampaignAssets(profile.id, campaign.id, {
        captions: data.captions,
        posterImageUrl: data.posterImageUrl,
        poster: data.poster,
        videoTaskId: data.videoTaskId,
        review: data.review,
      });

      // Log activities
      if (data.captions) addCampaignActivity(profile.id, campaign.id, { type: "content_generation", label: "Captions Created", summary: data.captions.english?.slice(0, 80) || "Captions generated", data: data.captions });
      if (data.posterImageUrl) addCampaignActivity(profile.id, campaign.id, { type: "image_generation", label: "Poster Created", summary: "Marketing poster generated", data: { posterImageUrl: data.posterImageUrl, poster: data.poster } });
      if (data.videoTaskId) {
        addCampaignActivity(profile.id, campaign.id, { type: "video_generation", label: "Video Started", summary: "Video rendering started" });
        if (wantVideo) pollVideo(data.videoTaskId, campaign.id);
      }
      if (data.review) addCampaignActivity(profile.id, campaign.id, { type: "recommendation", label: "Quality Review", summary: `Score: ${data.review.score}/10 — ${data.review.feedback}` });

    } catch (e: any) {
      addCampaignActivity(profile.id, campaign.id, { type: "content_generation", label: "Error", summary: e.message || "Network error" });
    } finally { clearInterval(si); setStep(5); setLoading(false); }
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text).catch(() => {}); };

  // ─── No active campaign: show campaign creation ────────────────────────────

  if (!campaign || showNewCampaign) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Content Studio</h2>
          <p className="text-[#6B6B6B] text-sm mt-1">Create a new marketing campaign for {profile.name}</p>
        </div>

        {/* Product Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-[#1A1410] mb-2">🎯 AI Recommends You Promote</h3>
            <p className="text-xs text-[#6B6B6B] mb-3">Based on market trends, these products will perform best:</p>
            <div className="flex flex-wrap gap-2">
              {recommendations.slice(0, 5).map((rec: any, i: number) => (
                <button key={i} onClick={() => setCampaignProduct(rec.product)}
                  className={`px-3 py-2 rounded-[10px] border text-left transition-all hover:border-[#F2541B] hover:bg-orange-50/50 ${campaignProduct === rec.product ? "border-[#F2541B] bg-orange-50" : "border-[#ECE6DF]"}`}>
                  <p className="text-sm font-medium text-[#1A1410]">{rec.product}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{rec.reason?.slice(0, 40)}</p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* New Campaign Form */}
        <Card>
          <h3 className="text-base font-semibold text-[#1A1410] mb-4">🚀 Start New Campaign</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">What are you promoting? *</label>
              <div className="relative">
                <input className="w-full bg-[#FAF8F5] border border-[#ECE6DF] rounded-[10px] px-4 py-3 pr-12 text-sm outline-none focus:border-[#F2541B] placeholder:text-[#6B6B6B]/50"
                  placeholder="e.g. Chicken Biryani, Grand Opening, Weekend Special"
                  value={campaignProduct} onChange={e => setCampaignProduct(e.target.value)} />
                {speechSupported && (
                  <button onClick={handleMic} className={`absolute right-3 top-2.5 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${listening ? "bg-red-100 text-red-600 animate-pulse" : "bg-[#ECE6DF] text-[#6B6B6B] hover:text-[#F2541B]"}`}>🎤</button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Campaign Name (optional)</label>
              <input className="w-full bg-[#FAF8F5] border border-[#ECE6DF] rounded-[10px] px-4 py-3 text-sm outline-none focus:border-[#F2541B] placeholder:text-[#6B6B6B]/50"
                placeholder="e.g. June Biryani Promo" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Goal (optional)</label>
              <input className="w-full bg-[#FAF8F5] border border-[#ECE6DF] rounded-[10px] px-4 py-3 text-sm outline-none focus:border-[#F2541B] placeholder:text-[#6B6B6B]/50"
                placeholder="e.g. Get more lunch orders, Promote new item" value={campaignGoal} onChange={e => setCampaignGoal(e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wantPoster} onChange={e => setWantPoster(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-[#1A1410]">🎨 Poster</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wantVideo} onChange={e => setWantVideo(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-[#1A1410]">🎬 Video</span>
              </label>
              {wantVideo && (
                <div className="flex gap-2">
                  <button onClick={() => setVideoDuration("10s")} className={`px-3 py-1 rounded-md text-xs font-medium ${videoDuration === "10s" ? "bg-[#F2541B] text-white" : "bg-[#FAF8F5] border border-[#ECE6DF] text-[#6B6B6B]"}`}>10s</button>
                  <button onClick={() => setVideoDuration("15s")} className={`px-3 py-1 rounded-md text-xs font-medium ${videoDuration === "15s" ? "bg-[#F2541B] text-white" : "bg-[#FAF8F5] border border-[#ECE6DF] text-[#6B6B6B]"}`}>15s</button>
                </div>
              )}
            </div>
            <Button onClick={handleCreateCampaign} size="lg" disabled={!campaignProduct.trim()}>
              ✨ Create Campaign & Generate Content
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Active campaign workspace ─────────────────────────────────────────────

  const hasContent = campaign.captions || campaign.posterImageUrl;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Campaign Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">{campaign.name}</h2>
          <p className="text-[#6B6B6B] text-sm mt-0.5">Promoting: {campaign.product}</p>
        </div>
        <div className="flex gap-2">
          {!hasContent && !loading && (
            <Button onClick={handleGenerate}>✨ Generate Content</Button>
          )}
          <Button variant="secondary" onClick={() => { setShowNewCampaign(true); setActiveCampaignId(null); }}>
            + New Campaign
          </Button>
        </div>
      </div>

      {/* Progress */}
      {loading && (
        <Card padding="sm">
          <AgentProgress steps={AGENT_STEPS} currentStep={step} />
        </Card>
      )}
      {loading && !hasContent && <Skeleton className="h-48 rounded-[14px]" />}

      {/* Generated Content */}
      {hasContent && (
        <div className="space-y-5 animate-slideUp">
          {/* Captions */}
          {campaign.captions && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">✍️ Captions</h3>
                {campaign.captions.framework && <Badge variant="accent">{campaign.captions.framework}</Badge>}
              </div>
              <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-[#FAF8F5] w-fit">
                {LANGS.map(l => (
                  <button key={l.key} onClick={() => setLang(l.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${lang === l.key ? "bg-white shadow-sm text-[#F2541B]" : "text-[#6B6B6B]"}`}>{l.label}</button>
                ))}
              </div>
              <div className="relative p-5 bg-[#FAF8F5] rounded-[10px] border border-[#ECE6DF] min-h-[100px]">
                <p className="text-base text-[#1A1410] whitespace-pre-wrap leading-relaxed pr-10">{campaign.captions[lang] || "—"}</p>
                <button onClick={() => copyText(campaign.captions[lang] || "")} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md bg-white border border-[#ECE6DF] text-sm hover:border-[#F2541B]">📋</button>
              </div>
              {campaign.captions.hashtags && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {campaign.captions.hashtags.map((t: string, i: number) => (
                    <span key={i} className="text-xs text-[#2563EB] font-medium">{t.startsWith("#") ? t : `#${t}`}</span>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Poster */}
          {wantPoster && campaign.posterImageUrl && campaign.poster && (
            <Card>
              <h3 className="text-base font-semibold mb-3">🎨 Poster</h3>
              <Poster data={campaign.poster} imageUrl={campaign.posterImageUrl} />
            </Card>
          )}

          {/* Video */}
          {wantVideo && (
            <Card>
              <h3 className="text-base font-semibold mb-3">🎬 Video</h3>
              {campaign.videoUrl ? (
                <div className="space-y-3">
                  <div className="max-w-[240px] mx-auto rounded-[14px] overflow-hidden border border-[#ECE6DF] aspect-[9/16]">
                    <video src={campaign.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  </div>
                  <a
                    href={campaign.videoUrl}
                    download={`${campaign.name || "video"}-hawkerhero.mp4`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] font-semibold text-sm text-white bg-[#F2541B] hover:bg-[#D8430E] transition-colors"
                  >
                    ⬇️ Download Video
                  </a>
                </div>
              ) : videoPolling || campaign.videoTaskId ? (
                <div className="flex items-center gap-3 p-4 rounded-[10px] bg-amber-50 border border-amber-200">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin" />
                  <p className="text-amber-700 text-xs font-medium">Creating your video… (1-3 min)</p>
                </div>
              ) : null}
            </Card>
          )}

          {/* Review */}
          {campaign.review && (
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B6B6B]">✅ {campaign.review.feedback}</span>
                <Badge variant={campaign.review.score >= 8 ? "success" : "warning"}>{campaign.review.score}/10</Badge>
              </div>
            </Card>
          )}

          {/* Regenerate */}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleGenerate} disabled={loading}>🔄 Regenerate</Button>
            <Button variant="secondary" onClick={() => { setShowNewCampaign(true); setActiveCampaignId(null); }}>+ New Campaign</Button>
          </div>
        </div>
      )}

      {/* Campaign Timeline */}
      {campaign.activities.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-[#1A1410] mb-3">📋 Campaign Timeline</h3>
          <div className="space-y-2">
            {campaign.activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#FAF8F5]">
                <div className="w-2 h-2 rounded-full bg-[#F2541B] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#1A1410]">{act.label}</span>
                    <span className="text-[10px] text-[#6B6B6B]">{new Date(act.timestamp).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] truncate">{act.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

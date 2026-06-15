"use client";

import { BusinessProfile } from "@/lib/profiles";
import { useAnalysisStore } from "@/lib/analysisStore";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import AgentProgress from "@/components/ui/AgentProgress";
import { useState, useEffect } from "react";

const AGENT_STEPS = [
  { label: "Searching market trends", icon: "🧠" },
  { label: "Analyzing competitors", icon: "🏆" },
  { label: "Identifying positioning", icon: "🎯" },
  { label: "Generating content plan", icon: "📅" },
  { label: "Quality review", icon: "🕵️" },
];

interface MarketAnalysisProps {
  profile: BusinessProfile;
}

export default function MarketAnalysis({ profile }: MarketAnalysisProps) {
  const { getEntry, setAnalysis, setLoading, setError } = useAnalysisStore();
  const entry = getEntry(profile.id);
  const [currentStep, setCurrentStep] = useState(0);

  const runAnalysis = async () => {
    setLoading(profile.id);
    setCurrentStep(0);
    const si = setInterval(() => setCurrentStep((s) => Math.min(s + 1, 4)), 3500);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: `${profile.name}: ${profile.description}. We offer: ${profile.offerings}`,
          profile,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(profile.id, data.error || "Failed"); return; }
      setAnalysis(profile.id, data);
    } catch (e: any) {
      setError(profile.id, e.message || "Network error");
    } finally {
      clearInterval(si);
      setCurrentStep(5);
    }
  };

  const result = entry.analysis;
  const isLoading = entry.status === "loading";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Market Analysis</h2>
          <p className="text-[#6B6B6B] text-sm mt-1">AI-powered insights for {profile.name}</p>
        </div>
        <Button onClick={runAnalysis} disabled={isLoading}>
          {isLoading ? "Analyzing…" : result ? "🔄 Re-run Analysis" : "🧠 Run Analysis"}
        </Button>
      </div>

      {/* Agent Progress */}
      {isLoading && (
        <Card>
          <h3 className="text-sm font-semibold mb-3 text-[#6B6B6B] uppercase tracking-wide">Agent Pipeline</h3>
          <AgentProgress steps={AGENT_STEPS} currentStep={currentStep} />
        </Card>
      )}

      {isLoading && !result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-[14px]" />)}
        </div>
      )}

      {entry.status === "error" && entry.error && (
        <Card><p className="text-red-600 text-sm">⚠️ {entry.error}</p></Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-slideUp">
          {/* Welcome Back */}
          {result.returning && result.welcomeBack && (
            <Card className="bg-violet-50 border-violet-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">👋</span>
                <h3 className="font-bold text-violet-800">Welcome back!</h3>
              </div>
              <p className="text-sm text-violet-700">{result.welcomeBack}</p>
              {result.whatsChanged && (
                <p className="text-xs text-violet-600 mt-2 p-2 bg-white/60 rounded-lg">📈 {result.whatsChanged}</p>
              )}
            </Card>
          )}

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Product" value={result.brief?.dish || "—"} icon="🍽️" />
            <Stat label="USP" value={(result.brief?.usp || "—").slice(0, 30)} icon="⭐" />
            <Stat label="Price" value={result.brief?.price || "—"} icon="💰" />
            <Stat label="Quality" value={`${result.review?.score || 0}/10`} icon="✅" trend="up" />
          </div>

          {/* Market Overview */}
          <Card>
            <h3 className="text-base font-semibold mb-3">Market Overview</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase font-medium mb-1">Target Audience</p>
                <p className="text-sm text-[#1A1410]">{result.brief?.audience || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase font-medium mb-1">Brand Vibe</p>
                <p className="text-sm text-[#1A1410]">{result.brief?.vibe || "—"}</p>
              </div>
            </div>
          </Card>

          {/* Content Plan Preview */}
          {result.contentPlan && result.contentPlan.length > 0 && (
            <Card>
              <h3 className="text-base font-semibold mb-3">📅 Content Plan ({result.contentPlan.length} ideas)</h3>
              <div className="space-y-2">
                {result.contentPlan.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-[10px]">
                    <span className="text-sm font-medium text-[#1A1410]">{item.idea}</span>
                    <Badge variant="info">{item.platform}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Sources */}
          {result.sources && result.sources.length > 0 && (
            <Card padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="info">🌐 Live Data</Badge>
                <span className="text-xs text-[#6B6B6B]">{result.sources.length} sources grounded</span>
              </div>
              <div className="space-y-1.5">
                {result.sources.slice(0, 3).map((src: string, i: number) => (
                  <p key={i} className="text-xs text-[#6B6B6B] truncate">{src.slice(0, 120)}</p>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {!isLoading && !result && entry.status !== "error" && (
        <Card className="text-center py-16">
          <span className="text-4xl mb-3 block">🧠</span>
          <h3 className="text-lg font-semibold">Ready to analyze</h3>
          <p className="text-sm text-[#6B6B6B] mt-1">Click &ldquo;Run Analysis&rdquo; to get AI-powered market insights.</p>
        </Card>
      )}
    </div>
  );
}

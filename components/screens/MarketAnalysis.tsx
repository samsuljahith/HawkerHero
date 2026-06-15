"use client";

import { useState, useEffect } from "react";
import { BusinessProfile } from "@/lib/profiles";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import AgentProgress from "@/components/ui/AgentProgress";

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
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true); setError(null); setResult(null); setCurrentStep(0);
    const stepInterval = setInterval(() => setCurrentStep((s) => Math.min(s + 1, 4)), 3500);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: `${profile.name}: ${profile.description}. We offer: ${profile.offerings}`, profile }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setResult(data);
    } catch (e: any) { setError(e.message); }
    finally { clearInterval(stepInterval); setCurrentStep(5); setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Market Analysis</h2>
          <p className="text-[#6B6B6B] text-sm mt-1">AI-powered insights for {profile.name}</p>
        </div>
        <Button onClick={runAnalysis} disabled={loading}>
          {loading ? "Analyzing…" : "🧠 Run Analysis"}
        </Button>
      </div>

      {/* Agent Progress */}
      {loading && (
        <Card>
          <h3 className="text-sm font-semibold mb-3 text-[#6B6B6B] uppercase tracking-wide">Agent Pipeline</h3>
          <AgentProgress steps={AGENT_STEPS} currentStep={currentStep} />
        </Card>
      )}

      {/* Loading Skeletons */}
      {loading && !result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-[14px]" />)}
        </div>
      )}

      {error && (
        <Card><p className="text-red-600 text-sm">⚠️ {error}</p></Card>
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
            <Stat label="USP" value={result.brief?.usp?.slice(0, 30) || "—"} icon="⭐" />
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

          {/* Sources */}
          {result.sources?.length > 0 && (
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

      {!loading && !result && (
        <Card className="text-center py-16">
          <span className="text-4xl mb-3 block">🧠</span>
          <h3 className="text-lg font-semibold">Ready to analyze</h3>
          <p className="text-sm text-[#6B6B6B] mt-1">Click &ldquo;Run Analysis&rdquo; to get AI-powered market insights for your business.</p>
        </Card>
      )}
    </div>
  );
}

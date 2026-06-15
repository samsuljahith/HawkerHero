"use client";

import { BusinessProfile } from "@/lib/profiles";
import { useAnalysisStore } from "@/lib/analysisStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import AgentProgress from "@/components/ui/AgentProgress";
import { useState } from "react";

const AGENT_STEPS = [
  { label: "Reading your products & services", icon: "📋" },
  { label: "Researching market trends", icon: "📈" },
  { label: "Analyzing competitors", icon: "🏆" },
  { label: "Matching trends to your products", icon: "🎯" },
  { label: "Creating recommendations", icon: "💡" },
];

interface MarketAnalysisProps {
  profile: BusinessProfile;
}

export default function MarketAnalysis({ profile }: MarketAnalysisProps) {
  const { getEntry, setAnalysis, setLoading, setError, addHistoryEntry } = useAnalysisStore();
  const entry = getEntry(profile.id);
  const [currentStep, setCurrentStep] = useState(0);

  const runAnalysis = async () => {
    setLoading(profile.id);
    setCurrentStep(0);
    const si = setInterval(() => setCurrentStep((s) => Math.min(s + 1, 4)), 4000);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, language: "english" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(profile.id, data.error || "Analysis failed"); return; }
      setAnalysis(profile.id, data);
      addHistoryEntry(profile.id, {
        type: "analysis",
        summary: `Market analysis completed. Score: ${data.analysis?.score?.overall || "?"}/10. Top recommendation: ${data.analysis?.productRecommendations?.[0]?.product || "—"}`,
        contentPlan: data.analysis?.contentPlan || null,
        brief: data.analysis?.businessSummary || null,
      });
    } catch (e: any) {
      setError(profile.id, e.message || "Network error");
    } finally {
      clearInterval(si);
      setCurrentStep(5);
    }
  };

  const result = entry.analysis;
  const analysis = (result as any)?.analysis;
  const isLoading = entry.status === "loading";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Market Analysis</h2>
          <p className="text-[#6B6B6B] text-sm mt-1">
            Understand your market, discover what&apos;s trending, and find out which products to promote.
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={isLoading}>
          {isLoading ? "Analyzing…" : analysis ? "🔄 Run Again" : "🧠 Analyze My Business"}
        </Button>
      </div>

      {/* Agent Progress */}
      {isLoading && (
        <Card>
          <p className="text-xs text-[#6B6B6B] mb-3">Our AI agents are working on your analysis…</p>
          <AgentProgress steps={AGENT_STEPS} currentStep={currentStep} />
        </Card>
      )}

      {isLoading && !analysis && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-[14px]" />)}
        </div>
      )}

      {entry.status === "error" && entry.error && (
        <Card><p className="text-red-600 text-sm">⚠️ {entry.error}</p></Card>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-5 animate-slideUp">
          {/* Welcome Back */}
          {(result as any)?.returning && (result as any)?.welcomeBack && (
            <Card className="bg-violet-50 border-violet-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">👋</span>
                <h3 className="font-bold text-violet-800">Welcome back!</h3>
              </div>
              <p className="text-sm text-violet-700">{(result as any).welcomeBack}</p>
              {(result as any).whatsChanged && (
                <p className="text-xs text-violet-600 mt-2 p-2 bg-white/60 rounded-lg">📈 {(result as any).whatsChanged}</p>
              )}
            </Card>
          )}

          {/* Score */}
          {analysis.score && (
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A1410]">Your Marketing Readiness Score</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{analysis.score.explanation}</p>
                </div>
                <div className={`text-2xl font-bold px-4 py-2 rounded-[10px] ${analysis.score.overall >= 7 ? "bg-emerald-50 text-[#0FA968]" : analysis.score.overall >= 5 ? "bg-amber-50 text-[#E0A800]" : "bg-red-50 text-red-600"}`}>
                  {analysis.score.overall}/10
                </div>
              </div>
            </Card>
          )}

          {/* Business Summary */}
          {analysis.businessSummary && (
            <Card>
              <h3 className="text-base font-semibold text-[#1A1410] mb-3">📋 Your Business at a Glance</h3>
              <p className="text-sm text-[#6B6B6B] mb-3">{analysis.businessSummary.whatYouDo}</p>
              {analysis.businessSummary.mainProducts?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-2">Your Products & Services</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.businessSummary.mainProducts.map((p: string, i: number) => (
                      <Badge key={i} variant="default">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Market Insights */}
          {analysis.marketInsights && (
            <Card>
              <h3 className="text-base font-semibold text-[#1A1410] mb-3">📈 What&apos;s Happening in Your Market</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">Market Overview</p>
                  <p className="text-sm text-[#1A1410]">{analysis.marketInsights.overview}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-[10px] border border-emerald-100">
                  <p className="text-xs font-medium text-[#0FA968] uppercase mb-1">🔥 What&apos;s Hot Right Now</p>
                  <p className="text-sm text-[#1A1410]">{analysis.marketInsights.whatsHot}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-[10px] border border-blue-100">
                  <p className="text-xs font-medium text-[#2563EB] uppercase mb-1">💡 Your Biggest Opportunity</p>
                  <p className="text-sm text-[#1A1410]">{analysis.marketInsights.opportunity}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Product Recommendations — THE KEY FEATURE */}
          {analysis.productRecommendations?.length > 0 && (
            <Card>
              <h3 className="text-base font-semibold text-[#1A1410] mb-1">🎯 Which Products to Promote</h3>
              <p className="text-xs text-[#6B6B6B] mb-4">Based on current market trends and your product catalog, here&apos;s what we recommend promoting:</p>
              <div className="space-y-3">
                {analysis.productRecommendations.map((rec: any, i: number) => (
                  <div key={i} className={`p-4 rounded-[10px] border ${rec.priority === "high" ? "border-[#F2541B] bg-orange-50/50" : rec.priority === "medium" ? "border-[#E0A800] bg-amber-50/30" : "border-[#ECE6DF] bg-[#FAF8F5]"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-[#1A1410]">{rec.product}</h4>
                      <Badge variant={rec.priority === "high" ? "accent" : rec.priority === "medium" ? "warning" : "default"}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-[#6B6B6B] mb-2"><span className="font-medium">Why:</span> {rec.reason}</p>
                    <p className="text-xs text-[#6B6B6B] mb-2"><span className="font-medium">Matches trend:</span> {rec.trendMatch}</p>
                    <div className="p-2 bg-white rounded-lg border border-[#ECE6DF]">
                      <p className="text-xs font-medium text-[#F2541B]">✅ What to do:</p>
                      <p className="text-sm text-[#1A1410] mt-0.5">{rec.suggestedAction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Wins */}
          {analysis.quickWins?.length > 0 && (
            <Card>
              <h3 className="text-base font-semibold text-[#1A1410] mb-3">⚡ Quick Wins — Do These Today</h3>
              <div className="space-y-2">
                {analysis.quickWins.map((win: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#FAF8F5] rounded-[10px]">
                    <span className="text-base">✓</span>
                    <p className="text-sm text-[#1A1410]">{win}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Competitor Insights */}
          {analysis.competitorInsights && (
            <Card>
              <h3 className="text-base font-semibold text-[#1A1410] mb-3">🏆 Your Competition</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">What competitors are doing</p>
                  <p className="text-sm text-[#1A1410]">{analysis.competitorInsights.overview}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-[10px]">
                  <p className="text-xs font-medium text-[#0FA968] uppercase mb-1">💪 Your Advantage</p>
                  <p className="text-sm text-[#1A1410]">{analysis.competitorInsights.yourAdvantage}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-[10px]">
                  <p className="text-xs font-medium text-[#2563EB] uppercase mb-1">🎯 Gap You Can Fill</p>
                  <p className="text-sm text-[#1A1410]">{analysis.competitorInsights.gap}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Sources */}
          {(result as any)?.sources?.length > 0 && (
            <Card padding="sm">
              <div className="flex items-center gap-2">
                <Badge variant="info">🌐 Live Research</Badge>
                <span className="text-xs text-[#6B6B6B]">Based on real-time data from {(result as any).sources.length} sources</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !analysis && entry.status !== "error" && (
        <Card className="text-center py-12">
          <span className="text-4xl block mb-3">🧠</span>
          <h3 className="text-lg font-semibold text-[#1A1410]">Ready to analyze your business</h3>
          <p className="text-sm text-[#6B6B6B] mt-2 max-w-md mx-auto">
            Our AI will look at your products, research current market trends, check what competitors are doing,
            and tell you exactly which products to promote and why.
          </p>
          {!profile.offerings && !profile.uploadedData && (
            <p className="text-xs text-[#E0A800] mt-3 p-2 bg-amber-50 rounded-lg inline-block">
              💡 Tip: Upload your menu or product list first for better recommendations
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

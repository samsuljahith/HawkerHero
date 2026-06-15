"use client";

import { BusinessProfile } from "@/lib/profiles";
import { useAnalysisStore } from "@/lib/analysisStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

interface CompetitorsProps {
  profile: BusinessProfile;
  onNavigate: (page: string) => void;
}

export default function Competitors({ profile, onNavigate }: CompetitorsProps) {
  const { getEntry } = useAnalysisStore();
  const entry = getEntry(profile.id);
  const analysis = (entry.analysis as any)?.analysis;
  const hasData = analysis?.competitorInsights;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Your Competition</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">
          Understand what other businesses like yours are doing, and where you can do better.
        </p>
      </div>

      {!hasData ? (
        <EmptyState
          icon="🏆"
          title="Run Market Analysis first"
          description="We'll look at what your competitors are doing and find opportunities for your business. Click below to start."
          action={{ label: "→ Run Market Analysis", onClick: () => onNavigate("analysis") }}
        />
      ) : (
        <div className="space-y-5 animate-slideUp">
          {/* Overview */}
          <Card>
            <h3 className="text-base font-semibold text-[#1A1410] mb-3">What Your Competitors Are Doing</h3>
            <p className="text-sm text-[#1A1410] leading-relaxed">{analysis.competitorInsights.overview}</p>
          </Card>

          {/* Your Advantage */}
          <Card className="bg-emerald-50/50 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💪</span>
              <h3 className="text-base font-semibold text-[#1A1410]">Your Advantage</h3>
            </div>
            <p className="text-sm text-[#1A1410]">{analysis.competitorInsights.yourAdvantage}</p>
            <p className="text-xs text-[#6B6B6B] mt-2">
              <strong>What this means:</strong> This is what makes customers choose you over others. Highlight this in your marketing.
            </p>
          </Card>

          {/* Gap */}
          <Card className="bg-blue-50/50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎯</span>
              <h3 className="text-base font-semibold text-[#1A1410]">Opportunity They&apos;re Missing</h3>
            </div>
            <p className="text-sm text-[#1A1410]">{analysis.competitorInsights.gap}</p>
            <p className="text-xs text-[#6B6B6B] mt-2">
              <strong>What this means:</strong> Your competitors aren&apos;t doing this yet. If you start now, you can get ahead.
            </p>
          </Card>

          {/* Sources info */}
          <Card padding="sm">
            <div className="flex items-center gap-2">
              <Badge variant="info">🌐 Live Data</Badge>
              <span className="text-xs text-[#6B6B6B]">Based on real-time research of your local market</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

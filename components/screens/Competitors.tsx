"use client";

import { BusinessProfile } from "@/lib/profiles";
import { useAnalysisStore } from "@/lib/analysisStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

interface CompetitorsProps {
  profile: BusinessProfile;
  onNavigate: (page: string) => void;
}

export default function Competitors({ profile, onNavigate }: CompetitorsProps) {
  const { getEntry } = useAnalysisStore();
  const entry = getEntry(profile.id);
  const result = entry.analysis;

  // Extract competitors from sources/brief (the analysis doesn't have a dedicated competitors field yet,
  // but we can show the market positioning + any competitor mentions from the brief)
  const hasData = result && (result.brief || result.sources?.length);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Competitors</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">Competitive landscape for {profile.name}</p>
      </div>

      {!hasData ? (
        <EmptyState
          icon="🏆"
          title="Run Market Analysis first"
          description="Competitor insights are generated as part of the Market Analysis. Run an analysis to populate this view."
          action={{ label: "→ Go to Market Analysis", onClick: () => onNavigate("analysis") }}
        />
      ) : (
        <div className="space-y-4 animate-slideUp">
          {/* Positioning Card */}
          <Card>
            <h3 className="text-base font-semibold mb-3">Your Positioning</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase font-medium mb-1">Main Product</p>
                <p className="text-sm font-medium text-[#1A1410]">{result.brief?.dish}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase font-medium mb-1">USP</p>
                <p className="text-sm text-[#1A1410]">{result.brief?.usp}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase font-medium mb-1">Price Point</p>
                <p className="text-sm font-medium text-[#1A1410]">{result.brief?.price}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] uppercase font-medium mb-1">Audience</p>
                <p className="text-sm text-[#1A1410]">{result.brief?.audience}</p>
              </div>
            </div>
          </Card>

          {/* Market Intelligence */}
          {result.sources && result.sources.length > 0 && (
            <Card>
              <h3 className="text-base font-semibold mb-3">Market Intelligence</h3>
              <p className="text-xs text-[#6B6B6B] mb-3">Insights gathered from live web data</p>
              <div className="space-y-2">
                {result.sources.map((src: string, i: number) => (
                  <div key={i} className="p-3 bg-[#FAF8F5] rounded-[10px] border border-[#ECE6DF]">
                    <p className="text-xs text-[#1A1410] leading-relaxed">{src.slice(0, 200)}{src.length > 200 ? "…" : ""}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quality Score */}
          {result.review && (
            <Card padding="sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B6B6B]">Competitive Quality Score</span>
                <Badge variant={result.review.score >= 8 ? "success" : "warning"}>
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

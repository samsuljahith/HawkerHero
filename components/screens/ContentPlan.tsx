"use client";

import { BusinessProfile } from "@/lib/profiles";
import { useAnalysisStore } from "@/lib/analysisStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

interface ContentPlanProps {
  profile: BusinessProfile;
  onNavigate: (page: string) => void;
}

export default function ContentPlan({ profile, onNavigate }: ContentPlanProps) {
  const { getEntry } = useAnalysisStore();
  const entry = getEntry(profile.id);
  const plan = entry.analysis?.contentPlan;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Content Recommendations</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">What to post, when, and why — for {profile.name}</p>
      </div>

      {!plan || plan.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No content plan yet"
          description="Run Market Analysis to generate a content plan with recommended posts, timing, and platforms."
          action={{ label: "→ Go to Market Analysis", onClick: () => onNavigate("analysis") }}
        />
      ) : (
        <div className="space-y-3 animate-slideUp">
          {plan.map((item: any, i: number) => (
            <Card key={i} padding="sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-semibold text-sm text-[#1A1410]">{item.idea}</h4>
                <div className="flex gap-1.5 shrink-0">
                  <Badge variant="info">{item.platform}</Badge>
                  <Badge variant="default">{item.bestPostTime}</Badge>
                </div>
              </div>
              <p className="text-xs text-[#6B6B6B] mb-1">💡 {item.why}</p>
              <p className="text-xs text-[#6B6B6B]">🎯 Audience: {item.audience}</p>
              <div className="mt-3 p-3 bg-[#FAF8F5] rounded-lg">
                <p className="text-sm text-[#1A1410] italic leading-relaxed">&ldquo;{item.suggestedCaption}&rdquo;</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(item.hashtags || []).map((t: string, j: number) => (
                    <span key={j} className="text-xs text-[#2563EB]">{t.startsWith("#") ? t : `#${t}`}</span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

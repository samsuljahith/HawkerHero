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
  const analysis = (entry.analysis as any)?.analysis;
  const plan = analysis?.contentPlan;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Content Recommendations</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">
          Your personalized content calendar — what to post, when, and which product to feature.
        </p>
      </div>

      {!plan || plan.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No recommendations yet"
          description="Run Market Analysis first. Our AI will create a personalized content plan based on your products, market trends, and what's working for businesses like yours."
          action={{ label: "→ Run Market Analysis", onClick: () => onNavigate("analysis") }}
        />
      ) : (
        <div className="space-y-4 animate-slideUp">
          <Card padding="sm">
            <p className="text-xs text-[#6B6B6B]">
              💡 These recommendations are based on your products, current market trends, and what&apos;s working for similar businesses. 
              Click any idea to start creating content in the Studio.
            </p>
          </Card>

          {plan.map((item: any, i: number) => (
            <Card key={i}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="font-semibold text-[#1A1410]">{item.idea}</h4>
                  {item.product && (
                    <p className="text-xs text-[#F2541B] font-medium mt-0.5">Product: {item.product}</p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Badge variant="info">{item.platform}</Badge>
                  <Badge variant="default">{item.contentType || "post"}</Badge>
                </div>
              </div>

              <p className="text-sm text-[#6B6B6B] mb-3">
                <span className="font-medium text-[#1A1410]">Why this works:</span> {item.why}
              </p>

              <div className="p-3 bg-[#FAF8F5] rounded-[10px] border border-[#ECE6DF] mb-3">
                <p className="text-xs font-medium text-[#6B6B6B] mb-1">Suggested caption:</p>
                <p className="text-sm text-[#1A1410] italic">&ldquo;{item.suggestedCaption}&rdquo;</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B6B6B]">🕐 Best time: <span className="font-medium text-[#1A1410]">{item.bestTime}</span></span>
                </div>
                <button
                  onClick={() => onNavigate("studio")}
                  className="text-xs font-medium text-[#F2541B] hover:underline"
                >
                  Create this →
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

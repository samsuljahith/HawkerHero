"use client";

import { BusinessProfile } from "@/lib/profiles";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";

interface CompetitorsProps {
  profile: BusinessProfile;
}

// Placeholder — this screen uses the analysis results. In a full build,
// competitors would come from the /api/generate response stored in state.
export default function Competitors({ profile }: CompetitorsProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Competitors</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">Competitive landscape for {profile.name}</p>
      </div>

      <EmptyState
        icon="🏆"
        title="Run Market Analysis first"
        description="Competitor insights are generated as part of the Market Analysis. Run an analysis to see your competitive landscape."
      />
    </div>
  );
}

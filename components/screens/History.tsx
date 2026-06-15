"use client";

import { BusinessProfile } from "@/lib/profiles";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";

interface HistoryProps {
  profile: BusinessProfile;
}

export default function History({ profile }: HistoryProps) {
  // In production, this would fetch from Mem0 via an API route.
  // For now, show a friendly placeholder that demonstrates the memory feature.
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">History & Memory</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">Past campaigns for {profile.name}</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="info">🧠 Mem0 Powered</Badge>
        </div>
        <p className="text-sm text-[#6B6B6B]">
          HawkerHero remembers your business across sessions. Each time you run analysis or generate content,
          the context is saved — so next time, your AI agents can reference what worked before and what changed.
        </p>
      </Card>

      <EmptyState
        icon="🕐"
        title="No campaigns yet"
        description="Generate your first marketing kit in Content Studio. Your history will appear here."
      />
    </div>
  );
}

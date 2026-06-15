"use client";

import { useState } from "react";
import { BusinessProfile } from "@/lib/profiles";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";

interface ContentPlanProps {
  profile: BusinessProfile;
}

export default function ContentPlan({ profile }: ContentPlanProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: `Generate a content plan for ${profile.name}. ${profile.description}. Offerings: ${profile.offerings}`, profile }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setPlan(data.contentPlan || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Content Recommendations</h2>
          <p className="text-[#6B6B6B] text-sm mt-1">What to post, when, and why — for {profile.name}</p>
        </div>
        <Button onClick={generate} disabled={loading}>{loading ? "Generating…" : "📅 Generate Plan"}</Button>
      </div>

      {loading && <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-[14px]" />)}</div>}
      {error && <Card><p className="text-red-600 text-sm">⚠️ {error}</p></Card>}

      {plan && plan.length > 0 && (
        <div className="space-y-3">
          {plan.map((item, i) => (
            <Card key={i} padding="sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-semibold text-sm text-[#1A1410]">{item.idea}</h4>
                <div className="flex gap-1.5 shrink-0">
                  <Badge variant="info">{item.platform}</Badge>
                  <Badge variant="default">{item.bestPostTime}</Badge>
                </div>
              </div>
              <p className="text-xs text-[#6B6B6B] mb-2">💡 {item.why}</p>
              <p className="text-xs text-[#6B6B6B]">🎯 Audience: {item.audience}</p>
              <div className="mt-3 p-3 bg-[#FAF8F5] rounded-lg">
                <p className="text-sm text-[#1A1410] italic">&ldquo;{item.suggestedCaption}&rdquo;</p>
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

      {!loading && !plan && (
        <Card className="text-center py-16">
          <span className="text-4xl mb-3 block">📅</span>
          <h3 className="text-lg font-semibold">No plan yet</h3>
          <p className="text-sm text-[#6B6B6B] mt-1">Click &ldquo;Generate Plan&rdquo; to get AI content recommendations.</p>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { BusinessProfile } from "@/lib/profiles";
import { useAnalysisStore, Campaign } from "@/lib/analysisStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

interface HistoryProps {
  profile: BusinessProfile;
}

export default function History({ profile }: HistoryProps) {
  const { getCampaigns, setActiveCampaignId, deleteCampaign } = useAnalysisStore();
  const campaigns = getCampaigns(profile.id);
  const [expanded, setExpanded] = useState<string | null>(null);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const handleOpenCampaign = (c: Campaign) => {
    setActiveCampaignId(c.id);
    // Navigate to studio — handled by parent
  };

  const handleDelete = (campaignId: string) => {
    if (confirm("Delete this campaign? This cannot be undone.")) {
      deleteCampaign(profile.id, campaignId);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">Campaign History</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">
          All campaigns for {profile.name}. Every image, video, and caption is permanently saved here.
        </p>
      </div>

      {campaigns.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Badge variant="success">✓ {campaigns.length} campaign{campaigns.length > 1 ? "s" : ""} saved</Badge>
            <span className="text-xs text-[#6B6B6B]">All content is permanently stored and will never disappear.</span>
          </div>
        </Card>
      )}

      {campaigns.length === 0 && (
        <EmptyState
          icon="📣"
          title="No campaigns yet"
          description="Create your first campaign in the Content Studio. Every campaign you create will be permanently saved here with all its assets."
        />
      )}

      {/* Campaign List */}
      {campaigns.map((c) => (
        <Card key={c.id}>
          {/* Campaign Header */}
          <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-[#1A1410] truncate">{c.name}</h3>
                <Badge variant={c.videoUrl ? "success" : c.captions ? "info" : "default"}>
                  {c.videoUrl ? "Complete" : c.captions ? "Content Ready" : "In Progress"}
                </Badge>
              </div>
              <p className="text-xs text-[#6B6B6B]">
                Promoting: <span className="font-medium text-[#1A1410]">{c.product}</span> · {timeAgo(c.createdAt)}
              </p>
              {/* Asset indicators */}
              <div className="flex gap-2 mt-2">
                {c.captions && <span className="text-xs bg-[#FAF8F5] border border-[#ECE6DF] px-2 py-0.5 rounded">✍️ Captions</span>}
                {c.posterImageUrl && <span className="text-xs bg-[#FAF8F5] border border-[#ECE6DF] px-2 py-0.5 rounded">🎨 Poster</span>}
                {c.videoUrl && <span className="text-xs bg-[#FAF8F5] border border-[#ECE6DF] px-2 py-0.5 rounded">🎬 Video</span>}
              </div>
            </div>
            <span className={`text-xs text-[#6B6B6B] transition-transform ${expanded === c.id ? "rotate-180" : ""}`}>▼</span>
          </div>

          {/* Expanded: Full Campaign Details */}
          {expanded === c.id && (
            <div className="mt-4 pt-4 border-t border-[#ECE6DF] space-y-4 animate-fadeIn">
              {/* Timeline */}
              {c.activities.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-2">Campaign Timeline</p>
                  <div className="space-y-1.5">
                    {c.activities.map((act) => (
                      <div key={act.id} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F2541B] mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#1A1410]">{act.label}</span>
                            <span className="text-[10px] text-[#6B6B6B]">{formatDate(act.timestamp)}</span>
                          </div>
                          <p className="text-xs text-[#6B6B6B] truncate">{act.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Captions */}
              {c.captions && (
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">Caption (English)</p>
                  <p className="text-sm text-[#1A1410] bg-[#FAF8F5] p-3 rounded-lg whitespace-pre-wrap">{c.captions.english}</p>
                </div>
              )}

              {/* Saved Poster */}
              {c.posterImageUrl && (
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">Poster</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.posterImageUrl} alt="Campaign poster" className="w-full max-w-[280px] rounded-lg border border-[#ECE6DF]" />
                </div>
              )}

              {/* Saved Video */}
              {c.videoUrl && (
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">Video</p>
                  <video src={c.videoUrl} controls muted playsInline className="w-full max-w-[180px] rounded-lg border border-[#ECE6DF] aspect-[9/16]" />
                  <a href={c.videoUrl} download={`${c.name}-hawkerhero.mp4`} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#F2541B] text-white hover:bg-[#D8430E] transition-colors">
                    ⬇️ Download Video
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => handleOpenCampaign(c)}>
                  Open in Studio
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                  🗑️ Delete
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { BusinessProfile } from "@/lib/profiles";
import { useAnalysisStore, HistoryEntry } from "@/lib/analysisStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

interface HistoryProps {
  profile: BusinessProfile;
}

export default function History({ profile }: HistoryProps) {
  const { getHistory } = useAnalysisStore();
  const entries = getHistory(profile.id);
  const [expanded, setExpanded] = useState<string | null>(null);

  const typeIcon = (type: string) => {
    switch (type) {
      case "analysis": return "🧠";
      case "generation": return "🎨";
      case "campaign": return "📣";
      case "recommendation": return "📅";
      default: return "📝";
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "analysis": return "Market Analysis";
      case "generation": return "Content Generated";
      case "campaign": return "Campaign";
      case "recommendation": return "Recommendation";
      default: return "Activity";
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">History</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">
          All your past work for {profile.name} — saved automatically, always available.
        </p>
      </div>

      {entries.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Badge variant="success">✓ {entries.length} items saved</Badge>
            <span className="text-xs text-[#6B6B6B]">Everything is automatically saved and will not disappear.</span>
          </div>
        </Card>
      )}

      {entries.length === 0 && (
        <EmptyState
          icon="🕐"
          title="No history yet"
          description="When you run Market Analysis or generate content in the Studio, everything is automatically saved here. You'll never lose your work."
        />
      )}

      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} padding="sm">
              <div
                className="cursor-pointer"
                onClick={() => toggleExpand(entry.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{typeIcon(entry.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[#1A1410]">{typeLabel(entry.type)}</span>
                      <span className="text-xs text-[#6B6B6B]">{formatDate(entry.timestamp)}</span>
                    </div>
                    <p className="text-xs text-[#6B6B6B]">{entry.summary}</p>
                  </div>
                  <span className={`text-xs text-[#6B6B6B] transition-transform ${expanded === entry.id ? "rotate-180" : ""}`}>▼</span>
                </div>
              </div>

              {/* Expanded Content */}
              {expanded === entry.id && (
                <div className="mt-4 pt-3 border-t border-[#ECE6DF] space-y-3 animate-fadeIn">
                  {/* Input */}
                  {entry.input && (
                    <div>
                      <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">Prompt</p>
                      <p className="text-sm text-[#1A1410] bg-[#FAF8F5] p-2 rounded-lg">{entry.input}</p>
                    </div>
                  )}

                  {/* Captions */}
                  {entry.captions && (
                    <div>
                      <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">Caption (English)</p>
                      <p className="text-sm text-[#1A1410] bg-[#FAF8F5] p-3 rounded-lg whitespace-pre-wrap">{entry.captions.english}</p>
                      {entry.captions.hashtags && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {entry.captions.hashtags.slice(0, 5).map((t: string, i: number) => (
                            <span key={i} className="text-xs text-[#2563EB]">{t.startsWith("#") ? t : `#${t}`}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Poster */}
                  {entry.posterImageUrl && (
                    <div>
                      <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">Poster Image</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entry.posterImageUrl} alt="Generated poster" className="w-full max-w-[300px] rounded-lg border border-[#ECE6DF]" />
                    </div>
                  )}

                  {/* Video */}
                  {entry.videoUrl && (
                    <div>
                      <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">Video</p>
                      <video src={entry.videoUrl} controls muted className="w-full max-w-[200px] rounded-lg border border-[#ECE6DF] aspect-[9/16]" />
                    </div>
                  )}

                  {/* Review */}
                  {entry.review && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[#6B6B6B]">Quality: </p>
                      <Badge variant={entry.review.score >= 8 ? "success" : "warning"}>{entry.review.score}/10</Badge>
                      <span className="text-xs text-[#6B6B6B]">{entry.review.feedback}</span>
                    </div>
                  )}

                  {/* Content Plan */}
                  {entry.contentPlan && entry.contentPlan.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">Content Plan ({entry.contentPlan.length} ideas)</p>
                      <div className="space-y-1">
                        {entry.contentPlan.slice(0, 3).map((item: any, i: number) => (
                          <p key={i} className="text-xs text-[#1A1410] bg-[#FAF8F5] p-2 rounded">• {item.idea} ({item.platform})</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

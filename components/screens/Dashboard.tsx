"use client";

import { BusinessProfile } from "@/lib/profiles";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface DashboardProps {
  profile: BusinessProfile;
  onNavigate: (page: string) => void;
}

export default function Dashboard({ profile, onNavigate }: DashboardProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-[#1A1410] tracking-tight">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋
        </h2>
        <p className="text-[#6B6B6B] text-sm mt-1">
          Here&apos;s your marketing overview for <span className="font-medium text-[#1A1410]">{profile.name}</span>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Business Type" value={profile.type} icon="🏪" />
        <Stat label="Location" value={profile.location?.split(",")[0] || "—"} icon="📍" />
        <Stat label="Offerings" value={`${profile.offerings.split("\n").filter(Boolean).length} items`} icon="📋" />
        <Stat label="Status" value="Active" icon="✅" trend="up" />
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-base font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => onNavigate("analysis")} className="p-4 rounded-[10px] border border-[#ECE6DF] hover:border-[#F2541B] hover:bg-orange-50/50 transition-all text-left">
            <span className="text-2xl mb-2 block">🧠</span>
            <p className="text-sm font-semibold">Run Market Analysis</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">AI-powered insights</p>
          </button>
          <button onClick={() => onNavigate("studio")} className="p-4 rounded-[10px] border border-[#ECE6DF] hover:border-[#F2541B] hover:bg-orange-50/50 transition-all text-left">
            <span className="text-2xl mb-2 block">🎨</span>
            <p className="text-sm font-semibold">Create Content</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Captions, poster, video</p>
          </button>
          <button onClick={() => onNavigate("plan")} className="p-4 rounded-[10px] border border-[#ECE6DF] hover:border-[#F2541B] hover:bg-orange-50/50 transition-all text-left">
            <span className="text-2xl mb-2 block">📅</span>
            <p className="text-sm font-semibold">Content Plan</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">What to post next</p>
          </button>
        </div>
      </Card>

      {/* Business Profile Summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Business Profile</h3>
          <Badge variant="success">Active</Badge>
        </div>
        <p className="text-sm text-[#6B6B6B] mb-3">{profile.description}</p>
        <div className="flex flex-wrap gap-2">
          {profile.brandColors?.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full border border-[#ECE6DF]" style={{ backgroundColor: c }} />
              <span className="text-xs text-[#6B6B6B]">{c}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

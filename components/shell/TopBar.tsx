"use client";

import { BusinessProfile } from "@/lib/profiles";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface TopBarProps {
  activeProfile: BusinessProfile | null;
  onNewCampaign: () => void;
}

export default function TopBar({ activeProfile, onNewCampaign }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/80 backdrop-blur-md border-b border-[#ECE6DF]">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Mobile logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="HawkerHero" className="lg:hidden w-8 h-8 rounded-lg" />
          {activeProfile && (
            <>
              <h2 className="text-base font-semibold text-[#1A1410] hidden sm:block">{activeProfile.name}</h2>
              <Badge variant="default">{activeProfile.type}</Badge>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={onNewCampaign}>
            + New Campaign
          </Button>
          <div className="w-8 h-8 rounded-full bg-[#ECE6DF] flex items-center justify-center text-sm font-medium text-[#6B6B6B]">
            S
          </div>
        </div>
      </div>
    </header>
  );
}

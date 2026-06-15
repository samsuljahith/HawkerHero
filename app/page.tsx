"use client";

import { useState, useEffect } from "react";
import { BusinessProfile } from "@/lib/profiles";
import { AnalysisProvider } from "@/lib/analysisStore";
import Sidebar from "@/components/shell/Sidebar";
import TopBar from "@/components/shell/TopBar";
import Login from "@/components/screens/Login";
import ProfileForm from "@/components/screens/ProfileForm";
import Dashboard from "@/components/screens/Dashboard";
import MarketAnalysis from "@/components/screens/MarketAnalysis";
import ContentStudio from "@/components/screens/ContentStudio";
import ContentPlan from "@/components/screens/ContentPlan";
import Competitors from "@/components/screens/Competitors";
import History from "@/components/screens/History";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<BusinessProfile | null>(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    if (!authenticated) return;
    setLoadingProfiles(true);
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((d) => {
        const profs: BusinessProfile[] = d.profiles || [];
        setProfiles(profs);
        if (profs.length > 0) setActiveProfile(profs[0]);
      })
      .catch(() => setProfiles([]))
      .finally(() => setLoadingProfiles(false));
  }, [authenticated]);

  if (!authenticated) return <Login onContinue={() => setAuthenticated(true)} />;

  if (loadingProfiles) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#ECE6DF] border-t-[#F2541B] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#6B6B6B] mt-3">Loading…</p>
        </div>
      </div>
    );
  }

  // First-time: onboarding
  if (profiles.length === 0 && !showNewProfile) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <ProfileForm
            isOnboarding={true}
            onSave={async (profile) => {
              try {
                const res = await fetch("/api/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
                const data = await res.json();
                if (data.profiles) setProfiles(data.profiles);
              } catch { setProfiles([profile]); }
              setActiveProfile(profile);
            }}
          />
        </div>
      </div>
    );
  }

  if (showNewProfile) {
    return (
      <AnalysisProvider>
        <div className="min-h-screen bg-[#FAF8F5] p-6 lg:pl-72">
          <Sidebar profiles={profiles} activeProfile={activeProfile}
            onSelectProfile={(p) => { setActiveProfile(p); setShowNewProfile(false); }}
            onNewProfile={() => {}} activePage={activePage}
            onNavigate={(p) => { setActivePage(p); setShowNewProfile(false); }} />
          <ProfileForm
            onSave={async (profile) => {
              try {
                const res = await fetch("/api/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
                const data = await res.json();
                if (data.profiles) setProfiles(data.profiles);
              } catch { setProfiles([...profiles, profile]); }
              setActiveProfile(profile);
              setShowNewProfile(false);
            }}
            onCancel={() => setShowNewProfile(false)}
          />
        </div>
      </AnalysisProvider>
    );
  }

  if (!activeProfile) {
    return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#ECE6DF] border-t-[#F2541B] rounded-full animate-spin" />
    </div>;
  }

  const handleNewCampaign = () => {
    setActivePage("studio");
    // ContentStudio will show the new campaign form when no active campaign
  };

  const renderScreen = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard profile={activeProfile} onNavigate={setActivePage} />;
      case "analysis": return <MarketAnalysis profile={activeProfile} />;
      case "studio": return <ContentStudio profile={activeProfile} />;
      case "competitors": return <Competitors profile={activeProfile} onNavigate={setActivePage} />;
      case "plan": return <ContentPlan profile={activeProfile} onNavigate={setActivePage} />;
      case "history": return <History profile={activeProfile} />;
      default: return <Dashboard profile={activeProfile} onNavigate={setActivePage} />;
    }
  };

  return (
    <AnalysisProvider>
      <div className="min-h-screen bg-[#FAF8F5]">
        <Sidebar profiles={profiles} activeProfile={activeProfile}
          onSelectProfile={setActiveProfile} onNewProfile={() => setShowNewProfile(true)}
          activePage={activePage} onNavigate={setActivePage} />
        <div className="lg:pl-64 pb-20 lg:pb-0">
          <TopBar activeProfile={activeProfile} onNewCampaign={handleNewCampaign} />
          <main className="px-4 lg:px-8 py-6 max-w-5xl">
            {renderScreen()}
          </main>
        </div>
      </div>
    </AnalysisProvider>
  );
}

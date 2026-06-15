"use client";

import { useState, useEffect } from "react";
import { BusinessProfile, DEMO_PROFILES } from "@/lib/profiles";
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

  // Load profiles on mount
  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((d) => {
        const profs = d.profiles?.length ? d.profiles : DEMO_PROFILES;
        setProfiles(profs);
        setActiveProfile(profs[0]);
      })
      .catch(() => {
        setProfiles(DEMO_PROFILES);
        setActiveProfile(DEMO_PROFILES[0]);
      });
  }, [authenticated]);

  // Login gate
  if (!authenticated) {
    return <Login onContinue={() => setAuthenticated(true)} />;
  }

  // Profile form
  if (showNewProfile) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] p-6 lg:pl-72">
        <Sidebar
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={(p) => { setActiveProfile(p); setShowNewProfile(false); }}
          onNewProfile={() => {}}
          activePage={activePage}
          onNavigate={(p) => { setActivePage(p); setShowNewProfile(false); }}
        />
        <ProfileForm
          onSave={async (profile) => {
            try {
              const res = await fetch("/api/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
              });
              const data = await res.json();
              if (data.profiles) setProfiles(data.profiles);
            } catch {
              setProfiles([...profiles, profile]);
            }
            setActiveProfile(profile);
            setShowNewProfile(false);
          }}
          onCancel={() => setShowNewProfile(false)}
        />
      </div>
    );
  }

  // No profile loaded yet
  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ECE6DF] border-t-[#F2541B] rounded-full animate-spin" />
      </div>
    );
  }

  // Render active screen
  const renderScreen = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard profile={activeProfile} onNavigate={setActivePage} />;
      case "analysis": return <MarketAnalysis profile={activeProfile} />;
      case "studio": return <ContentStudio profile={activeProfile} />;
      case "competitors": return <Competitors profile={activeProfile} />;
      case "plan": return <ContentPlan profile={activeProfile} />;
      case "history": return <History profile={activeProfile} />;
      default: return <Dashboard profile={activeProfile} onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Sidebar
        profiles={profiles}
        activeProfile={activeProfile}
        onSelectProfile={setActiveProfile}
        onNewProfile={() => setShowNewProfile(true)}
        activePage={activePage}
        onNavigate={setActivePage}
      />
      <div className="lg:pl-64 pb-20 lg:pb-0">
        <TopBar activeProfile={activeProfile} onNewCampaign={() => setActivePage("studio")} />
        <main className="px-4 lg:px-8 py-6 max-w-5xl">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}

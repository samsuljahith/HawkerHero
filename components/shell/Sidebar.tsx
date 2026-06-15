"use client";

import { BusinessProfile } from "@/lib/profiles";

interface SidebarProps {
  profiles: BusinessProfile[];
  activeProfile: BusinessProfile | null;
  onSelectProfile: (p: BusinessProfile) => void;
  onNewProfile: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "analysis", label: "Market Analysis", icon: "🧠" },
  { id: "competitors", label: "Competitors", icon: "🏆" },
  { id: "studio", label: "Content Studio", icon: "🎨" },
  { id: "plan", label: "Recommendations", icon: "📅" },
  { id: "history", label: "History", icon: "🕐" },
];

export default function Sidebar({
  profiles,
  activeProfile,
  onSelectProfile,
  onNewProfile,
  activePage,
  onNavigate,
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#1A1410] text-white z-40">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-xl font-bold tracking-tight">🦸 HawkerHero</h1>
          <p className="text-xs text-white/50 mt-0.5">AI Marketing Console</p>
        </div>

        {/* Business Switcher */}
        <div className="px-4 mb-4">
          <select
            value={activeProfile?.id || ""}
            onChange={(e) => {
              if (e.target.value === "__new__") { onNewProfile(); return; }
              const p = profiles.find((pr) => pr.id === e.target.value);
              if (p) onSelectProfile(p);
            }}
            className="w-full bg-white/10 border border-white/10 text-white text-sm rounded-[10px] px-3 py-2 outline-none focus:border-[#F2541B] appearance-none cursor-pointer"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id} className="text-black">{p.name}</option>
            ))}
            <option value="__new__" className="text-black">+ New Profile</option>
          </select>
          {activeProfile && (
            <p className="text-[10px] text-white/40 mt-1.5 px-1 truncate">
              {activeProfile.type} · {activeProfile.location?.split(",")[0]}
            </p>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${
                activePage === item.id
                  ? "bg-[#F2541B] text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom spacer */}
        <div className="pb-6" />
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#ECE6DF] z-40 flex">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
              activePage === item.id ? "text-[#F2541B]" : "text-[#6B6B6B]"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label.split(" ")[0]}
          </button>
        ))}
      </nav>
    </>
  );
}

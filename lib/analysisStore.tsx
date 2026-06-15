"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnalysisData {
  brief?: any;
  captions?: any;
  posterImageUrl?: string | null;
  poster?: any;
  videoTaskId?: string | null;
  review?: any;
  sources?: string[];
  returning?: boolean;
  welcomeBack?: string | null;
  whatsChanged?: string | null;
  contentPlan?: any[] | null;
  analysis?: any; // from /api/analyze
}

export interface BusinessAnalysisEntry {
  analysis: AnalysisData | null;
  status: "idle" | "loading" | "done" | "error";
  lastRunAt: number | null;
  error: string | null;
}

// ─── Campaign Model ──────────────────────────────────────────────────────────

export interface CampaignActivity {
  id: string;
  timestamp: number;
  type: "market_analysis" | "audience_analysis" | "branding" | "content_generation" | "image_generation" | "video_generation" | "recommendation";
  label: string;
  summary: string;
  data?: any; // full generated content
}

export interface Campaign {
  id: string;
  businessId: string;
  name: string;
  product: string; // what product/service is being promoted
  goal: string;
  createdAt: number;
  activities: CampaignActivity[];
  // Latest generated assets (quick access)
  captions?: any;
  posterImageUrl?: string | null;
  poster?: any;
  videoUrl?: string | null;
  videoTaskId?: string | null;
  review?: any;
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface AnalysisStore {
  // Market Analysis (per business, cached)
  entries: Record<string, BusinessAnalysisEntry>;
  getEntry: (businessId: string) => BusinessAnalysisEntry;
  setAnalysis: (businessId: string, data: AnalysisData) => void;
  setLoading: (businessId: string) => void;
  setError: (businessId: string, error: string) => void;

  // Campaigns (per business)
  campaigns: Record<string, Campaign[]>; // businessId -> campaigns[]
  getCampaigns: (businessId: string) => Campaign[];
  activeCampaignId: string | null;
  setActiveCampaignId: (id: string | null) => void;
  getActiveCampaign: (businessId: string) => Campaign | null;
  createCampaign: (businessId: string, name: string, product: string, goal: string) => Campaign;
  addCampaignActivity: (businessId: string, campaignId: string, activity: Omit<CampaignActivity, "id" | "timestamp">) => void;
  updateCampaignAssets: (businessId: string, campaignId: string, assets: Partial<Pick<Campaign, "captions" | "posterImageUrl" | "poster" | "videoUrl" | "videoTaskId" | "review">>) => void;
  deleteCampaign: (businessId: string, campaignId: string) => void;
}

const DEFAULT_ENTRY: BusinessAnalysisEntry = {
  analysis: null,
  status: "idle",
  lastRunAt: null,
  error: null,
};

// LocalStorage
const LS_KEY_ANALYSIS = "hawkerhero_analysis";
const LS_KEY_CAMPAIGNS = "hawkerhero_campaigns";

function loadFromLS<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveToLS(key: string, data: any) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AnalysisContext = createContext<AnalysisStore | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, BusinessAnalysisEntry>>(() => loadFromLS(LS_KEY_ANALYSIS) || {});
  const [campaigns, setCampaigns] = useState<Record<string, Campaign[]>>(() => loadFromLS(LS_KEY_CAMPAIGNS) || {});
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  // Persist
  useEffect(() => { saveToLS(LS_KEY_ANALYSIS, entries); }, [entries]);
  useEffect(() => { saveToLS(LS_KEY_CAMPAIGNS, campaigns); }, [campaigns]);

  // Analysis
  const getEntry = useCallback((businessId: string): BusinessAnalysisEntry => entries[businessId] || DEFAULT_ENTRY, [entries]);

  const setAnalysis = useCallback((businessId: string, data: AnalysisData) => {
    setEntries((prev) => ({ ...prev, [businessId]: { analysis: data, status: "done", lastRunAt: Date.now(), error: null } }));
  }, []);

  const setLoading = useCallback((businessId: string) => {
    setEntries((prev) => ({ ...prev, [businessId]: { ...DEFAULT_ENTRY, ...prev[businessId], status: "loading", error: null } }));
  }, []);

  const setError = useCallback((businessId: string, error: string) => {
    setEntries((prev) => ({ ...prev, [businessId]: { ...DEFAULT_ENTRY, ...prev[businessId], status: "error", error } }));
  }, []);

  // Campaigns
  const getCampaigns = useCallback((businessId: string): Campaign[] => {
    return (campaigns[businessId] || []).sort((a, b) => b.createdAt - a.createdAt);
  }, [campaigns]);

  const getActiveCampaign = useCallback((businessId: string): Campaign | null => {
    if (!activeCampaignId) return null;
    return (campaigns[businessId] || []).find((c) => c.id === activeCampaignId) || null;
  }, [campaigns, activeCampaignId]);

  const createCampaign = useCallback((businessId: string, name: string, product: string, goal: string): Campaign => {
    const campaign: Campaign = {
      id: `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      businessId,
      name,
      product,
      goal,
      createdAt: Date.now(),
      activities: [],
    };
    setCampaigns((prev) => ({
      ...prev,
      [businessId]: [campaign, ...(prev[businessId] || [])],
    }));
    setActiveCampaignId(campaign.id);
    return campaign;
  }, []);

  const addCampaignActivity = useCallback((businessId: string, campaignId: string, activity: Omit<CampaignActivity, "id" | "timestamp">) => {
    const fullActivity: CampaignActivity = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    setCampaigns((prev) => {
      const list = prev[businessId] || [];
      const updated = list.map((c) =>
        c.id === campaignId ? { ...c, activities: [...c.activities, fullActivity] } : c
      );
      return { ...prev, [businessId]: updated };
    });
    // Backup to Mem0
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, entry: { type: activity.type, summary: activity.summary, timestamp: Date.now(), campaignId } }),
    }).catch(() => {});
  }, []);

  const updateCampaignAssets = useCallback((businessId: string, campaignId: string, assets: Partial<Pick<Campaign, "captions" | "posterImageUrl" | "poster" | "videoUrl" | "videoTaskId" | "review">>) => {
    setCampaigns((prev) => {
      const list = prev[businessId] || [];
      const updated = list.map((c) =>
        c.id === campaignId ? { ...c, ...assets } : c
      );
      return { ...prev, [businessId]: updated };
    });
  }, []);

  const deleteCampaign = useCallback((businessId: string, campaignId: string) => {
    setCampaigns((prev) => {
      const list = prev[businessId] || [];
      return { ...prev, [businessId]: list.filter((c) => c.id !== campaignId) };
    });
    if (activeCampaignId === campaignId) setActiveCampaignId(null);
  }, [activeCampaignId]);

  return (
    <AnalysisContext.Provider value={{
      entries, getEntry, setAnalysis, setLoading, setError,
      campaigns, getCampaigns, activeCampaignId, setActiveCampaignId,
      getActiveCampaign, createCampaign, addCampaignActivity,
      updateCampaignAssets, deleteCampaign,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisStore(): AnalysisStore {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysisStore must be used within AnalysisProvider");
  return ctx;
}

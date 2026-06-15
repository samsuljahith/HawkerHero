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
  todayContext?: string | null;
  returning?: boolean;
  welcomeBack?: string | null;
  whatsChanged?: string | null;
  contentPlan?: any[] | null;
  competitors?: any[] | null;
}

export interface BusinessAnalysisEntry {
  analysis: AnalysisData | null;
  status: "idle" | "loading" | "done" | "error";
  lastRunAt: number | null;
  error: string | null;
}

export interface StudioData {
  input: string;
  result: any | null;
  videoUrl: string | null;
  wantPoster: boolean;
  wantVideo: boolean;
}

export interface HistoryEntry {
  id: string;
  type: "analysis" | "generation" | "campaign" | "recommendation";
  timestamp: number;
  summary: string;
  input?: string;
  // Full generated data stored alongside the entry
  captions?: any;
  posterImageUrl?: string | null;
  videoUrl?: string | null;
  poster?: any;
  review?: any;
  contentPlan?: any[] | null;
  brief?: any;
}

interface AnalysisStore {
  // Analysis (per business)
  entries: Record<string, BusinessAnalysisEntry>;
  getEntry: (businessId: string) => BusinessAnalysisEntry;
  setAnalysis: (businessId: string, data: AnalysisData) => void;
  setLoading: (businessId: string) => void;
  setError: (businessId: string, error: string) => void;
  // Studio (per business, current session)
  studioEntries: Record<string, StudioData>;
  getStudio: (businessId: string) => StudioData;
  setStudio: (businessId: string, data: Partial<StudioData>) => void;
  // History (per business, persisted)
  getHistory: (businessId: string) => HistoryEntry[];
  addHistoryEntry: (businessId: string, entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
  updateLastHistoryVideo: (businessId: string, videoUrl: string) => void;
}

const DEFAULT_ENTRY: BusinessAnalysisEntry = {
  analysis: null,
  status: "idle",
  lastRunAt: null,
  error: null,
};

const DEFAULT_STUDIO: StudioData = {
  input: "",
  result: null,
  videoUrl: null,
  wantPoster: true,
  wantVideo: true,
};

// LocalStorage helpers
const LS_KEY_ANALYSIS = "hawkerhero_analysis";
const LS_KEY_STUDIO = "hawkerhero_studio";
const LS_KEY_HISTORY = "hawkerhero_history";

function loadFromLS<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToLS(key: string, data: any) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AnalysisContext = createContext<AnalysisStore | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, BusinessAnalysisEntry>>(() => loadFromLS(LS_KEY_ANALYSIS) || {});
  const [studioEntries, setStudioEntries] = useState<Record<string, StudioData>>(() => loadFromLS(LS_KEY_STUDIO) || {});
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryEntry[]>>(() => loadFromLS(LS_KEY_HISTORY) || {});

  // Persist to localStorage on change
  useEffect(() => { saveToLS(LS_KEY_ANALYSIS, entries); }, [entries]);
  useEffect(() => { saveToLS(LS_KEY_STUDIO, studioEntries); }, [studioEntries]);
  useEffect(() => { saveToLS(LS_KEY_HISTORY, historyMap); }, [historyMap]);

  const getEntry = useCallback(
    (businessId: string): BusinessAnalysisEntry => entries[businessId] || DEFAULT_ENTRY,
    [entries]
  );

  const setAnalysis = useCallback((businessId: string, data: AnalysisData) => {
    setEntries((prev) => ({
      ...prev,
      [businessId]: { analysis: data, status: "done", lastRunAt: Date.now(), error: null },
    }));
  }, []);

  const setLoading = useCallback((businessId: string) => {
    setEntries((prev) => ({
      ...prev,
      [businessId]: { ...DEFAULT_ENTRY, ...prev[businessId], status: "loading", error: null },
    }));
  }, []);

  const setError = useCallback((businessId: string, error: string) => {
    setEntries((prev) => ({
      ...prev,
      [businessId]: { ...DEFAULT_ENTRY, ...prev[businessId], status: "error", error },
    }));
  }, []);

  const getStudio = useCallback(
    (businessId: string): StudioData => studioEntries[businessId] || DEFAULT_STUDIO,
    [studioEntries]
  );

  const setStudio = useCallback((businessId: string, data: Partial<StudioData>) => {
    setStudioEntries((prev) => ({
      ...prev,
      [businessId]: { ...(prev[businessId] || DEFAULT_STUDIO), ...data },
    }));
  }, []);

  // ─── History: single source of truth in localStorage + Mem0 backup ─────────

  const getHistory = useCallback(
    (businessId: string): HistoryEntry[] => {
      return (historyMap[businessId] || []).sort((a, b) => b.timestamp - a.timestamp);
    },
    [historyMap]
  );

  const addHistoryEntry = useCallback((businessId: string, entry: Omit<HistoryEntry, "id" | "timestamp">) => {
    const fullEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    // 1. Save to localStorage immediately (synchronous, guaranteed)
    setHistoryMap((prev) => {
      const existing = prev[businessId] || [];
      // Keep last 50 entries per business to avoid localStorage overflow
      const updated = [fullEntry, ...existing].slice(0, 50);
      return { ...prev, [businessId]: updated };
    });

    // 2. Also save to Mem0 as backup (async, fire-and-forget)
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        entry: {
          type: fullEntry.type,
          summary: fullEntry.summary,
          timestamp: fullEntry.timestamp,
          input: fullEntry.input,
          // Store essential data refs (not full image URLs to save space)
          hasCaptions: !!fullEntry.captions,
          hasPoster: !!fullEntry.posterImageUrl,
          hasVideo: !!fullEntry.videoUrl,
        },
      }),
    }).catch(() => {});
  }, []);

  const updateLastHistoryVideo = useCallback((businessId: string, videoUrl: string) => {
    setHistoryMap((prev) => {
      const existing = prev[businessId] || [];
      if (existing.length === 0) return prev;
      // Update the most recent generation entry
      const updated = [...existing];
      const idx = updated.findIndex((e) => e.type === "generation" && !e.videoUrl);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], videoUrl };
      }
      return { ...prev, [businessId]: updated };
    });
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        entries, getEntry, setAnalysis, setLoading, setError,
        studioEntries, getStudio, setStudio,
        getHistory, addHistoryEntry, updateLastHistoryVideo,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisStore(): AnalysisStore {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysisStore must be used within AnalysisProvider");
  return ctx;
}

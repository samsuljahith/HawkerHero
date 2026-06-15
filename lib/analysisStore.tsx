"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

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
  // Competitors extracted from brief/sources
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

interface AnalysisStore {
  entries: Record<string, BusinessAnalysisEntry>;
  getEntry: (businessId: string) => BusinessAnalysisEntry;
  setAnalysis: (businessId: string, data: AnalysisData) => void;
  setLoading: (businessId: string) => void;
  setError: (businessId: string, error: string) => void;
  // Studio state (per business)
  studioEntries: Record<string, StudioData>;
  getStudio: (businessId: string) => StudioData;
  setStudio: (businessId: string, data: Partial<StudioData>) => void;
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

// ─── Context ─────────────────────────────────────────────────────────────────

const AnalysisContext = createContext<AnalysisStore | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, BusinessAnalysisEntry>>({});
  const [studioEntries, setStudioEntries] = useState<Record<string, StudioData>>({});

  const getEntry = useCallback(
    (businessId: string): BusinessAnalysisEntry => entries[businessId] || DEFAULT_ENTRY,
    [entries]
  );

  const setAnalysis = useCallback((businessId: string, data: AnalysisData) => {
    setEntries((prev) => ({
      ...prev,
      [businessId]: {
        analysis: data,
        status: "done",
        lastRunAt: Date.now(),
        error: null,
      },
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

  return (
    <AnalysisContext.Provider
      value={{ entries, getEntry, setAnalysis, setLoading, setError, studioEntries, getStudio, setStudio }}
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

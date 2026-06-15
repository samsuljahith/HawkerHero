"use client";

import { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";

export interface PosterData {
  headline: string;
  story: string;
  items: { name: string; price: string }[];
  offer: string | null;
  businessName: string;
  rating: string;
  cta: string;
  hours: string;
  contact: string;
  delivery: string | null;
}

interface PosterProps {
  data: PosterData;
  imageUrl: string;
}

export default function Poster({ data, imageUrl }: PosterProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Convert external image to data URL via proxy to avoid CORS issues
  useEffect(() => {
    if (!imageUrl) return;
    // If already a data URL, use directly
    if (imageUrl.startsWith("data:")) {
      setLocalImage(imageUrl);
      return;
    }
    const fetchImage = async () => {
      try {
        const res = await fetch(
          `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
        );
        const json = await res.json();
        if (json.dataUrl) {
          setLocalImage(json.dataUrl);
        } else {
          // Fallback: use original URL (display works, download may fail)
          setLocalImage(imageUrl);
        }
      } catch {
        setLocalImage(imageUrl);
      }
    };
    fetchImage();
  }, [imageUrl]);

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      // Run toPng multiple times — first call sometimes fails due to lazy image loading
      let dataUrl = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          dataUrl = await toPng(posterRef.current, {
            width: 1080,
            height: 1350,
            pixelRatio: 1,
            cacheBust: true,
            skipAutoScale: true,
          });
          if (dataUrl) break;
        } catch {
          // retry
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      if (!dataUrl) throw new Error("Export failed after retries");

      const link = document.createElement("a");
      link.download = `${data.businessName || "poster"}-hawkerhero.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Failed to export poster:", e);
      alert("Download failed. Try right-clicking the poster and saving as image.");
    } finally {
      setDownloading(false);
    }
  };

  if (!localImage) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
        <p className="ml-3 text-gray-500 text-sm">Loading poster image…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Poster Canvas — 4:5 ratio (1080x1350) */}
      <div
        ref={posterRef}
        style={{
          aspectRatio: "4 / 5",
          position: "relative",
          width: "100%",
          overflow: "hidden",
          borderRadius: "12px",
          background: "#1a1a1a",
        }}
      >
        {/* Background Food Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={localImage}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Top Gradient Scrim */}
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: "45%",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.82), rgba(0,0,0,0.5) 60%, transparent)",
          }}
        />

        {/* Bottom Gradient Scrim */}
        <div
          style={{
            position: "absolute",
            inset: "auto 0 0 0",
            height: "58%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.7) 50%, transparent)",
          }}
        />

        {/* Content Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "24px",
          }}
        >
          {/* ── TOP SECTION ── */}
          <div>
            {/* Headline */}
            <h2
              style={{
                color: "#fff",
                fontWeight: 900,
                fontSize: "clamp(1.5rem, 5vw, 2.4rem)",
                textTransform: "uppercase",
                lineHeight: 1.1,
                marginBottom: "8px",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              }}
            >
              {data.headline}
            </h2>
            {/* Story */}
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                fontStyle: "italic",
                fontSize: "clamp(0.85rem, 2.5vw, 1.05rem)",
                lineHeight: 1.4,
                marginBottom: "10px",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {data.story}
            </p>
            {/* Rating Badge */}
            <span
              style={{
                display: "inline-block",
                background: "rgba(251,191,36,0.92)",
                color: "#000",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {data.rating}
            </span>
          </div>

          {/* ── BOTTOM SECTION ── */}
          <div>
            {/* Menu Items */}
            <div style={{ marginBottom: "12px" }}>
              {data.items.slice(0, 4).map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(4px)",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    marginBottom: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <span
                    style={{
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    style={{
                      color: "#fbbf24",
                      fontWeight: 900,
                      fontSize: "clamp(1rem, 3vw, 1.25rem)",
                    }}
                  >
                    {item.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Offer Badge */}
            {data.offer && (
              <div
                style={{
                  display: "inline-block",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: 700,
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  marginBottom: "10px",
                }}
              >
                🔥 {data.offer}
              </div>
            )}

            {/* CTA Button */}
            <div
              style={{
                width: "100%",
                background: "#fbbf24",
                color: "#000",
                fontWeight: 900,
                textAlign: "center",
                padding: "14px 0",
                borderRadius: "12px",
                fontSize: "clamp(1rem, 3vw, 1.25rem)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {data.cta}
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p
                  style={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    margin: 0,
                  }}
                >
                  {data.businessName}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.7rem",
                    margin: 0,
                  }}
                >
                  {data.hours}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "0.7rem",
                    margin: 0,
                  }}
                >
                  {data.contact}
                </p>
                {data.delivery && (
                  <p
                    style={{
                      color: "#fbbf24",
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    📦 {data.delivery}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="mt-4 w-full py-3 rounded-xl font-bold text-base text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
      >
        {downloading ? "Exporting…" : "⬇️ Download Poster (PNG)"}
      </button>
    </div>
  );
}

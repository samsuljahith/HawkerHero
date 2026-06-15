import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HawkerHero — AI Marketing Studio",
  description:
    "Describe your business in one sentence. Get a full marketing kit: multilingual captions, promo poster, and video — powered by 5 AI agents with live web search.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

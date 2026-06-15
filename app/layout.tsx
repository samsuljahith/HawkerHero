import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HawkerHero — AI Marketing Intelligence",
  description:
    "AI-powered marketing intelligence platform for small businesses. Market analysis, content generation, and strategic recommendations.",
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

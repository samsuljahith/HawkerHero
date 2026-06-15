/**
 * Business Profiles — stored in Mem0 (no separate DB).
 * Lightweight, no auth. Profiles are keyed by a stable ID slug.
 */

export interface BusinessProfile {
  id: string;
  name: string;
  type: string;
  description: string;
  offerings: string; // free text: menu items OR services OR products
  location: string;
  contact: string;
  brandColors: string[]; // 2-3 hex
}

// ─── Demo Profiles (pre-seeded on first load) ────────────────────────────────

export const DEMO_PROFILES: BusinessProfile[] = [
  {
    id: "saras-biryani",
    name: "Sara's Biryani",
    type: "Restaurant",
    description:
      "Authentic South Indian biryani house in Little India, family recipes passed down 3 generations. Known for aromatic Hyderabadi-style dum biryani.",
    offerings:
      "Chicken Dum Biryani $6.50\nMutton Biryani $8\nVeg Biryani $5\nFish Biryani $7\nRaita $1.50\nGulab Jamun $2\nMango Lassi $3",
    location: "42 Serangoon Road, Little India, Singapore",
    contact: "@sarasbiryani_sg",
    brandColors: ["#e63946", "#f4a261", "#2a9d8f"],
  },
  {
    id: "sharp-cuts",
    name: "Sharp Cuts",
    type: "Barber Shop",
    description:
      "Modern barbershop in Bugis with a retro vibe. Specialises in fades, beard trims, and hot towel shaves. Walk-ins welcome.",
    offerings:
      "Classic Haircut $18\nSkin Fade $22\nBeard Trim $12\nHot Towel Shave $25\nHaircut + Beard Combo $28\nKids Cut (under 12) $12\nHair Colour $45",
    location: "15 Bugis Street, #01-08, Singapore",
    contact: "@sharpcuts.sg / 9123 4567",
    brandColors: ["#1d3557", "#e76f51", "#f1faee"],
  },
];

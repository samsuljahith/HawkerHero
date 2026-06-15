/**
 * Business Profiles — stored in Mem0 (no separate DB).
 * NO demo profiles. Users create their own from scratch.
 */

export interface BusinessProfile {
  id: string;
  name: string;
  type: string;
  description: string;
  offerings: string; // free text: menu items, services, or products (one per line with price)
  targetAudience: string;
  branding: string; // brand personality, tone, values
  location: string;
  contact: string;
  brandColors: string[]; // 2-3 hex
  uploadedData: string; // parsed CSV/Excel data as text (stored alongside profile)
  createdAt: number;
}

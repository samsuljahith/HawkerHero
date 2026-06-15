/**
 * Business Profiles — stored in Mem0 (no separate DB).
 * NO demo profiles. Users create their own from scratch.
 * Branding and audience are determined by AI automatically.
 */

export interface BusinessProfile {
  id: string;
  name: string;
  type: string;
  description: string;
  offerings: string; // free text: menu items, services, or products
  location: string;
  contact: string;
  brandColors: string[]; // 2-3 hex
  uploadedData: string; // parsed CSV/Excel data
  createdAt: number;
}

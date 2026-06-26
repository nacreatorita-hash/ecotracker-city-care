export interface WasteReport {
  id: string;
  lat: number;
  lng: number;
  locationName?: string;
  eerCode: string;
  wasteType: string;
  isDangerous: boolean;
  photo?: string; // base64 data URI
  description?: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "reported" | "in_progress" | "cleaned";
  createdAt: string;
  notes?: string;
  cleanupRecommendation?: string;
  reporterName?: string;
  reporterEmail?: string;
}

export type SeverityType = "low" | "medium" | "high" | "critical";
export type StatusType = "reported" | "in_progress" | "cleaned";

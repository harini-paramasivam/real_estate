import type { LeadSource, LeadStage, UnitStatus, UnitType } from "../types";

export const LEAD_STAGES: LeadStage[] = [
  "NEW",
  "CONTACTED",
  "SITE_VISIT",
  "INTERESTED",
  "NEGOTIATION",
  "BOOKED",
  "LOST",
];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  SITE_VISIT: "Site Visit",
  INTERESTED: "Interested",
  NEGOTIATION: "Negotiation",
  BOOKED: "Booked",
  LOST: "Lost",
};

export const LEAD_STAGE_BADGE: Record<LeadStage, { bg: string; text: string }> = {
  NEW: { bg: "bg-slate-light", text: "text-slate" },
  CONTACTED: { bg: "bg-amber-light", text: "text-amber" },
  SITE_VISIT: { bg: "bg-amber-light", text: "text-amber" },
  INTERESTED: { bg: "bg-brick-light", text: "text-brick" },
  NEGOTIATION: { bg: "bg-brick-light", text: "text-brick-dark" },
  BOOKED: { bg: "bg-sage-light", text: "text-sage" },
  LOST: { bg: "bg-rust-light", text: "text-rust" },
};

export const LEAD_SOURCES: LeadSource[] = [
  "WEBSITE",
  "REFERRAL",
  "WALK_IN",
  "PHONE_INQUIRY",
  "SOCIAL_MEDIA",
  "ADVERTISEMENT",
  "OTHER",
];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in",
  PHONE_INQUIRY: "Phone Inquiry",
  SOCIAL_MEDIA: "Social Media",
  ADVERTISEMENT: "Advertisement",
  OTHER: "Other",
};

export const UNIT_TYPES: UnitType[] = ["1_BHK", "2_BHK", "3_BHK", "VILLA", "PLOT"];

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  "1_BHK": "1 BHK",
  "2_BHK": "2 BHK",
  "3_BHK": "3 BHK",
  VILLA: "Villa",
  PLOT: "Plot",
};

export const UNIT_STATUS_BADGE: Record<UnitStatus, { bg: string; text: string }> = {
  AVAILABLE: { bg: "bg-sage-light", text: "text-sage" },
  RESERVED: { bg: "bg-amber-light", text: "text-amber" },
  BOOKED: { bg: "bg-slate-light", text: "text-slate" },
};

export const QUERY_KEYS = {
  dashboardSummary: ["dashboard", "summary"] as const,
  dashboardFollowUps: ["dashboard", "follow-ups"] as const,
  dashboardRecentBookings: ["dashboard", "recent-bookings"] as const,
  leads: (filters: unknown) => ["leads", filters] as const,
  lead: (id: number) => ["leads", id] as const,
  leadNotes: (id: number) => ["leads", id, "notes"] as const,
  projects: ["projects"] as const,
  project: (id: number) => ["projects", id] as const,
  units: (buildingId: number) => ["units", "building", buildingId] as const,
  unit: (id: number) => ["units", id] as const,
  bookings: ["bookings"] as const,
  users: ["users"] as const,
};

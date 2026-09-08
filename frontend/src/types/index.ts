export type UserRole = "ADMIN" | "SALES_EMPLOYEE";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "SITE_VISIT"
  | "INTERESTED"
  | "NEGOTIATION"
  | "BOOKED"
  | "LOST";

export type LeadSource =
  | "WEBSITE"
  | "REFERRAL"
  | "WALK_IN"
  | "PHONE_INQUIRY"
  | "SOCIAL_MEDIA"
  | "ADVERTISEMENT"
  | "OTHER";

export interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  assigned_to: number | null;
  assigned_to_user: User | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadNote {
  id: number;
  lead_id: number;
  content: string;
  created_at: string;
  created_by_user: User | null;
}

export interface LeadCreateInput {
  name: string;
  email?: string | null;
  phone: string;
  source: LeadSource;
  assigned_to?: number | null;
  next_follow_up?: string | null;
}

export interface LeadUpdateInput {
  name?: string;
  email?: string | null;
  phone?: string;
  source?: LeadSource;
  stage?: LeadStage;
  assigned_to?: number | null;
  next_follow_up?: string | null;
}

export type UnitType = "1_BHK" | "2_BHK" | "3_BHK" | "VILLA" | "PLOT";
export type UnitStatus = "AVAILABLE" | "RESERVED" | "BOOKED";

export interface Unit {
  id: number;
  building_id: number;
  unit_number: string;
  unit_type: UnitType;
  price: string;
  status: UnitStatus;
  created_at: string;
}

export interface Building {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  created_at: string;
  unit_count: number;
}

export interface Project {
  id: number;
  name: string;
  location: string;
  description: string | null;
  created_at: string;
  building_count: number;
  unit_count: number;
}

export interface ProjectDetail extends Project {
  buildings: Building[];
}

export interface Booking {
  id: number;
  lead_id: number;
  lead_name: string;
  unit_id: number;
  unit_number: string;
  project_name: string;
  price: string;
  booked_by: number | null;
  booked_by_name: string | null;
  booking_date: string;
  status: "CONFIRMED" | "CANCELLED";
}

export interface DashboardSummary {
  total_leads: number;
  active_leads: number;
  todays_follow_ups: number;
  upcoming_follow_ups: number;
  total_bookings: number;
  available_units: number;
  booked_units: number;
  pipeline: { stage: string; count: number }[];
}

export interface FollowUpItem {
  lead_id: number;
  lead_name: string;
  phone: string;
  next_follow_up: string;
  assigned_to_name: string | null;
  bucket: "OVERDUE" | "TODAY" | "TOMORROW" | "UPCOMING";
}

export interface RecentBookingItem {
  booking_id: number;
  lead_name: string;
  unit_number: string;
  project_name: string;
  booked_by_name: string | null;
  booking_date: string;
}

export interface ApiErrorBody {
  detail: string | { msg: string; loc: (string | number)[] }[];
}

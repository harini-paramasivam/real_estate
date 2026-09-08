import { NavLink } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { cn } from "../../utils/format";

interface NavItem {
  label: string;
  to: string;
  adminOnly?: boolean;
  icon: React.ReactNode;
}

const icon = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: icon("M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-4H4v4Z") },
  { label: "Leads", to: "/leads", icon: icon("M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 0a4 4 0 0 0 3-6.6M20 21v-2a4 4 0 0 0-2.5-3.7") },
  { label: "Properties", to: "/properties", icon: icon("M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5") },
  { label: "Bookings", to: "/bookings", icon: icon("M4 4h16v4H4V4Zm0 8h16v8H4v-8Zm4-4v4m8-4v4") },
  { label: "Follow-ups", to: "/follow-ups", icon: icon("M12 7v5l3 3M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z") },
  { label: "Sales Team", to: "/users", adminOnly: true, icon: icon("M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75") },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brick font-display text-base font-semibold">
          R
        </div>
        <span className="font-display text-lg font-medium tracking-tight">Realty CRM</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white",
                isActive && "bg-white/10 text-white",
              )
            }
          >
            {item.icon}
            {item.label === "Leads" && !isAdmin ? "My Leads" : item.label === "Bookings" && !isAdmin ? "My Bookings" : item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-xs text-white/50">
        Real Estate CRM · v1.0
      </div>
    </div>
  );
}

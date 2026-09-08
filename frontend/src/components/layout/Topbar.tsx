import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { initials } from "../../utils/format";

export function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-md p-2 text-ink-soft hover:bg-canvas lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="font-display text-lg font-medium text-ink sm:text-xl">{title}</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-canvas"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brick-light text-sm font-medium text-brick-dark">
            {user ? initials(user.name) : ""}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium text-ink">{user?.name}</span>
            <span className="block text-xs text-ink-soft">
              {user?.role === "ADMIN" ? "Admin" : "Sales Employee"}
            </span>
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-border bg-white py-1 shadow-md">
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-canvas"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

import React from "react";
import { Crown, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  availableBalance?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView: _currentView, setCurrentView, availableBalance: _availableBalance = 0 }) => {
  const { isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={() => setCurrentView("dashboard")}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-primary-dark via-primary to-teal-500 flex items-center justify-center shadow-card group-hover:scale-105 transition-transform">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-bold text-sm sm:text-lg text-dark tracking-tight">VIP REWARDS</span>
              <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-primary-mint text-primary font-semibold">CLUB</span>
            </div>
            <p className="text-[11px] text-dark-secondary hidden sm:block">Elite Privileges & Membership</p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Admin Switcher */}
          {isAdmin && (
            <button
              onClick={() => setCurrentView("admin")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

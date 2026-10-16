import React from "react";
import {
  LayoutDashboard,
  Crown,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  History,
  CalendarDays,
  Settings,
  HelpCircle,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "vip", label: "Products", icon: Crown },
    { id: "deposit", label: "Deposit Funds", icon: ArrowDownCircle },
    { id: "withdraw", label: "Withdrawals", icon: ArrowUpCircle },
    { id: "referral", label: "Referral Network", icon: Users },
    { id: "history", label: "Transaction History", icon: History },
    { id: "events", label: "Upcoming Events", icon: CalendarDays },
    { id: "settings", label: "Account Settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border shrink-0 min-h-[calc(100vh-4rem)] p-4">
      {/* Nav links */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                isActive
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-dark-secondary hover:text-dark hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-gold" : "text-dark-secondary"
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* VIP Club Support Card */}
      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-primary-mint/50 to-white border border-teal-100 shadow-soft">
        <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span>Need Help?</span>
        </div>
        <p className="text-xs text-dark-secondary mb-3 leading-relaxed">
          Have an issue with a transaction or membership? Reach our 24/7 VIP desk.
        </p>
        <button
          onClick={() => setCurrentView("settings")}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white text-primary border border-primary/20 hover:bg-primary hover:text-white transition-colors shadow-sm"
        >
          Submit Ticket
        </button>
      </div>
    </aside>
  );
};

import React from "react";
import { LayoutDashboard, Crown, ArrowDownCircle, Users, Settings } from "lucide-react";

interface BottomNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
  const items = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "vip", label: "Products", icon: Crown },
    { id: "deposit", label: "Deposit", icon: ArrowDownCircle },
    { id: "referral", label: "Referral", icon: Users },
    { id: "settings", label: "Profile", icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border shadow-lg px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              isActive
                ? "text-primary font-bold scale-105"
                : "text-dark-secondary hover:text-dark"
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? "bg-primary-mint text-primary" : ""}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

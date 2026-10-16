import React from "react";
import {
  LayoutDashboard,
  Users,
  Award,
  ArrowDownCircle,
  ArrowUpCircle,
  Crown,
  Network,
  Calendar,
  MessageSquare,
  Sliders,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AdminSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onExitAdmin?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  setCurrentTab,
  onExitAdmin,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const tabs = [
    { id: "overview", label: "Overview & Analytics", icon: LayoutDashboard },
    { id: "vip_products", label: "Products & Plans", icon: Crown },
    { id: "users", label: "User Management", icon: Users },
    { id: "deposits", label: "Deposit Requests", icon: ArrowDownCircle },
    { id: "withdrawals", label: "Withdrawal Requests", icon: ArrowUpCircle },
    { id: "referrals", label: "Referral & Commissions", icon: Network },
    { id: "events", label: "Event Campaigns", icon: Calendar },
    { id: "tickets", label: "Support & Complaints", icon: MessageSquare },
    { id: "settings", label: "System Settings", icon: Sliders },
  ];

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Admin Header */}
      <div className="pb-5 mb-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow">
            ADM
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-wide text-white">VIP CONTROL</h2>
            <p className="text-[11px] text-amber-400 font-medium">Enterprise Admin Panel</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Tabs */}
      <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id);
                if (isMobile) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${isActive
                  ? "bg-primary text-white font-semibold shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-gold" : "text-slate-400"}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Admin Session & Sign Out */}
      <div className="pt-4 border-t border-slate-800 mt-auto space-y-3">
        <div className="px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="truncate mr-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Administrator</span>
            <span className="font-bold text-white truncate block">{user?.account_id || "Superadmin"}</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            ADMIN
          </span>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-rose-100 border border-rose-800/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out / Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 min-h-screen p-4 border-r border-slate-800">
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Slide-in sidebar drawer */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-white p-4 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {renderContent(true)}
        </div>
      </div>
    </>
  );
};

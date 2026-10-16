import React, { useState } from "react";
import { Menu, LogOut, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "../../components/AdminSidebar";
import { AdminOverviewView } from "./AdminOverviewView";
import { AdminUsersView } from "./AdminUsersView";
import { AdminDepositsView } from "./AdminDepositsView";
import { AdminWithdrawalsView } from "./AdminWithdrawalsView";
import { AdminVIPProductsView } from "./AdminVIPProductsView";
import { AdminReferralsView } from "./AdminReferralsView";
import { AdminEventsView } from "./AdminEventsView";
import { AdminTicketsView } from "./AdminTicketsView";
import { AdminSettingsView } from "./AdminSettingsView";
import { AdminPasswordChangeModal } from "./AdminPasswordChangeModal";
import { useAuth } from "../../context/AuthContext";

interface AdminDashboardViewProps {
  onExitAdmin?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onExitAdmin }) => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== "admin") {
    return (
      <div className="p-8 text-center text-xs text-rose-600 font-bold">
        Access Denied. Administrator privileges required.
      </div>
    );
  }

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "overview": return "Overview & Analytics";
      case "vip_products": return "Products & Plans";
      case "users": return "User Management";
      case "deposits": return "Deposit Requests";
      case "withdrawals": return "Withdrawal Requests";
      case "referrals": return "Referral & Commissions";
      case "events": return "Event Campaigns";
      case "tickets": return "Support & Complaints";
      case "settings": return "System Settings";
      default: return "Admin Console";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Forced Password Change Modal if needed */}
      <AdminPasswordChangeModal />

      {/* Admin Sidebar (Desktop & Mobile Drawer) */}
      <AdminSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onExitAdmin={onExitAdmin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Admin Header */}
        <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                ADM
              </span>
              <div>
                <h1 className="font-bold text-xs leading-none text-white">VIP CONTROL</h1>
                <span className="text-[10px] text-teal-400 font-medium">{getTabLabel(currentTab)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:text-rose-100 border border-rose-800/40 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </header>

        {/* Main Admin Tab View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {currentTab === "overview" && <AdminOverviewView onNavigateTab={setCurrentTab} />}
          {(currentTab === "vip_products" || currentTab === "vip_levels") && <AdminVIPProductsView />}
          {currentTab === "users" && <AdminUsersView />}
          {currentTab === "deposits" && <AdminDepositsView />}
          {currentTab === "withdrawals" && <AdminWithdrawalsView />}
          {currentTab === "referrals" && <AdminReferralsView />}
          {currentTab === "events" && <AdminEventsView />}
          {currentTab === "tickets" && <AdminTicketsView />}
          {currentTab === "settings" && <AdminSettingsView />}
        </main>
      </div>
    </div>
  );
};

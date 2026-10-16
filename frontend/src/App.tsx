import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { LoginView } from "./views/LoginView";
import { SignUpView } from "./views/SignUpView";
import { ForgotPasswordView } from "./views/ForgotPasswordView";
import { DashboardView } from "./views/DashboardView";
import { VIPProductsView } from "./views/VIPProductsView";
import { DepositView } from "./views/DepositView";
import { WithdrawalView } from "./views/WithdrawalView";
import { ReferralView } from "./views/ReferralView";
import { TransactionsView } from "./views/TransactionsView";
import { EventsView } from "./views/EventsView";
import { SettingsView } from "./views/SettingsView";
import { AdminDashboardView } from "./views/admin/AdminDashboardView";
import { Crown } from "lucide-react";
import { api } from "./services/api";

const AppContent: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [availableBalance, setAvailableBalance] = useState<number>(0);

  // Sync route on initial mount or query params
  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("ref") || path.includes("signup")) {
      setCurrentView("signup");
    } else if (path.includes("admin")) {
      setCurrentView("admin");
    }
  }, []);

  // Fetch initial balance if logged in as customer member
  useEffect(() => {
    if (user && !isAdmin) {
      api.getDashboard()
        .then((res) => setAvailableBalance(res.available_balance))
        .catch(console.error);
    }
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-6 select-none">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Subtle pulse halo */}
          <div className="absolute w-24 h-24 rounded-full bg-primary/10 animate-ping" />

          {/* Outer dual-tone spinner */}
          <div className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-primary border-r-amber-400 animate-spin" />

          {/* Center Brand Badge with Crown */}
          <div className="absolute w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#084B42] via-primary to-teal-500 shadow-md flex items-center justify-center border border-white/40">
            <Crown className="w-6 h-6 text-amber-300 drop-shadow" />
          </div>
        </div>

        {/* Brand Name */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-extrabold text-base tracking-tight text-slate-800">
            VIP REWARDS
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-mint text-primary">
            CLUB
          </span>
        </div>

        {/* Renamed Loading Status */}
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide">
            Loading, please wait...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated views
  if (!user) {
    if (currentView === "signup") {
      return <SignUpView onNavigate={setCurrentView} />;
    }
    if (currentView === "forgot_password") {
      return <ForgotPasswordView onNavigate={setCurrentView} />;
    }
    return <LoginView onNavigate={setCurrentView} />;
  }

  // Dedicated Admin Portal (Admins exclusively access Admin Panel)
  if (isAdmin) {
    return <AdminDashboardView />;
  }

  // If a non-admin attempts to view admin
  if (currentView === "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-rose-600 font-bold text-sm mb-3">
          Access Restricted: Administrator credentials required.
        </p>
        <button
          onClick={() => setCurrentView("dashboard")}
          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
        >
          Return to Member Area
        </button>
      </div>
    );
  }

  // Customer Member Portal
  return (
    <div className="min-h-screen bg-background flex flex-col text-dark">
      {/* Top Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        availableBalance={availableBalance}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

        {/* View Content */}
        <main className="flex-1 overflow-x-hidden">
          {currentView === "dashboard" && (
            <DashboardView
              onNavigate={setCurrentView}
              onRefreshBalance={setAvailableBalance}
            />
          )}
          {currentView === "vip" && (
            <VIPProductsView
              onNavigate={setCurrentView}
              availableBalance={availableBalance}
              onRefreshBalance={setAvailableBalance}
            />
          )}
          {currentView === "deposit" && (
            <DepositView onRefreshBalance={setAvailableBalance} />
          )}
          {currentView === "withdraw" && (
            <WithdrawalView
              availableBalance={availableBalance}
              onRefreshBalance={setAvailableBalance}
            />
          )}
          {currentView === "referral" && <ReferralView />}
          {currentView === "history" && <TransactionsView />}
          {currentView === "events" && <EventsView />}
          {currentView === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Fixed Bottom Navigation for Mobile */}
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

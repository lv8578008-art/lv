import React, { useState, useEffect } from "react";
import {
  Crown,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  History,
  TrendingUp,
  Sparkles,
  Clock,
  ChevronRight,
  ShieldAlert,
  Megaphone,
  Award,
  Target,
  X,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";
import { DashboardData } from "../types";
import { useAuth } from "../context/AuthContext";

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onRefreshBalance?: (bal: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onRefreshBalance }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVipRoadmap, setShowVipRoadmap] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesTab, setRulesTab] = useState<"deposit" | "withdrawal" | "product">("deposit");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
      if (onRefreshBalance) {
        onRefreshBalance(res.available_balance);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Loading skeleton */}
        <div className="h-36 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
          <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="font-bold text-base mb-1">Failed to load dashboard</h3>
          <p className="text-xs mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Announcements Ticker */}
      {data.announcements && data.announcements.length > 0 && (
        <div className="bg-primary-mint/80 border border-teal-200/80 rounded-2xl px-4 py-2.5 flex items-center gap-3 text-dark text-xs shadow-soft">
          <div className="p-1.5 rounded-lg bg-primary text-white shrink-0">
            <Megaphone className="w-3.5 h-3.5" />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="truncate font-medium">{data.announcements[0]}</p>
          </div>
          <span className="text-[10px] text-primary font-bold uppercase shrink-0 px-2 py-0.5 rounded bg-white">Notice</span>
        </div>
      )}

      {/* Top Member Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-teal-500 flex items-center justify-center text-white shadow-soft font-black text-sm shrink-0">
            <Crown className="w-5 h-5 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-dark">
                {data.username ? `@${data.username}` : `Member ${data.account_id}`}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {data.current_vip_name}
              </span>
            </div>
            <p className="text-xs text-dark-secondary">
              ID: <span className="font-mono font-bold text-dark">{data.account_id}</span> • +91 {data.mobile}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-border transition-all cursor-pointer"
            title="Reload fresh details and balance"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
            <span>Reload</span>
          </button>
          <button
            onClick={() => onNavigate("deposit")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs bg-primary hover:bg-primary-dark text-white shadow-soft transition-all cursor-pointer"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => onNavigate("withdraw")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs bg-gold hover:bg-gold-dark text-white shadow-soft transition-all cursor-pointer"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics (3 Clean Cards) - DISPLAYED AT TOP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Withdrawable Settlement Balance */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Withdrawable Settlement
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
              ₹
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            ₹{(data.settlement_balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
            <span className="text-slate-500">From 12 AM returns & referrals</span>
            <span
              onClick={() => onNavigate("withdraw")}
              className="text-emerald-700 font-bold cursor-pointer hover:underline"
            >
              Withdraw on VIP Day →
            </span>
          </div>
        </div>

        {/* Deposit Balance */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Deposit Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">
            ₹{(data.deposit_balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
            <span className="text-amber-800 font-medium">Buy product plans only</span>
            <span
              onClick={() => onNavigate("deposit")}
              className="text-amber-900 font-bold cursor-pointer hover:underline"
            >
              + Add Funds
            </span>
          </div>
        </div>

        {/* Total Available Balance */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-card hover:shadow-card-hover transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-dark-secondary uppercase tracking-wider">
              Total Plan Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
            ₹{data.available_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
            <span className="text-slate-500">Usable for plan purchases</span>
            <span
              onClick={() => onNavigate("vip")}
              className="text-primary font-bold cursor-pointer hover:underline"
            >
              Explore Plans →
            </span>
          </div>
        </div>
      </div>

      {/* VIP Level & Promotion Task Prompt Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-white shadow-md shrink-0">
              <Crown className="w-6 h-6 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-dark">
                  VIP Level {data.current_vip_level}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {data.current_vip_name}
                </span>
              </div>
              <p className="text-xs text-dark-secondary">
                Cumulative Plan Purchases: <span className="font-bold text-dark">₹{(data.total_plan_purchases ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVipRoadmap(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>VIP Levels Roadmap</span>
            </button>
            <button
              onClick={() => onNavigate("vip")}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black transition-all shadow-soft cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore Products</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Prompt & Milestone Progress */}
        <div className="pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-50/80 via-emerald-50/40 to-amber-50/60 p-4 rounded-2xl border border-teal-100">
            <div className="flex items-start sm:items-center gap-3">
              <span className="flex h-3 w-3 relative mt-0.5 sm:mt-0 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-primary block">
                  VIP Promotion Task
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {data.vip_task_prompt || (data.next_vip_level ? `Buy ₹${(data.vip_amount_needed ?? 2000).toLocaleString("en-IN")} more in plans to unlock VIP Level ${data.next_vip_level}!` : "Maximum VIP Tier 7 Achieved!")}
                </p>
              </div>
            </div>

            {data.next_vip_level !== null && (
              <div className="sm:text-right shrink-0 bg-white/70 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Milestone Target</span>
                <span className="text-xs font-black text-primary">
                  ₹{(data.total_plan_purchases ?? 0).toLocaleString("en-IN")} / ₹{(data.next_vip_threshold ?? 2000).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {data.next_vip_level !== null && (
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-teal-500 via-primary to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(4, data.vip_progress_percent ?? 0))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>VIP {data.current_vip_level}</span>
                <span className="font-bold text-primary">{data.vip_progress_percent ?? 0}% completed</span>
                <span>VIP {data.next_vip_level} (₹{(data.next_vip_threshold ?? 2000).toLocaleString("en-IN")})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIP Levels Roadmap Modal */}
      {showVipRoadmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-dark">VIP Level Progression Roadmap</h3>
                  <p className="text-xs text-dark-secondary">Accumulate plan purchases to promote to higher VIP levels</p>
                </div>
              </div>
              <button
                onClick={() => setShowVipRoadmap(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { lvl: 0, req: 0, nextReq: 2000, nextLvl: 1, day: "Sunday", desc: "Default entry level. Buy ₹2,000 in product plans to promote to VIP 1." },
                { lvl: 1, req: 2000, nextReq: 4000, nextLvl: 2, day: "Saturday", desc: "Unlocked at ₹2,000. Buy ₹4,000 total to promote to VIP 2." },
                { lvl: 2, req: 4000, nextReq: 6000, nextLvl: 3, day: "Friday", desc: "Unlocked at ₹4,000. Buy ₹6,000 total to promote to VIP 3." },
                { lvl: 3, req: 6000, nextReq: 8000, nextLvl: 4, day: "Thursday", desc: "Unlocked at ₹6,000. Buy ₹8,000 total to promote to VIP 4." },
                { lvl: 4, req: 8000, nextReq: 10000, nextLvl: 5, day: "Wednesday", desc: "Unlocked at ₹8,000. Buy ₹10,000 total to promote to VIP 5." },
                { lvl: 5, req: 10000, nextReq: 12000, nextLvl: 6, day: "Tuesday", desc: "Unlocked at ₹10,000. Buy ₹12,000 total to promote to VIP 6." },
                { lvl: 6, req: 12000, nextReq: 14000, nextLvl: 7, day: "Monday", desc: "Unlocked at ₹12,000. Buy ₹14,000 total to promote to VIP 7." },
                { lvl: 7, req: 14000, nextReq: null, nextLvl: null, day: "Daily Priority", desc: "Elite VIP Tier! Unlocked at ₹14,000. Instant daily withdrawals active." },
              ].map((tier) => {
                const isCurrent = data.current_vip_level === tier.lvl;
                const isAchieved = data.current_vip_level >= tier.lvl;

                return (
                  <div
                    key={tier.lvl}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? "bg-primary/5 border-primary ring-2 ring-primary/20"
                        : isAchieved
                        ? "bg-slate-50 border-slate-200"
                        : "bg-white border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? "bg-primary text-white"
                            : isAchieved
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        V{tier.lvl}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-dark">VIP Level {tier.lvl}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">
                              Current Tier
                            </span>
                          )}
                          {isAchieved && !isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Achieved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{tier.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Spend</span>
                        <span className="font-black text-dark">₹{tier.req.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Withdrawal Day</span>
                        <span className="font-bold text-primary">{tier.day}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowVipRoadmap(false);
                  onNavigate("vip");
                }}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-soft cursor-pointer"
              >
                Go to Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12:00 AM Settlement Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-indigo-800/40 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                12:00 AM Settlement Engine
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Auto Midnight Credit
              </span>
            </div>
            <p className="text-xs text-indigo-100 mt-0.5">
              {data.daily_settlement_info?.has_active_plan
                ? `Active Return: ₹${data.daily_settlement_info.daily_income_amount.toLocaleString("en-IN")}/day credits at 12:00 AM (${data.daily_settlement_info.time_until_midnight} remaining)`
                : "Product plan earnings automatically credit to your withdrawable balance at 12:00 AM every night."}
            </p>
          </div>
        </div>

        {data.daily_settlement_info?.has_active_plan ? (
          <div className="text-left sm:text-right shrink-0 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">Next 12 AM Credit</span>
            <span className="text-xs font-black text-amber-300">In {data.daily_settlement_info.time_until_midnight}</span>
          </div>
        ) : (
          <button
            onClick={() => onNavigate("vip")}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all shadow-soft cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <span>Activate Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>


      {/* In-Flight Processing Notice (Only shown if pending funds exist) */}
      {(data.pending_deposit_amount > 0 || data.pending_withdrawal_amount > 0) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {data.pending_deposit_amount > 0 && (
                <span className="mr-3">
                  Pending Deposit: <strong className="text-amber-700">₹{data.pending_deposit_amount.toLocaleString("en-IN")}</strong> (verified within 24h)
                </span>
              )}
              {data.pending_withdrawal_amount > 0 && (
                <span>
                  Payout In-Flight: <strong className="text-blue-700">₹{data.pending_withdrawal_amount.toLocaleString("en-IN")}</strong> (releases 24–42h)
                </span>
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Please be patient while processing</span>
        </div>
      )}

      {/* 1-Tap Official Platform Rules Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-primary-mint/20 to-teal-500/10 rounded-2xl p-4 border border-amber-300/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-soft">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">Official Platform Rules & Policy</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Important
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Deposits for plans only (&lt;24h credit) • Settlement withdrawals on VIP day (24–42h release) • 12 AM returns
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowRulesModal(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-soft transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <span>View Rules (1-Tap)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1-Tap Rules Modal Dialog */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-dark">Official Platform Operating Rules</h3>
                  <p className="text-xs text-dark-secondary">Deposit SLA, VIP Withdrawal Rules & Product Guidelines</p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 gap-2">
              <button
                onClick={() => setRulesTab("deposit")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  rulesTab === "deposit"
                    ? "border-amber-600 text-amber-900"
                    : "border-transparent text-slate-500 hover:text-dark"
                }`}
              >
                💳 Deposit Rules
              </button>
              <button
                onClick={() => setRulesTab("withdrawal")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  rulesTab === "withdrawal"
                    ? "border-emerald-600 text-emerald-900"
                    : "border-transparent text-slate-500 hover:text-dark"
                }`}
              >
                🏧 Withdrawal Rules
              </button>
              <button
                onClick={() => setRulesTab("product")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  rulesTab === "product"
                    ? "border-teal-600 text-teal-900"
                    : "border-transparent text-slate-500 hover:text-dark"
                }`}
              >
                📦 Product Plan Rules
              </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-2">
              {rulesTab === "deposit" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <span className="font-extrabold text-amber-950 text-xs flex items-center gap-2">
                      <span>🛍️</span>
                      <span>1. Dedicated Strictly for Plan Purchases</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Once deposited, funds enter your <strong>Deposit Balance</strong> and can strictly be used only to purchase and activate product plans. Deposited principal <strong>cannot be withdrawn directly</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <span className="font-extrabold text-amber-950 text-xs flex items-center gap-2">
                      <span>⏱️</span>
                      <span>2. 24-Hour Account Credit Window</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      After submitting your 12-digit UTR and payment screenshot, your deposit is reviewed and reaches your account <strong>within 24 hours of deposit time</strong>. Please remain patient while verification finishes.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                    <span className="font-extrabold text-teal-950 text-xs flex items-center gap-2">
                      <span>💰</span>
                      <span>3. 100% Withdrawable Daily Returns</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Activating product plans with your deposit generates nightly 12:00 AM returns that credit directly into your <strong>withdrawable settlement balance</strong>.
                    </p>
                  </div>
                </div>
              )}

              {rulesTab === "withdrawal" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-2">
                      <span>💰</span>
                      <span>1. Settlement Balance Only</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Only <strong>Settlement Earnings</strong> (earned from 12:00 AM daily product returns and referral commissions) can be withdrawn. Deposited funds cannot be withdrawn directly.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-2">
                      <span>📅</span>
                      <span>2. VIP Permitted Day Schedule</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Withdrawals are submitted on your VIP tier's designated weekly day (VIP 0 Sunday, VIP 1 Saturday, VIP 2 Friday, VIP 3 Thursday, VIP 4 Wednesday, VIP 5 Tuesday, VIP 6 Monday, VIP 7 Priority Daily).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                    <span className="font-extrabold text-teal-950 text-xs flex items-center gap-2">
                      <span>⏱️</span>
                      <span>3. 24 to 42 Hours Release Window</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Approved payouts are disbursed and reach your bank account or UPI ID <strong>within 24 to 42 hours</strong>. Please remain patient during security and bank clearing.
                    </p>
                  </div>
                </div>
              )}

              {rulesTab === "product" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                    <span className="font-extrabold text-teal-950 text-xs flex items-center gap-2">
                      <span>🛍️</span>
                      <span>1. Dual Balance Funding</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Plans can be activated using either your Deposit Balance or your accumulated Settlement Balance (deposit funds are consumed first).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                    <span className="font-extrabold text-teal-950 text-xs flex items-center gap-2">
                      <span>⚡</span>
                      <span>2. 12:00 AM Midnight Returns</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Activated plans credit their first return at 12:00 AM tonight, and continue automatically every night at 12:00 AM (00:00 IST).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                    <span className="font-extrabold text-teal-950 text-xs flex items-center gap-2">
                      <span>🎯</span>
                      <span>3. VIP Tier Elevation & Purchase Quotas</span>
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Every plan purchase elevates your progress to the next VIP level. Member purchase quotas ensure fair stock availability.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Official VIP Platform SLA Terms</span>
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close (Got it)
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Two Column Layout: Active Membership Details + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Membership Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-border shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-dark-secondary">
                Membership Status
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  data.membership_status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {data.membership_status}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-primary-mint/30 border border-teal-100 mb-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-gold flex items-center justify-center mx-auto mb-2 shadow-soft">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-extrabold text-base text-dark">{data.current_vip_name}</h4>
              <p className="text-xs text-dark-secondary mt-1">
                {user?.active_membership
                  ? `Valid for ${user.active_membership.days_remaining} more days`
                  : "No active VIP tier selected"}
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-dark-secondary">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Total Plan Purchases</span>
                <span className="font-bold text-dark">₹{(data.total_plan_purchases ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Total Deposited</span>
                <span className="font-medium text-dark">₹{data.total_deposited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Total Withdrawn</span>
                <span className="font-medium text-dark">₹{data.total_withdrawn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("vip")}
            className="w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-bold text-primary bg-primary-mint hover:bg-teal-100 border border-teal-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Upgrade or Renew VIP Tier</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-dark">Recent Financial Activity</h3>
              <p className="text-xs text-dark-secondary">Verified ledger audit records</p>
            </div>
            <button
              onClick={() => onNavigate("history")}
              className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
            >
              View Full History →
            </button>
          </div>

          {data.recent_transactions && data.recent_transactions.length > 0 ? (
            <div className="divide-y divide-border">
              {data.recent_transactions.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isCredit ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isCredit ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-dark">{tx.description}</div>
                        <div className="text-[11px] text-dark-secondary font-mono">{tx.date} • {tx.reference_id || `ID #${tx.id}`}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-extrabold ${
                          isCredit ? "text-emerald-700" : "text-dark"
                        }`}
                      >
                        {isCredit ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-dark-secondary">
                        Bal: ₹{tx.balance_after.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-dark-secondary text-xs">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <span>No ledger records yet. Make your first deposit or activate a VIP level to begin.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import {
  Users,
  Crown,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Activity,
  Award,
  ChevronRight,
  Zap,
  Calendar,
  Sparkles,
} from "lucide-react";
import { api } from "../../services/api";
import { AdminStats } from "../../types";
import { useToast } from "../../context/ToastContext";
import { formatDateTime } from "../../utils/date";

interface AdminOverviewViewProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 12:00 AM Daily Settlement Engine State
  const [settlementStatus, setSettlementStatus] = useState<any | null>(null);
  const [triggeringSettlement, setTriggeringSettlement] = useState(false);

  const fetchStats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getAdminStats();
      setStats(res);
      const settleRes = await api.getDailySettlementStatus().catch(() => null);
      if (settleRes) setSettlementStatus(settleRes);
    } catch (err: any) {
      if (!isBackground) {
        showToast(err.message || "Failed to load admin analytics", "error");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Real-time live polling every 8 seconds
    const interval = setInterval(() => {
      fetchStats(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerSettlement = async (forceRun = false) => {
    try {
      setTriggeringSettlement(true);
      const res = await api.triggerDailySettlement({ force_run: forceRun });
      if (res.settled_count > 0) {
        showToast(`Settlement Success! Credited ₹${res.total_amount_credited.toLocaleString("en-IN")} across ${res.settled_count} active plans.`, "success");
      } else {
        showToast(`Settlement Checked: All ${res.skipped_already_settled} active plans are already settled for ${res.settlement_date}.`, "info");
      }
      fetchStats(true);
    } catch (err: any) {
      showToast(err.message || "Failed to execute daily settlement", "error");
    } finally {
      setTriggeringSettlement(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Navigation Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
              <span>Live Real-Time Feed</span>
              <span className="text-[10px] text-slate-400 font-normal">(Auto-sync 8s)</span>
            </span>
          </div>
          <h2 className="text-lg font-black tracking-tight">System Navigation & Management</h2>
          <p className="text-xs text-slate-300">
            Quickly configure VIP spend thresholds, post investment plans, or manage member accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab("vip_products")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Products & VIP Tiers</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button
            onClick={() => onNavigateTab("users")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Users</span>
          </button>

          <button
            onClick={() => onNavigateTab("deposits")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs transition-all cursor-pointer"
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
            <span>Deposits</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigateTab("users")}
          className="bg-white p-5 rounded-2xl border border-border shadow-card hover:shadow-card-hover cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-dark-secondary">Total Users</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-dark">{stats.total_users}</div>
          <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Active Member Accounts</span>
        </div>

        {/* Active Memberships */}
        <div
          onClick={() => onNavigateTab("vip_products")}
          className="bg-white p-5 rounded-2xl border border-border shadow-card hover:shadow-card-hover cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-dark-secondary">Active Memberships</span>
            <div className="p-2 rounded-xl bg-amber-50 text-gold">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-dark">{stats.active_memberships}</div>
          <span className="text-[11px] text-gold font-semibold mt-1 block">VIP Tier Passes Active</span>
        </div>

        {/* Pending Deposits */}
        <div
          onClick={() => onNavigateTab("deposits")}
          className="bg-white p-5 rounded-2xl border border-border shadow-card hover:shadow-card-hover cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-dark-secondary">Deposits Awaiting Review</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{stats.pending_deposits_sum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {stats.pending_deposits_count} Requests in Queue
          </span>
        </div>

        {/* Pending Withdrawals */}
        <div
          onClick={() => onNavigateTab("withdrawals")}
          className="bg-white p-5 rounded-2xl border border-border shadow-card hover:shadow-card-hover cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-dark-secondary">Withdrawals Awaiting Review</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">
            ₹{stats.pending_withdrawals_sum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
            {stats.pending_withdrawals_count} Requests in Queue
          </span>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-card">
          <span className="text-xs font-bold uppercase text-dark-secondary block mb-1">
            Total Verified Deposits (Gross Inflow)
          </span>
          <div className="text-2xl font-black text-dark">
            ₹{stats.verified_deposits_sum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-card">
          <span className="text-xs font-bold uppercase text-dark-secondary block mb-1">
            Total Disbursed Withdrawals (Gross Outflow)
          </span>
          <div className="text-2xl font-black text-dark">
            ₹{stats.completed_withdrawals_sum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-card">
          <span className="text-xs font-bold uppercase text-dark-secondary block mb-1">
            Total Referral Commissions Distributed
          </span>
          <div className="text-2xl font-black text-emerald-700">
            ₹{stats.total_commission_distributed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* 12:00 AM Daily Return Settlement Engine Console */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 border border-indigo-700/50 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-wide text-white">12:00 AM Daily Return Settlement Engine</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Online & Active
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Automatically credits daily returns for all active user investment plans every night at 12:00 AM (00:00 IST).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => handleTriggerSettlement(true)}
              disabled={triggeringSettlement}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Force run 12:00 AM settlement immediately to credit all active plans"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{triggeringSettlement ? "Processing Settlement..." : "⚡ Run 12:00 AM Settlement Now"}</span>
            </button>
          </div>
        </div>

        {settlementStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-indigo-800/40">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                Current IST Time
              </span>
              <div className="font-mono font-bold text-sm text-white">
                {settlementStatus.ist_current_time?.split(" ")[1] || "12:00:00"} <span className="text-[10px] text-indigo-300">IST</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{settlementStatus.today_date}</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                Next 12:00 AM Run
              </span>
              <div className="font-bold text-sm text-amber-400">
                In {settlementStatus.time_until_midnight}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">At 00:00:00 IST Tonight</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                Active Plans Queue
              </span>
              <div className="font-black text-sm text-emerald-400">
                {settlementStatus.total_active_plans} Active Plans
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {settlementStatus.settled_today_count} Settled / {settlementStatus.pending_today_count} Pending
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                Daily Yield Pool
              </span>
              <div className="font-black text-sm text-white">
                ₹{settlementStatus.daily_yield_pool?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Disbursed Every 24h</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Administrative Audit Trail */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-base text-dark">Recent Administrative Audit Events</h3>
          </div>
          <span className="text-xs text-dark-secondary">Server-side logged actions</span>
        </div>

        {stats.recent_audit_logs && stats.recent_audit_logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-dark-secondary uppercase text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Target</th>
                  <th className="py-2.5 px-4">Audit Details</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {stats.recent_audit_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-slate-100 text-dark">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-primary">{log.target}</td>
                    <td className="py-3 px-4 text-dark-secondary">{log.details}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{formatDateTime(log.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-dark-secondary">No audit logs recorded yet.</div>
        )}
      </div>
    </div>
  );
};

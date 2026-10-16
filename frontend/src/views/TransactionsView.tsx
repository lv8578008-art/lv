import React, { useState, useEffect } from "react";
import {
  History,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  Crown,
  Filter,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export const TransactionsView: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"deposits" | "withdrawals" | "referrals" | "vip">("deposits");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setItems([]);

    api.getTransactions(activeTab, statusFilter)
      .then((res) => {
        if (!isCancelled) {
          setItems(Array.isArray(res) ? res : []);
        }
      })
      .catch((err: any) => {
        if (!isCancelled) {
          showToast(err.message || "Failed to load transactions", "error");
          setItems([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeTab, statusFilter]);

  const tabs = [
    { id: "deposits", label: "Deposit History", icon: ArrowDownCircle },
    { id: "withdrawals", label: "Withdrawal History", icon: ArrowUpCircle },
    { id: "referrals", label: "Referral Rewards", icon: Users },
    { id: "vip", label: "VIP Plan Activations", icon: Crown },
  ];

  const handleTabChange = (tabId: "deposits" | "withdrawals" | "referrals" | "vip") => {
    if (tabId === activeTab) return;
    setItems([]);
    setLoading(true);
    setActiveTab(tabId);
    setStatusFilter("ALL");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-card">
        <div className="max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-mint text-primary font-bold text-xs">
            <History className="w-3.5 h-3.5" />
            <span>Audit Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
            Financial Transaction History
          </h1>
          <p className="text-xs sm:text-sm text-dark-secondary leading-relaxed">
            Complete, immutable audit trails of your deposits, scheduled withdrawals, referral commissions, and VIP plan purchases.
          </p>
        </div>
      </div>

      {/* Tabs and Status Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* 4 Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-primary shadow-sm"
                    : "text-dark-secondary hover:text-dark hover:bg-slate-200/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-dark-secondary"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-dark-secondary" />
          <span className="font-semibold text-dark-secondary">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-border text-dark text-xs font-semibold focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Records</option>
            <option value="PENDING">Pending / Processing</option>
            <option value="APPROVED">Approved / Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            {activeTab === "deposits" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-dark-secondary font-semibold uppercase text-[10px] border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">UTR Reference</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Admin Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {items.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-dark">{d.txn_id}</td>
                      <td className="py-3.5 px-4 font-black text-emerald-700">
                        +₹{Number(d.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-dark-secondary">{d.utr}</td>
                      <td className="py-3.5 px-4 text-dark-secondary font-mono">{d.date}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-dark-secondary">{d.admin_notes || "Under review"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "withdrawals" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-dark-secondary font-semibold uppercase text-[10px] border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Withdrawal ID</th>
                    <th className="py-3 px-4">Gross Amount</th>
                    <th className="py-3 px-4">Fee</th>
                    <th className="py-3 px-4">Net Disbursed</th>
                    <th className="py-3 px-4">VIP Day</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Bank Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {items.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-dark">{w.withdrawal_id}</td>
                      <td className="py-3.5 px-4">₹{Number(w.amount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4 text-dark-secondary">₹{Number(w.fee ?? 0).toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-black text-dark">
                        ₹{Number(w.net_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-dark-secondary">{w.permitted_day}</td>
                      <td className="py-3.5 px-4 text-dark-secondary font-mono">{w.date}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : w.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-dark-secondary">
                        {w.payout_reference || "Processing"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "referrals" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-dark-secondary font-semibold uppercase text-[10px] border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Commission ID</th>
                    <th className="py-3 px-4">Tier Level</th>
                    <th className="py-3 px-4">Downline Member</th>
                    <th className="py-3 px-4">Purchase Volume</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {items.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-dark">{r.txn_id}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px]">
                          Level {r.level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{r.buyer}</td>
                      <td className="py-3.5 px-4">₹{Number(r.purchase_amount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4 font-bold text-primary">{r.rate}%</td>
                      <td className="py-3.5 px-4 font-black text-emerald-700">
                        +₹{Number(r.commission_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-dark-secondary font-mono">{r.date}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "vip" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-dark-secondary font-semibold uppercase text-[10px] border-b border-border">
                  <tr>
                    <th className="py-3 px-4">VIP Level</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4">Price Paid</th>
                    <th className="py-3 px-4">Activated On</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {items.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-dark">VIP {v.vip_level}</td>
                      <td className="py-3.5 px-4 font-semibold text-primary">{v.product_name}</td>
                      <td className="py-3.5 px-4 font-bold text-dark">₹{Number(v.price_paid || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4 text-dark-secondary font-mono">{v.start_date}</td>
                      <td className="py-3.5 px-4 text-dark-secondary font-mono">{v.expiry_date}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            !v.is_expired
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {!v.is_expired ? "ACTIVE" : "EXPIRED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-dark-secondary text-xs">
            <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p>No records found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

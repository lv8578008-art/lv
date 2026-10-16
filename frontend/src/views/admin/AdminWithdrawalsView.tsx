import React, { useState, useEffect } from "react";
import {
  ArrowUpCircle,
  Building2,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  ShieldCheck,
  Send,
} from "lucide-react";
import { api } from "../../services/api";
import { WithdrawalRequest } from "../../types";
import { useToast } from "../../context/ToastContext";
import { formatDateTime } from "../../utils/date";

export const AdminWithdrawalsView: React.FC = () => {
  const { showToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  // Approve & Payout modal
  const [approveItem, setApproveItem] = useState<WithdrawalRequest | null>(null);
  const [payoutRef, setPayoutRef] = useState("");
  const [adminNotes, setAdminNotes] = useState("Disbursed via Corporate NetBanking");

  // Reject modal
  const [rejectItem, setRejectItem] = useState<WithdrawalRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState("Invalid bank credentials / Beneficiary mismatch");

  const fetchWithdrawals = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getAdminWithdrawals(statusFilter);
      setWithdrawals(res);
    } catch (err: any) {
      if (!isBackground) {
        showToast(err.message || "Failed to load withdrawals", "error");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    // Live real-time sync every 8 seconds
    const interval = setInterval(() => {
      fetchWithdrawals(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleConfirmPayout = async () => {
    if (!approveItem) return;
    try {
      await api.decideWithdrawal(
        approveItem.id,
        "PAID",
        payoutRef.trim() || undefined,
        adminNotes.trim()
      );
      showToast(`Withdrawal ${approveItem.withdrawal_id} marked PAID and reconciled!`, "success");
      setApproveItem(null);
      setPayoutRef("");
      fetchWithdrawals();
    } catch (err: any) {
      showToast(err.message || "Action failed", "error");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectItem) return;
    try {
      await api.decideWithdrawal(
        rejectItem.id,
        "REJECTED",
        undefined,
        rejectNotes.trim()
      );
      showToast(
        `Withdrawal ${rejectItem.withdrawal_id} rejected. Reserved funds restored to customer.`,
        "info"
      );
      setRejectItem(null);
      fetchWithdrawals();
    } catch (err: any) {
      showToast(err.message || "Action failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
              Real-Time Withdrawal Queue (Live)
            </span>
          </div>
          <h2 className="text-lg font-black text-dark">Withdrawal Disbursement Queue</h2>
          <p className="text-xs text-dark-secondary">
            Process scheduled payouts, disburse funds to customer bank/UPI accounts, and record payment references.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          {["PENDING", "PAID", "REJECTED", "ALL"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === st
                  ? "bg-white text-primary shadow-sm"
                  : "text-dark-secondary hover:text-dark"
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-dark-secondary uppercase text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Withdrawal ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Payout Method Details</th>
                  <th className="py-3 px-4">Permitted Day</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Disbursement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-dark">{w.withdrawal_id}</td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-primary">{w.account_id}</div>
                      <div className="text-[10px] text-dark-secondary">+91 {w.mobile}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        VIP {w.vip_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">₹{w.requested_amount.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                      ₹{w.net_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-dark">{w.payout_details?.account_holder}</div>
                      <div className="text-[11px] text-dark-secondary font-mono">
                        {w.payout_method_type === "BANK"
                          ? `${w.payout_details?.bank_name || "Bank"}: ${w.payout_details?.account_number} (${w.payout_details?.ifsc_code})`
                          : `UPI: ${w.payout_details?.upi_id}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-dark-secondary">{w.permitted_day}</td>
                    <td className="py-3.5 px-4 text-dark-secondary font-mono">{formatDateTime(w.created_at)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : w.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {w.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setApproveItem(w);
                              setPayoutRef(`IMPS${Math.floor(10000000 + Math.random() * 90000000)}`);
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm transition-colors"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => setRejectItem(w)}
                            className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px]">
                          <span className="font-mono text-dark block">{w.payout_reference}</span>
                          <span className="text-slate-400">{w.admin_notes}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-dark-secondary">
            No withdrawal requests in this status.
          </div>
        )}
      </div>

      {/* Payout Approval Modal */}
      {approveItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-dark">Confirm Payout Disbursement</h3>
              <button onClick={() => setApproveItem(null)} className="text-slate-400 hover:text-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Beneficiary:</span>
                <span className="font-bold text-dark">{approveItem.payout_details?.account_holder}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Payable:</span>
                <span className="font-black text-emerald-800 text-sm">₹{approveItem.net_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Destination:</span>
                <span className="font-mono text-dark">
                  {approveItem.payout_method_type === "BANK"
                    ? `${approveItem.payout_details?.account_number} (${approveItem.payout_details?.ifsc_code})`
                    : approveItem.payout_details?.upi_id}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark mb-1">
                Banking Reference Number (IMPS / UTR)
              </label>
              <input
                type="text"
                value={payoutRef}
                onChange={(e) => setPayoutRef(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark mb-1">
                Admin Notes
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setApproveItem(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayout}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                Confirm Paid & Reconcile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-dark">Reject Withdrawal Request</h3>
              <button onClick={() => setRejectItem(null)} className="text-slate-400 hover:text-dark">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-dark-secondary">
              Rejecting this request will automatically refund the locked ₹{rejectItem.requested_amount.toLocaleString()} back to the customer's available balance.
            </p>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRejectItem(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                Confirm & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

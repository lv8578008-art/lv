import React, { useState, useEffect } from "react";
import {
  ArrowDownCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  X,
  FileImage,
  ShieldCheck,
} from "lucide-react";
import { api } from "../../services/api";
import { DepositRequest } from "../../types";
import { useToast } from "../../context/ToastContext";
import { formatDateTime } from "../../utils/date";

export const AdminDepositsView: React.FC = () => {
  const { showToast } = useToast();
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  // Screenshot viewer modal
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);

  // Reject modal
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("UTR does not match bank settlement");

  const fetchDeposits = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getAdminDeposits(statusFilter);
      setDeposits(res);
    } catch (err: any) {
      if (!isBackground) {
        showToast(err.message || "Failed to load deposit requests", "error");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
    // Live real-time sync every 8 seconds
    const interval = setInterval(() => {
      fetchDeposits(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleApprove = async (dep: DepositRequest) => {
    try {
      await api.decideDeposit(dep.id, "APPROVED", "Verified against bank settlement record");
      showToast(`Deposit ${dep.txn_id} approved. ₹${dep.amount} credited to customer balance.`, "success");
      fetchDeposits();
    } catch (err: any) {
      showToast(err.message || "Approval failed", "error");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectId) return;
    try {
      await api.decideDeposit(rejectId, "REJECTED", rejectReason);
      showToast("Deposit rejected with reason logged.", "info");
      setRejectId(null);
      fetchDeposits();
    } catch (err: any) {
      showToast(err.message || "Rejection failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and status tabs */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
              Real-Time Deposit Queue (Live)
            </span>
          </div>
          <h2 className="text-lg font-black text-dark">Deposit Request Queue</h2>
          <p className="text-xs text-dark-secondary">
            Verify payment screenshots and 12-digit UTR numbers before crediting member funds.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
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

      {/* Deposit Requests Table */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : deposits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-dark-secondary uppercase text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Txn ID</th>
                  <th className="py-3 px-4">Account ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">UTR Number</th>
                  <th className="py-3 px-4">Screenshot Proof</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-dark">{d.txn_id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">{d.account_id}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                      ₹{d.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-dark">{d.utr}</td>
                    <td className="py-3.5 px-4">
                      {d.screenshot_url ? (
                        <button
                          type="button"
                          onClick={() => setViewScreenshotUrl(d.screenshot_url)}
                          className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                        >
                          <FileImage className="w-4 h-4" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">No file</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-dark-secondary font-mono">{formatDateTime(d.created_at)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : d.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {d.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(d)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectId(d.id)}
                            className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">{d.admin_notes || "Decision finalized"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-dark-secondary">
            No deposit requests in this queue.
          </div>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      {viewScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-dark">Payment Screenshot Evidence</h3>
              <button onClick={() => setViewScreenshotUrl(null)} className="text-slate-400 hover:text-dark">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-slate-50 p-2 rounded-xl">
              <img
                src={viewScreenshotUrl.startsWith("http") ? viewScreenshotUrl : `http://127.0.0.1:8000${viewScreenshotUrl}`}
                alt="Payment proof"
                className="max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            <button
              onClick={() => setViewScreenshotUrl(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-dark font-bold text-xs"
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-dark">Reject Deposit Request</h3>
              <button onClick={() => setRejectId(null)} className="text-slate-400 hover:text-dark">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-dark-secondary">
              Please enter the formal rejection reason. This will be visible to the customer.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRejectId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

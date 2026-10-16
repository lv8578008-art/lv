import React, { useState, useEffect } from "react";
import {
  ArrowUpCircle,
  Calendar,
  Building2,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ChevronRight,
  X,
  XCircle,
} from "lucide-react";
import { api } from "../services/api";
import { WithdrawalRequest, PayoutMethod } from "../types";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../utils/date";

interface WithdrawalViewProps {
  availableBalance: number;
  onRefreshBalance?: (bal: number) => void;
}

export const WithdrawalView: React.FC<WithdrawalViewProps> = ({
  availableBalance,
  onRefreshBalance,
}) => {
  const { showToast } = useToast();
  const [showRulesModal, setShowRulesModal] = useState(false);

  const [schedule, setSchedule] = useState<any>(null);
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  const [amount, setAmount] = useState<string>("500");
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // New payout method form modal
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodType, setMethodType] = useState<"BANK" | "UPI">("BANK");
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [addingMethod, setAddingMethod] = useState(false);

  const fetchWithdrawalData = async () => {
    try {
      const [schedRes, methRes, wthRes] = await Promise.all([
        api.getWithdrawalSchedule(),
        api.getPayoutMethods(),
        api.getWithdrawals(),
      ]);
      setSchedule(schedRes);
      setMethods(methRes);
      if (methRes.length > 0 && selectedMethodId === null) {
        const def = methRes.find((m: PayoutMethod) => m.is_default) || methRes[0];
        setSelectedMethodId(def.id);
      }
      setWithdrawals(wthRes);
    } catch (err: any) {
      showToast(err.message || "Failed to load withdrawal data", "error");
    }
  };

  useEffect(() => {
    fetchWithdrawalData();
  }, []);

  const handleAddPayoutMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holderName.trim()) {
      showToast("Please enter Account Holder Name.", "error");
      return;
    }

    if (methodType === "BANK") {
      if (!accountNumber.trim() || !ifsc.trim()) {
        showToast("Please enter Bank Account Number and IFSC Code.", "error");
        return;
      }
    } else {
      if (!upiId.trim() || !upiId.includes("@")) {
        showToast("Please enter a valid UPI address (e.g. name@okhdfcbank).", "error");
        return;
      }
    }

    try {
      setAddingMethod(true);
      const newMethod = await api.addPayoutMethod({
        type: methodType,
        account_holder: holderName.trim(),
        account_number: methodType === "BANK" ? accountNumber.trim() : undefined,
        ifsc_code: methodType === "BANK" ? ifsc.trim().toUpperCase() : undefined,
        bank_name: methodType === "BANK" ? bankName.trim() : undefined,
        upi_id: methodType === "UPI" ? upiId.trim() : undefined,
      });

      showToast("Payout method added successfully!", "success");
      setShowAddMethod(false);
      setHolderName("");
      setAccountNumber("");
      setIfsc("");
      setBankName("");
      setUpiId("");
      await fetchWithdrawalData();
      setSelectedMethodId(newMethod.id);
    } catch (err: any) {
      showToast(err.message || "Failed to save payout method.", "error");
    } finally {
      setAddingMethod(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 199 || numAmount > 99999) {
      showToast("Withdrawal amount must be between ₹199 and ₹99,999.", "error");
      return;
    }
    if (numAmount > availableBalance) {
      showToast(`Insufficient balance. Available balance is ₹${availableBalance.toLocaleString()}.`, "error");
      return;
    }
    if (!selectedMethodId) {
      showToast("Please select or add a verified payout method.", "error");
      return;
    }
    if (schedule && !schedule.is_eligible_today && !schedule.test_mode) {
      showToast(
        `Your VIP Level ${schedule.current_vip_level} withdrawal day is ${schedule.permitted_day}. Today is ${schedule.today_day}.`,
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      const res = await api.submitWithdrawal({
        amount: numAmount,
        payout_method_id: selectedMethodId,
      });

      showToast(
        `Withdrawal request ${res.withdrawal_id} submitted for ₹${res.net_amount.toLocaleString()}! Payout will reach your account within 24 to 42 hours. Please be patient.`,
        "success"
      );

      // Refresh balances
      const dash = await api.getDashboard();
      if (onRefreshBalance) {
        onRefreshBalance(dash.available_balance);
      }
      await fetchWithdrawalData();
    } catch (err: any) {
      showToast(err.message || "Failed to submit withdrawal request.", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = () => {
    const num = parseFloat(amount) || 0;
    const feePct = schedule?.fee_percent || 0;
    const fee = (feePct / 100) * num;
    const net = Math.max(0, num - fee);
    return { fee, net };
  };

  const { fee, net } = calculateFee();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-card">
        <div className="max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-mint text-primary font-bold text-xs">
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Fund Disbursement Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
            Scheduled VIP Withdrawals
          </h1>
          <p className="text-xs sm:text-sm text-dark-secondary leading-relaxed">
            Fast, secure payouts directly to your verified Indian bank account or UPI ID in accordance with your VIP level's weekly withdrawal day.
          </p>
        </div>
      </div>

      {/* 1-Tap Official Platform Withdrawal Rules Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-primary-mint/15 rounded-2xl p-4 border border-emerald-300/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-soft font-bold">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">Official Withdrawal Rules & Payout Policy</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                Notice
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Settlement balance only • Permitted weekly VIP day • Released within 24 to 42 hours
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRulesModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-soft transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <span>View Rules (1-Tap)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1-Tap Withdrawal Rules Modal Dialog */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  ₹
                </div>
                <div>
                  <h3 className="font-black text-base text-dark">Official Withdrawal Policy</h3>
                  <p className="text-xs text-dark-secondary">Settlement Balance & VIP Payout Schedule</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-2">
                  <span>💰</span>
                  <span>1. Settlement Balance Only</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Only <strong>settlement earnings</strong> (12:00 AM daily plan returns & referral bonuses) can be withdrawn. Deposited funds cannot be withdrawn directly.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                <span className="font-extrabold text-amber-950 text-xs flex items-center gap-2">
                  <span>📅</span>
                  <span>2. VIP Permitted Day Schedule</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Withdrawals can only be requested on your VIP level's designated weekly day. VIP 7 members have priority daily access.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-1.5">
                <span className="font-extrabold text-teal-950 text-xs flex items-center gap-2">
                  <span>⏱️</span>
                  <span>3. 24–42 Hours Release Window</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Approved payouts are released and will reach your bank or UPI <strong>within 24 to 42 hours</strong>. Please remain patient during bank settlement clearing.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Official VIP Platform SLA Terms</span>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close (Got it)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Table Info */}
      <div className="bg-gradient-to-r from-teal-900 to-primary-dark text-white rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold" />
            <h3 className="font-bold text-sm tracking-wide">Weekly VIP Permitted Withdrawal Schedule</h3>
          </div>
          {schedule && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-teal-200">Today: <strong>{schedule.today_day}</strong></span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  schedule.is_eligible_today
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                }`}
              >
                {schedule.is_eligible_today ? "Eligible Today" : `Eligible on ${schedule.permitted_day}`}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
          {[
            { level: "VIP 1", day: "Saturday" },
            { level: "VIP 2", day: "Friday" },
            { level: "VIP 3", day: "Thursday" },
            { level: "VIP 4", day: "Wednesday" },
            { level: "VIP 5", day: "Tuesday" },
            { level: "VIP 6", day: "Monday" },
          ].map((item, idx) => {
            const isMyLevel = schedule?.current_vip_level === idx + 1;
            return (
              <div
                key={item.level}
                className={`p-2.5 rounded-xl border backdrop-blur-md ${
                  isMyLevel
                    ? "bg-white/20 border-gold text-white font-bold ring-1 ring-gold"
                    : "bg-white/5 border-white/10 text-teal-100"
                }`}
              >
                <div className="text-[11px] text-gold font-bold">{item.level}</div>
                <div className="text-xs font-semibold">{item.day}</div>
                {isMyLevel && <div className="text-[9px] uppercase tracking-wider text-emerald-300 mt-0.5">Your Tier</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form and Method Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Withdrawal Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-extrabold text-base text-dark mb-4">
            Request Payout
          </h3>

          {/* Balance Breakdown Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                Withdrawable Settlement Balance
              </span>
              <div className="text-lg font-black text-emerald-700 mt-0.5">
                ₹{(schedule?.withdrawable_settlement_balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Plan returns & commissions</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">
                Deposit Balance
              </span>
              <div className="text-lg font-black text-amber-900 mt-0.5">
                ₹{(schedule?.deposit_balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-amber-700 block mt-0.5">Strictly for plan purchases only</span>
            </div>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-dark-secondary">
                  Withdrawal Amount (₹)
                </label>
                <span className="text-xs text-dark-secondary">
                  Withdrawable: <strong className="text-emerald-700">₹{(schedule?.withdrawable_settlement_balance ?? 0).toLocaleString()}</strong>
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-dark text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={199}
                  max={99999}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder=""
                  className="block w-full pl-8 pr-4 py-2.5 text-sm font-bold text-dark bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                />
              </div>

              {parseFloat(amount) > (schedule?.withdrawable_settlement_balance ?? 0) && (
                <div className="text-[11px] text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Amount exceeds withdrawable settlement balance (₹{(schedule?.withdrawable_settlement_balance ?? 0).toLocaleString()}). Deposited principal cannot be withdrawn.</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-dark-secondary">
                <span>Min: ₹199</span>
                <span>Max per request: ₹99,999</span>
              </div>
            </div>

            {/* Payout Method Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-dark-secondary">
                  Payout Method
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddMethod(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Account</span>
                </button>
              </div>

              {methods.length > 0 ? (
                <div className="space-y-2">
                  {methods.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedMethodId === m.id
                          ? "border-primary bg-primary-mint/20 ring-1 ring-primary/30"
                          : "border-border hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payoutMethod"
                          checked={selectedMethodId === m.id}
                          onChange={() => setSelectedMethodId(m.id)}
                          className="text-primary focus:ring-primary h-4 w-4"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-primary">
                            {m.type === "BANK" ? <Building2 className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-dark">{m.account_holder}</div>
                            <div className="text-[11px] text-dark-secondary font-mono">
                              {m.type === "BANK"
                                ? `${m.bank_name || "Bank"} •••• ${m.account_number?.slice(-4)} (${m.ifsc_code})`
                                : `UPI: ${m.upi_id}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-dark-secondary">
                  <Building2 className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p>No payout methods saved.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddMethod(true)}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold"
                  >
                    + Add Bank Account or UPI
                  </button>
                </div>
              )}
            </div>

            {/* Calculations breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-dark-secondary">
                <span>Requested Amount:</span>
                <span className="font-bold text-dark">₹{(parseFloat(amount) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-dark-secondary">
                <span>Processing Fee ({schedule?.fee_percent || 0}%):</span>
                <span className="font-medium text-dark">₹{fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-dark">
                <span>Net Payable Disbursed:</span>
                <span className="text-emerald-700">₹{net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || methods.length === 0}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-dark hover:opacity-95 shadow-card hover:shadow-card-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Submit Withdrawal Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Security & Policies */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-border shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-dark flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Withdrawal Protection Guarantee</span>
            </h3>

            <div className="space-y-3 text-xs text-dark-secondary leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-dark block">Atomic Fund Reservation</span>
                <p className="text-[11px]">
                  When you submit a withdrawal, funds are locked in your reserved balance immediately to prevent double-spending. If a request is rejected by an administrator, the funds are instantly released back to your available balance.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-dark block">Estimated Settlement Window</span>
                <p className="text-[11px]">
                  Payouts are verified and disbursed via IMPS/NEFT during business banking hours. Upon admin approval, the official banking transaction reference will be visible on your history ledger.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-dark block">Daily Limits & Compliance</span>
                <p className="text-[11px]">
                  Per-transaction limit is capped at ₹99,999. Ensure your bank account name matches your registered verification profile.
                </p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-dark-secondary p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <strong>Need urgent disbursement assistance?</strong> Contact our 24/7 VIP desk through the Settings tab.
          </div>
        </div>
      </div>

      {/* User Withdrawal Requests History */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        <h3 className="font-extrabold text-base text-dark mb-4">
          Your Withdrawal Requests History
        </h3>

        {withdrawals && withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-dark-secondary font-semibold uppercase text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Withdrawal ID</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Payout Method</th>
                  <th className="py-3 px-4">Permitted Day</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bank Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-dark">{w.withdrawal_id}</td>
                    <td className="py-3.5 px-4">₹{w.requested_amount.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-black text-dark">
                      ₹{w.net_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px]">
                        {w.payout_method_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-dark-secondary">{w.permitted_day}</td>
                    <td className="py-3.5 px-4 text-dark-secondary font-mono">{formatDateTime(w.created_at)}</td>
                    <td className="py-3.5 px-4">
                      {w.status === "PAID" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      )}
                      {w.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Processing</span>
                        </span>
                      )}
                      {w.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-dark-secondary">
                      {w.payout_reference || "Pending Disbursal"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-dark-secondary text-xs">
            <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <span>No withdrawal requests on record.</span>
          </div>
        )}
      </div>

      {/* Add Payout Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-dark">Add Payout Method</h3>
              <button
                onClick={() => setShowAddMethod(false)}
                className="text-slate-400 hover:text-dark text-xs p-1"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddPayoutMethod} className="space-y-3">
              {/* Type toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMethodType("BANK")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    methodType === "BANK" ? "bg-white text-primary shadow-sm" : "text-dark-secondary"
                  }`}
                >
                  Bank Account
                </button>
                <button
                  type="button"
                  onClick={() => setMethodType("UPI")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    methodType === "UPI" ? "bg-white text-primary shadow-sm" : "text-dark-secondary"
                  }`}
                >
                  UPI ID (VPA)
                </button>
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Account Holder Full Name</label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              {methodType === "BANK" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-dark mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder=""
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl font-mono uppercase focus:outline-none focus:border-primary"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">UPI Address (VPA)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={addingMethod}
                className="w-full mt-3 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-card"
              >
                {addingMethod ? "Saving..." : "Verify & Save Payout Method"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

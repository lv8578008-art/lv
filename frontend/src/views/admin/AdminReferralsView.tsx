import React, { useState, useEffect } from "react";
import { Network, TrendingUp, Save } from "lucide-react";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";

export const AdminReferralsView: React.FC = () => {
  const { showToast } = useToast();
  const [l1Rate, setL1Rate] = useState("10.0");
  const [l2Rate, setL2Rate] = useState("3.0");
  const [l3Rate, setL3Rate] = useState("1.5");
  const [saving, setSaving] = useState(false);

  const fetchSettings = () => {
    api.getAdminSettings().then((settings) => {
      if (settings.ref_l1_rate) setL1Rate(settings.ref_l1_rate);
      if (settings.ref_l2_rate) setL2Rate(settings.ref_l2_rate);
      if (settings.ref_l3_rate) setL3Rate(settings.ref_l3_rate);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateAdminSettings({
        ref_l1_rate: l1Rate.trim(),
        ref_l2_rate: l2Rate.trim(),
        ref_l3_rate: l3Rate.trim(),
      });
      showToast("3-Tier referral commission rates updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update rates", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-dark">3-Tier Referral Commission Rules</h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Real-Time Feed
          </span>
        </div>
        <p className="text-xs text-dark-secondary mt-1">
          Configure commission percentages disbursed across the partner tree when a downline member activates any VIP tier.
        </p>

        <form onSubmit={handleSaveRates} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-dark uppercase mb-1">
                Level 1 Commission (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={l1Rate}
                onChange={(e) => setL1Rate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold bg-white border border-border rounded-xl focus:outline-none focus:border-primary"
              />
              <span className="text-[10px] text-dark-secondary mt-1 block">Directly invited member</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-dark uppercase mb-1">
                Level 2 Commission (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={l2Rate}
                onChange={(e) => setL2Rate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold bg-white border border-border rounded-xl focus:outline-none focus:border-primary"
              />
              <span className="text-[10px] text-dark-secondary mt-1 block">Invited by Level 1 member</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-dark uppercase mb-1">
                Level 3 Commission (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={l3Rate}
                onChange={(e) => setL3Rate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold bg-white border border-border rounded-xl focus:outline-none focus:border-primary"
              />
              <span className="text-[10px] text-dark-secondary mt-1 block">Invited by Level 2 member</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Commission Rates"}</span>
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-3 text-xs text-dark-secondary">
        <h4 className="font-bold text-dark text-sm">Anti-Fraud & Circular Reference Safeguards</h4>
        <p>
          The referral tree traversal uses visited graph sets to prevent circular loops and self-referrals. Commissions are computed atomically inside the VIP purchase transaction with immutable audit ledger entries.
        </p>
      </div>
    </div>
  );
};

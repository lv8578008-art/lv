import React, { useState, useEffect } from "react";
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  ShieldCheck,
  TrendingUp,
  Network,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";
import { ReferralData } from "../types";
import { useToast } from "../context/ToastContext";

export const ReferralView: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const res = await api.getReferralDashboard();
      setData(res);
    } catch (err: any) {
      showToast(err.message || "Failed to load referral stats", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const handleCopyCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referral_code);
    setCopiedCode(true);
    showToast("Referral code copied to clipboard!", "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.share_link);
    setCopiedLink(true);
    showToast("Referral link copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-32 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Hero Share Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-mint text-primary font-bold text-xs">
              <Gift className="w-3.5 h-3.5 text-gold" />
              <span>3-Tier Partner Affiliate Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
              Invite Members & Earn Lifetime Commissions
            </h1>
            <p className="text-xs sm:text-sm text-dark-secondary max-w-2xl leading-relaxed">
              Earn commissions automatically on every qualifying VIP membership upgrade made by your network members across three referral tiers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            {/* Referral Code Box */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] text-dark-secondary font-bold uppercase block">Your Code</span>
                <span className="font-mono font-extrabold text-sm text-dark tracking-wider">{data.referral_code}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-dark-secondary hover:text-dark transition-colors"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Share Link Button */}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all shadow-card hover:shadow-card-hover"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Tier Rates Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tier 1 */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-dark-secondary">Level 1 (Direct)</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {data.rates.level_1}% Commission
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-dark">{data.direct_referrals_count}</div>
            <p className="text-[11px] text-dark-secondary">Directly invited partners</p>
          </div>
          <div className="text-[11px] text-dark-secondary pt-2 border-t border-slate-100">
            Earns 10% on every VIP plan purchase
          </div>
        </div>

        {/* Tier 2 */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-dark-secondary">Level 2 (Secondary)</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {data.rates.level_2}% Commission
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-dark">{data.level_2_count}</div>
            <p className="text-[11px] text-dark-secondary">Invited by your Level 1 referrals</p>
          </div>
          <div className="text-[11px] text-dark-secondary pt-2 border-t border-slate-100">
            Earns 3% on second-tier activations
          </div>
        </div>

        {/* Tier 3 */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-dark-secondary">Level 3 (Tertiary)</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {data.rates.level_3}% Commission
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-dark">{data.level_3_count}</div>
            <p className="text-[11px] text-dark-secondary">Invited by your Level 2 referrals</p>
          </div>
          <div className="text-[11px] text-dark-secondary pt-2 border-t border-slate-100">
            Earns 1.5% on third-tier activations
          </div>
        </div>
      </div>

      {/* Financial Commission Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
          <span className="text-xs font-semibold text-dark-secondary uppercase block mb-1">
            Total Commission Paid
          </span>
          <div className="text-2xl font-black text-emerald-700">
            ₹{data.approved_commissions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-dark-secondary mt-1 block">Credited straight to available balance</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
          <span className="text-xs font-semibold text-dark-secondary uppercase block mb-1">
            Eligible VIP Transactions
          </span>
          <div className="text-2xl font-black text-dark">
            {data.eligible_transactions_count}
          </div>
          <span className="text-[11px] text-dark-secondary mt-1 block">Across all 3 downline tiers</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
          <span className="text-xs font-semibold text-dark-secondary uppercase block mb-1">
            Total Network Reach
          </span>
          <div className="text-2xl font-black text-primary">
            {data.direct_referrals_count + data.level_2_count + data.level_3_count} Members
          </div>
          <span className="text-[11px] text-dark-secondary mt-1 block">Combined network tree size</span>
        </div>
      </div>

      {/* Detailed Commission History Table */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-dark">Commission History</h3>
            <p className="text-xs text-dark-secondary">Immutable audit records of referral rewards earned</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Instant Balance Credit</span>
          </div>
        </div>

        {data.commissions && data.commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-dark-secondary font-semibold uppercase text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Txn ID</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Purchased By</th>
                  <th className="py-3 px-4">Purchase Volume</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Commission Earned</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {data.commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-dark">{c.txn_id}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-dark font-bold text-[10px]">
                        Level {c.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{c.buyer_account_id}</td>
                    <td className="py-3.5 px-4">₹{c.purchase_amount.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-bold text-primary">{c.rate}%</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">
                      +₹{c.commission_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-dark-secondary font-mono">{c.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-dark-secondary text-xs">
            <Network className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p>No referral commissions recorded yet.</p>
            <p className="mt-1">Share your link with prospective members to start earning 10% on direct VIP signups!</p>
          </div>
        )}
      </div>
    </div>
  );
};

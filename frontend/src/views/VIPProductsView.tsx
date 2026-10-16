import React, { useState, useEffect } from "react";
import { Crown, Calendar, TrendingUp, DollarSign, CheckCircle2, ArrowRight, ShieldCheck, X, RefreshCw, Lock, Package, AlertCircle } from "lucide-react";
import { api } from "../services/api";
import { VIPProduct, VIPProgressData } from "../types";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

interface VIPProductsViewProps {
  onNavigate: (view: string) => void;
  availableBalance: number;
  onRefreshBalance: (bal: number) => void;
}

export const VIPProductsView: React.FC<VIPProductsViewProps> = ({
  onNavigate,
  availableBalance,
  onRefreshBalance,
}) => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<VIPProduct[]>([]);
  const [vipProgress, setVipProgress] = useState<VIPProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<VIPProduct | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [res, prog] = await Promise.all([
        api.getVIPProducts(),
        api.getVIPProgress().catch(() => null),
      ]);
      setProducts(res);
      if (prog) setVipProgress(prog);
    } catch (err: any) {
      showToast(err.message || "Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleBuy = async (prod: VIPProduct) => {
    if (availableBalance < prod.price) {
      showToast(
        `Insufficient balance. Plan price is ₹${prod.price.toLocaleString("en-IN")}, your available balance is ₹${availableBalance.toLocaleString("en-IN")}. Please deposit funds first.`,
        "error"
      );
      setConfirmProduct(null);
      return;
    }

    try {
      setPurchasingId(prod.id);
      const res = await api.purchaseVIP(prod.id);
      showToast(res.message, "success");
      onRefreshBalance(res.remaining_balance);
      await refreshUser();
      await fetchProducts();
      setConfirmProduct(null);
    } catch (err: any) {
      showToast(err.message || "Failed to activate VIP tier.", "error");
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <div className="h-28 rounded-3xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-mint text-primary font-bold text-xs">
            <Crown className="w-3.5 h-3.5 text-gold" />
            <span>Investment Products & Plans</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
            Products & Daily Return Plans
          </h1>
          <p className="text-xs sm:text-sm text-dark-secondary max-w-2xl leading-relaxed">
            Choose your preferred investment plan. Purchasing plans accumulates towards unlocking higher VIP Levels (VIP 0 to VIP 7) for weekly and daily scheduled payouts.
          </p>
        </div>

        {/* Balance Display with Deposit CTA */}
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-50 p-4 rounded-2xl border border-border shrink-0 self-stretch md:self-auto">
          <div>
            <span className="text-[11px] font-semibold text-dark-secondary uppercase block">
              Available Balance
            </span>
            <span className="text-xl font-black text-dark">
              ₹{availableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={() => {
              fetchProducts();
              showToast("Reloaded plans & VIP progress details!", "info");
            }}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition-all cursor-pointer"
            title="Reload fresh plans & VIP progress"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
          <button
            onClick={() => onNavigate("deposit")}
            className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-primary hover:bg-primary-dark transition-colors shadow-soft cursor-pointer"
          >
            + Add Funds
          </button>
        </div>
      </div>

      {/* VIP Level Promotion Task Card */}
      {vipProgress && (
        <div className="bg-gradient-to-r from-teal-900 via-primary to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-card border border-teal-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shadow">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Your Tier: {vipProgress.level_name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    {vipProgress.level_tag}
                  </span>
                </div>
                <p className="text-xs text-teal-200">
                  Total Plan Purchases: <span className="font-bold text-white">₹{vipProgress.total_plan_purchases.toLocaleString("en-IN")}</span>
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-xs">
              <span className="text-teal-200 text-[10px] block uppercase font-bold">Withdrawal Schedule</span>
              <span className="font-bold text-amber-300">{vipProgress.withdrawal_day}</span>
            </div>
          </div>

          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <span>🎯</span>
                <span>{vipProgress.task_prompt}</span>
              </span>
              {vipProgress.next_threshold !== null && (
                <span className="text-teal-200 text-[11px] font-mono">
                  ₹{vipProgress.total_plan_purchases.toLocaleString("en-IN")} / ₹{vipProgress.next_threshold.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {vipProgress.next_threshold !== null && (
              <div className="w-full bg-black/30 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div
                  className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(4, vipProgress.progress_percent))}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Product Plan Rules & Guidelines */}
      <div className="bg-gradient-to-r from-teal-500/10 via-slate-50 to-primary-mint/20 rounded-3xl p-5 sm:p-6 border border-teal-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-primary font-black text-sm">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <span>Official Product Plan Rules & Guidelines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="p-3.5 rounded-2xl bg-white/95 border border-teal-100 space-y-1 shadow-xs">
            <span className="font-extrabold text-teal-950 flex items-center gap-1.5 text-xs">
              <span>🛍️</span>
              <span>1. Balance Allocation</span>
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Plans can be purchased using your <strong>deposited funds or accumulated settlement earnings</strong>. Deposited funds are strictly dedicated to plan purchases.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/95 border border-teal-100 space-y-1 shadow-xs">
            <span className="font-extrabold text-teal-950 flex items-center gap-1.5 text-xs">
              <span>⚡</span>
              <span>2. 12:00 AM Midnight Settlement</span>
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Activated today, your first daily return credits at <strong>12:00 AM tonight</strong>, and continues automatically every night at 12:00 AM (00:00 IST) for the plan duration.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/95 border border-teal-100 space-y-1 shadow-xs">
            <span className="font-extrabold text-teal-950 flex items-center gap-1.5 text-xs">
              <span>💰</span>
              <span>3. 100% Withdrawable Returns</span>
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              All daily returns earned from plans go directly into your <strong>withdrawable settlement balance</strong>, released within 24 to 42 hours on your VIP day!
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-teal-100/60 text-[11px] text-dark-secondary">
          <div className="flex items-center gap-1.5">
            <span>🎯</span>
            <span><strong>VIP Promotion:</strong> Every plan purchase advances your progress to the next VIP tier (VIP 0 to VIP 7).</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🔒</span>
            <span><strong>Member Limit:</strong> Exclusive plans enforce purchase quotas to ensure fair stock availability.</span>
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((prod) => {
          const isCurrentActive =
            user?.active_membership && user.active_membership.level === prod.level;

          const dailyIncome = prod.daily_income ?? 0;
          const totalReturn = prod.total_return ?? (dailyIncome * prod.duration_days);
          const hasImage = Boolean(prod.image_url && prod.image_url.trim() && !prod.image_url.includes("badge"));

          return (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-border transition-all flex flex-col justify-between overflow-hidden shadow-card hover:shadow-card-hover"
            >
              {/* Optional Product Image */}
              {hasImage && (
                <div className="h-44 w-full bg-slate-100 overflow-hidden relative border-b border-border">
                  <img
                    src={prod.image_url.startsWith("http") ? prod.image_url : `http://127.0.0.1:8000${prod.image_url}`}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-black text-xs">
                    {prod.tag || "Popular Plan"}
                  </div>
                </div>
              )}

              {/* Header Info (shown when no banner image) */}
              {!hasImage && (
                <div className="p-5 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                      {prod.tag || "Investment Plan"}
                    </span>
                    <h3 className="text-xl font-black tracking-tight mt-0.5">{prod.name}</h3>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <TrendingUp className="w-5 h-5 text-amber-300" />
                  </div>
                </div>
              )}

              {/* Plan Name & Tag if image is present */}
              {hasImage && (
                <div className="px-5 pt-4 flex items-center justify-between">
                  <h3 className="text-xl font-black text-dark tracking-tight">{prod.name}</h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-primary border border-teal-200">
                    {prod.tag || "Active"}
                  </span>
                </div>
              )}

              {/* Exact Configured Details (Only Admin Configured Details) */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  {/* Price */}
                  <div>
                    <span className="text-[10px] text-dark-secondary block font-bold uppercase tracking-wider">
                      Plan Price
                    </span>
                    <div className="text-xl font-black text-dark">
                      ₹{prod.price.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Daily Income */}
                  <div>
                    <span className="text-[10px] text-dark-secondary block font-bold uppercase tracking-wider">
                      Daily Income
                    </span>
                    <div className="text-xl font-black text-emerald-700">
                      ₹{dailyIncome.toLocaleString("en-IN")}
                    </div>
                    <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
                      Adds at 12:00 AM (Midnight)
                    </span>
                  </div>

                  {/* Total Return Amount */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-dark-secondary block font-bold uppercase tracking-wider">
                      Total Return
                    </span>
                    <div className="text-xl font-black text-primary">
                      ₹{totalReturn.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-dark-secondary block font-bold uppercase tracking-wider">
                      Duration
                    </span>
                    <div className="text-base font-black text-dark flex items-center gap-1 mt-0.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{prod.duration_days} Days</span>
                    </div>
                  </div>
                </div>

                {/* Requirements & Stock Information */}
                <div className="space-y-1.5 py-1 border-t border-slate-100 text-[11px]">
                  {/* VIP Level Restriction */}
                  {prod.min_vip_level !== undefined && prod.min_vip_level > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-dark-secondary flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>VIP Level Req:</span>
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        (user?.vip_level ?? 0) >= prod.min_vip_level
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      }`}>
                        {(user?.vip_level ?? 0) >= prod.min_vip_level
                          ? `VIP ${prod.min_vip_level}+ (Unlocked)`
                          : `VIP ${prod.min_vip_level}+ Required`}
                      </span>
                    </div>
                  )}

                  {/* Buy Limit per User */}
                  {prod.purchase_limit !== undefined && prod.purchase_limit > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-dark-secondary">Purchase Limit:</span>
                      <span className="font-semibold text-dark">
                        Max {prod.purchase_limit} / member {prod.user_purchased_count ? `(${prod.user_purchased_count} bought)` : ""}
                      </span>
                    </div>
                  )}

                  {/* Total Stock */}
                  {prod.total_stock !== undefined && prod.total_stock > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-dark-secondary flex items-center gap-1">
                        <Package className="w-3 h-3 text-teal-600" />
                        <span>Stock Available:</span>
                      </span>
                      <span className={`font-bold ${
                        (prod.remaining_stock ?? 0) === 0 ? "text-rose-600" : "text-emerald-700"
                      }`}>
                        {(prod.remaining_stock ?? 0) === 0
                          ? "Sold Out"
                          : `${prod.remaining_stock ?? Math.max(0, prod.total_stock - (prod.sold_count || 0))} units left`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Purchase Button */}
                <div className="pt-1">
                  {isCurrentActive ? (
                    <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Current Active Membership</span>
                    </div>
                  ) : prod.can_buy === false ? (
                    <div className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>{prod.buy_disabled_reason || "Not Eligible to Buy"}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmProduct(prod)}
                      disabled={purchasingId === prod.id}
                      className="w-full py-3.5 px-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-primary to-primary-dark hover:opacity-95 shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {purchasingId === prod.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Activate Plan (₹{prod.price.toLocaleString("en-IN")})</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-black text-base text-dark">Confirm VIP Activation</h3>
              <button
                onClick={() => setConfirmProduct(null)}
                className="text-slate-400 hover:text-dark cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-dark-secondary">Selected Plan:</span>
                  <span className="text-dark">VIP {confirmProduct.level} ({confirmProduct.name})</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-dark-secondary">Price:</span>
                  <span className="text-dark">₹{confirmProduct.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-dark-secondary">Daily Income:</span>
                  <span className="text-emerald-700">₹{(confirmProduct.daily_income ?? 0).toLocaleString("en-IN")}/day</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-dark-secondary">Total Return:</span>
                  <span className="text-primary">₹{(confirmProduct.total_return ?? ((confirmProduct.daily_income ?? 0) * confirmProduct.duration_days)).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-dark-secondary">Validity:</span>
                  <span className="text-dark">{confirmProduct.duration_days} Days</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] font-semibold flex items-start gap-2.5">
                <span className="text-base leading-none">⚡</span>
                <div>
                  <span className="font-extrabold block text-amber-950">12:00 AM Midnight Settlement Rule:</span>
                  <span>Activated today, your first daily return of <strong>₹{(confirmProduct.daily_income ?? 0).toLocaleString("en-IN")}</strong> will automatically add to your account at 12:00 AM tonight (and every night at 12:00 AM for {confirmProduct.duration_days} days).</span>
                </div>
              </div>

              <p className="text-[11px] text-dark-secondary text-center">
                ₹{confirmProduct.price.toLocaleString("en-IN")} will be deducted from your available balance.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmProduct(null)}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBuy(confirmProduct)}
                disabled={purchasingId !== null}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-dark cursor-pointer shadow-soft"
              >
                {purchasingId === confirmProduct.id ? "Processing..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

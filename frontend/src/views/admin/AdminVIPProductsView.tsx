import React, { useState, useEffect } from "react";
import { Crown, Edit3, Plus, X, UploadCloud, Image as ImageIcon, Trash2, Award, Sliders, Save, Layers, CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "../../services/api";
import { VIPProduct } from "../../types";
import { useToast } from "../../context/ToastContext";

export const AdminVIPProductsView: React.FC = () => {
  const { showToast } = useToast();
  const [adminTab, setAdminTab] = useState<"plans" | "tiers">("plans");
  const [products, setProducts] = useState<VIPProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // VIP Levels & Thresholds State
  const [vipLevels, setVipLevels] = useState<any[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [savingLevels, setSavingLevels] = useState(false);

  // Edit modal
  const [editProd, setEditProd] = useState<VIPProduct | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDailyIncome, setEditDailyIncome] = useState("");
  const [editTotalReturn, setEditTotalReturn] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editDailyBenefit, setEditDailyBenefit] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editMinVIP, setEditMinVIP] = useState<number>(0);
  const [editPurchaseLimit, setEditPurchaseLimit] = useState<string>("0");
  const [editTotalStock, setEditTotalStock] = useState<string>("0");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLevel, setNewLevel] = useState<number>(7);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [newDailyIncome, setNewDailyIncome] = useState("");
  const [newTotalReturn, setNewTotalReturn] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newActive, setNewActive] = useState(true);
  const [newMinVIP, setNewMinVIP] = useState<number>(0);
  const [newPurchaseLimit, setNewPurchaseLimit] = useState<string>("0");
  const [newTotalStock, setNewTotalStock] = useState<string>("0");
  const [creating, setCreating] = useState(false);

  const fetchProducts = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getVIPProducts();
      setProducts(res);
    } catch (err: any) {
      if (!isBackground) {
        showToast(err.message || "Failed to load products", "error");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const fetchVIPLevels = async (isBackground = false) => {
    try {
      if (!isBackground) setLoadingLevels(true);
      const res = await api.getAdminVIPLevels();
      setVipLevels(res);
    } catch (err: any) {
      if (!isBackground) {
        showToast(err.message || "Failed to load VIP levels", "error");
      }
    } finally {
      if (!isBackground) setLoadingLevels(false);
    }
  };

  useEffect(() => {
    fetchProducts(false);
    fetchVIPLevels(false);
    const interval = setInterval(() => {
      fetchProducts(true);
      fetchVIPLevels(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenEdit = (p: VIPProduct) => {
    setEditProd(p);
    setEditPrice(p.price.toString());
    setEditDuration(p.duration_days.toString());
    const daily = p.daily_income ?? 0;
    const total = p.total_return ?? (daily * p.duration_days);
    setEditDailyIncome(daily ? daily.toString() : "");
    setEditTotalReturn(total ? total.toString() : "");
    setEditImageUrl(p.image_url || "");
    setEditDailyBenefit(p.daily_benefit_desc || `₹${daily} Daily Income`);
    setEditActive(p.is_active);
    setEditMinVIP(p.min_vip_level ?? 0);
    setEditPurchaseLimit((p.purchase_limit ?? 0).toString());
    setEditTotalStock((p.total_stock ?? 0).toString());
  };

  const handleOpenCreate = () => {
    const maxLvl = products.reduce((max, p) => (p.level > max ? p.level : max), 0);
    const nextLvl = maxLvl + 1;
    setNewLevel(nextLvl);
    setNewName(`Plan Tier ${nextLvl}`);
    setNewPrice("");
    setNewDuration("30");
    setNewDailyIncome("");
    setNewTotalReturn("");
    setNewImageUrl("");
    setNewActive(true);
    setNewMinVIP(0);
    setNewPurchaseLimit("0");
    setNewTotalStock("0");
    setIsCreateOpen(true);
  };

  // Edit modal calculation handlers
  const handleDailyIncomeChange = (val: string) => {
    setEditDailyIncome(val);
    const d = parseFloat(val);
    const days = parseInt(editDuration);
    if (!isNaN(d) && !isNaN(days) && days > 0) {
      setEditTotalReturn((d * days).toString());
      setEditDailyBenefit(`₹${d} Daily Income`);
    }
  };

  const handleDurationChange = (val: string) => {
    setEditDuration(val);
    const days = parseInt(val);
    const d = parseFloat(editDailyIncome);
    if (!isNaN(d) && !isNaN(days) && days > 0) {
      setEditTotalReturn((d * days).toString());
    }
  };

  // Create modal calculation handlers
  const handleNewDailyIncomeChange = (val: string) => {
    setNewDailyIncome(val);
    const d = parseFloat(val);
    const days = parseInt(newDuration);
    if (!isNaN(d) && !isNaN(days) && days > 0) {
      setNewTotalReturn((d * days).toString());
    }
  };

  const handleNewDurationChange = (val: string) => {
    setNewDuration(val);
    const days = parseInt(val);
    const d = parseFloat(newDailyIncome);
    if (!isNaN(d) && !isNaN(days) && days > 0) {
      setNewTotalReturn((d * days).toString());
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCreate = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setUploadingImage(true);
        const res = await api.uploadScreenshot(file);
        if (isCreate) {
          setNewImageUrl(res.url);
        } else {
          setEditImageUrl(res.url);
        }
        showToast("Image uploaded successfully!", "success");
      } catch (err: any) {
        showToast(err.message || "Failed to upload image", "error");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProd) return;
    try {
      setSaving(true);
      const parsedPrice = parseFloat(editPrice) || 0;
      const parsedDuration = parseInt(editDuration) || 0;
      const parsedDailyIncome = parseFloat(editDailyIncome) || 0;
      const parsedTotalReturn = parseFloat(editTotalReturn) || (parsedDailyIncome * parsedDuration);

      await api.updateVIPProduct(editProd.id, {
        price: parsedPrice,
        duration_days: parsedDuration,
        daily_income: parsedDailyIncome,
        total_return: parsedTotalReturn,
        image_url: editImageUrl.trim(),
        daily_benefit_desc: editDailyBenefit.trim() || `₹${parsedDailyIncome} Daily Income`,
        is_active: editActive,
        min_vip_level: editMinVIP,
        purchase_limit: Math.max(0, parseInt(editPurchaseLimit) || 0),
        total_stock: Math.max(0, parseInt(editTotalStock) || 0),
      });

      showToast(`Plan "${editProd.name}" updated successfully!`, "success");
      setEditProd(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to update product", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showToast("Please enter a valid plan price.", "error");
      return;
    }
    const parsedDuration = parseInt(newDuration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      showToast("Please enter valid duration in days.", "error");
      return;
    }
    const parsedDailyIncome = parseFloat(newDailyIncome) || 0;
    const parsedTotalReturn = parseFloat(newTotalReturn) || (parsedDailyIncome * parsedDuration);

    try {
      setCreating(true);
      await api.createVIPProduct({
        level: newLevel,
        name: newName.trim() || `VIP ${newLevel}`,
        price: parsedPrice,
        duration_days: parsedDuration,
        daily_income: parsedDailyIncome,
        total_return: parsedTotalReturn,
        image_url: newImageUrl.trim(),
        daily_benefit_desc: `₹${parsedDailyIncome} Daily Income`,
        is_active: newActive,
        min_vip_level: newMinVIP,
        purchase_limit: Math.max(0, parseInt(newPurchaseLimit) || 0),
        total_stock: Math.max(0, parseInt(newTotalStock) || 0),
      });

      showToast(`New plan "${newName.trim() || `VIP ${newLevel}`}" created successfully!`, "success");
      setIsCreateOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to create new plan.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProduct = async (prod: VIPProduct) => {
    if (!window.confirm(`Are you sure you want to delete plan "${prod.name}"?`)) {
      return;
    }
    try {
      await api.deleteVIPProduct(prod.id);
      showToast(`Plan "${prod.name}" deleted successfully.`, "success");
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to delete plan", "error");
    }
  };

  const handleLevelChange = (index: number, field: string, value: any) => {
    const updated = [...vipLevels];
    updated[index] = { ...updated[index], [field]: value };
    // If threshold changed, auto-sync next_threshold for previous tier
    if (field === "threshold" && index > 0) {
      const prevVal = parseFloat(value) || 0;
      updated[index - 1] = {
        ...updated[index - 1],
        next_threshold: prevVal,
        task_desc: `Reach ₹${prevVal.toLocaleString("en-IN")} in plan purchases to unlock ${updated[index].name}`
      };
    }
    setVipLevels(updated);
  };

  const handleSaveVIPLevels = async () => {
    try {
      setSavingLevels(true);
      const res = await api.updateAdminVIPLevels(vipLevels);
      showToast(res.message, "success");
      setVipLevels(res.levels);
    } catch (err: any) {
      showToast(err.message || "Failed to save VIP levels", "error");
    } finally {
      setSavingLevels(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-dark">Products & VIP Tier Configuration</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time Feed (Auto-sync 10s)
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-0.5">
            Manage product investment plans and configure the spend thresholds for each VIP level (VIP 0 to VIP 7).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              fetchProducts();
              fetchVIPLevels();
              showToast("Reloaded all product & VIP details!", "info");
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            title="Reload fresh details from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading || loadingLevels ? "animate-spin text-primary" : ""}`} />
            <span>Reload Details</span>
          </button>

          {adminTab === "plans" && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-dark transition-all flex items-center gap-1.5 shadow-soft cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setAdminTab("plans")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === "plans"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-dark-secondary hover:text-dark border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Investment Plans ({products.length})</span>
        </button>

        <button
          onClick={() => setAdminTab("tiers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === "tiers"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-dark-secondary hover:text-dark border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>VIP Levels & Spend Thresholds (0 to 7)</span>
        </button>
      </div>

      {/* TAB 1: INVESTMENT PLANS GRID */}
      {adminTab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const displayDaily = p.daily_income ?? 0;
          const displayTotal = p.total_return ?? (displayDaily * p.duration_days);

          return (
            <div key={p.id} className="bg-white rounded-2xl border border-border p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {p.image_url && !p.image_url.includes("badge") && (p.image_url.startsWith("http") || p.image_url.startsWith("/")) ? (
                    <img
                      src={p.image_url.startsWith("http") ? p.image_url : `http://127.0.0.1:8000${p.image_url}`}
                      alt={p.name}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-primary flex items-center justify-center font-bold text-xs border border-teal-100">
                      V{p.level}
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-sm text-dark">{p.name}</h4>
                    <span className="text-[10px] text-dark-secondary font-semibold">{p.tag || "Plan"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-primary text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p)}
                    className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs transition-colors cursor-pointer"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-dark-secondary">Plan Price:</span>
                  <span className="font-bold text-dark">₹{p.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-secondary">Duration:</span>
                  <span className="font-semibold text-dark">{p.duration_days} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-secondary">Daily Income:</span>
                  <span className="font-bold text-emerald-700">₹{displayDaily.toLocaleString("en-IN")} / Day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-secondary">Total Return:</span>
                  <span className="font-black text-primary">₹{displayTotal.toLocaleString("en-IN")}</span>
                </div>

                {/* VIP Level Requirement & Stock Info */}
                <div className="flex justify-between items-center py-0.5 border-t border-slate-100">
                  <span className="text-dark-secondary">Allowed VIP:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    p.min_vip_level && p.min_vip_level > 0
                      ? "bg-amber-100 text-amber-900 font-extrabold"
                      : "bg-teal-50 text-teal-800"
                  }`}>
                    {p.min_vip_level && p.min_vip_level > 0 ? `VIP ${p.min_vip_level}+ Only` : "VIP 0+ (All Members)"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-dark-secondary">Member Limit:</span>
                  <span className="font-semibold text-dark">
                    {p.purchase_limit && p.purchase_limit > 0 ? `Max ${p.purchase_limit} / member` : "Unlimited buys"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-dark-secondary">Available Stock:</span>
                  <span className={`font-semibold ${
                    p.total_stock && p.total_stock > 0
                      ? (Math.max(0, p.total_stock - (p.sold_count || 0)) === 0 ? "text-rose-600 font-bold" : "text-emerald-700 font-bold")
                      : "text-slate-600"
                  }`}>
                    {p.total_stock && p.total_stock > 0
                      ? `${Math.max(0, p.total_stock - (p.sold_count || 0))} / ${p.total_stock} left (${p.sold_count || 0} sold)`
                      : "Unlimited Stock"}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-dark-secondary">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.is_active ? "PUBLISHED" : "DISABLED"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* TAB 2: VIP LEVELS & SPEND THRESHOLDS EDITOR */}
      {adminTab === "tiers" && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-extrabold text-sm block">VIP Level Progression Rules</span>
                <p className="text-amber-800 text-xs">
                  Members unlock higher VIP levels by reaching cumulative plan purchase milestones. Edit spend thresholds and permitted withdrawal schedules below.
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveVIPLevels}
              disabled={savingLevels}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-black transition-all shadow-soft flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{savingLevels ? "Saving Changes..." : "Save All VIP Rules"}</span>
            </button>
          </div>

          {loadingLevels ? (
            <div className="bg-white p-8 rounded-2xl text-center text-xs text-dark-secondary">
              Loading VIP tiers configuration...
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-dark-secondary font-bold uppercase tracking-wider text-[11px] border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Tier Name</th>
                      <th className="py-3 px-4">Badge Tag</th>
                      <th className="py-3 px-4">Required Plan Spend (₹)</th>
                      <th className="py-3 px-4">Next Goal Milestone</th>
                      <th className="py-3 px-4">Withdrawal Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {vipLevels.map((lvl, idx) => (
                      <tr key={lvl.level} className="hover:bg-slate-50 transition-colors">
                        {/* Level badge */}
                        <td className="py-3.5 px-4 font-black">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold shadow-sm">
                            V{lvl.level}
                          </span>
                        </td>

                        {/* Tier Name */}
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={lvl.name}
                            onChange={(e) => handleLevelChange(idx, "name", e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-dark w-28 focus:border-primary focus:outline-none"
                          />
                        </td>

                        {/* Badge Tag */}
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={lvl.tag}
                            onChange={(e) => handleLevelChange(idx, "tag", e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 w-36 focus:border-primary focus:outline-none"
                          />
                        </td>

                        {/* Spend Threshold */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              step="any"
                              value={lvl.threshold}
                              onChange={(e) => handleLevelChange(idx, "threshold", parseFloat(e.target.value) || 0)}
                              className="px-2.5 py-1.5 rounded-xl border border-primary/30 bg-primary/5 text-xs font-black text-primary w-32 focus:border-primary focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Next Milestone */}
                        <td className="py-3.5 px-4 text-xs">
                          {lvl.next_threshold !== null && lvl.next_threshold !== undefined ? (
                            <div>
                              <span className="font-bold text-emerald-700">₹{Number(lvl.next_threshold).toLocaleString("en-IN")}</span>
                              <span className="text-[10px] text-slate-400 block">Promotes to VIP {lvl.next_level}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Top Max Tier
                            </span>
                          )}
                        </td>

                        {/* Permitted Withdrawal Day */}
                        <td className="py-3.5 px-4">
                          <select
                            value={lvl.withdrawal_day}
                            onChange={(e) => handleLevelChange(idx, "withdrawal_day", e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer focus:border-primary focus:outline-none"
                          >
                            <option value="Sunday">Sunday</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Daily Priority">Daily Priority</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Save Action */}
              <div className="p-4 bg-slate-50 border-t border-border flex items-center justify-between">
                <span className="text-xs text-dark-secondary">
                  Changes take effect immediately across member dashboards, withdrawal validation, and purchase milestone promotions.
                </span>
                <button
                  onClick={handleSaveVIPLevels}
                  disabled={savingLevels}
                  className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-all shadow-soft flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingLevels ? "Saving..." : "Save VIP Rules"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW PLAN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-black text-base text-dark">Post New Product Plan</h3>
                <span className="text-[11px] text-dark-secondary">Publish an investment plan for members to purchase</span>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-dark cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              {/* Image Input & Upload */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  {newImageUrl ? (
                    <img
                      src={newImageUrl.startsWith("http") ? newImageUrl : `http://127.0.0.1:8000${newImageUrl}`}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Image URL or upload below"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-mono"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-primary cursor-pointer">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, true)}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Plan Name */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Plan Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Starter Plan, Daily Wealth Booster"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold"
                  required
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="250000"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => handleNewDurationChange(e.target.value)}
                    placeholder="30"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              {/* Daily Income */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Daily Income (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={newDailyIncome}
                  onChange={(e) => handleNewDailyIncomeChange(e.target.value)}
                  placeholder="20000"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold text-emerald-700"
                />
              </div>

              {/* Total Return Amount */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Total Return Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={newTotalReturn}
                  onChange={(e) => setNewTotalReturn(e.target.value)}
                  placeholder="600000"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-black text-primary"
                />
                <span className="text-[10px] text-dark-secondary block mt-0.5">
                  Calculated revenue: Daily Income × Duration
                </span>
              </div>

              {/* Required VIP Level Restriction */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1 flex items-center justify-between">
                  <span>Allowed VIP Level (Who can buy?)</span>
                  <span className="text-[10px] text-amber-600 font-bold">Tier Restriction</span>
                </label>
                <select
                  value={newMinVIP}
                  onChange={(e) => setNewMinVIP(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold text-dark cursor-pointer"
                >
                  <option value={0}>VIP 0 & Above (Open to All Members)</option>
                  <option value={1}>VIP 1 & Above (Requires VIP 1+)</option>
                  <option value={2}>VIP 2 & Above (Requires VIP 2+)</option>
                  <option value={3}>VIP 3 & Above (Requires VIP 3+)</option>
                  <option value={4}>VIP 4 & Above (Requires VIP 4+)</option>
                  <option value={5}>VIP 5 & Above (Requires VIP 5+)</option>
                  <option value={6}>VIP 6 & Above (Requires VIP 6+)</option>
                  <option value={7}>VIP 7 Only (Elite Exclusive Tier)</option>
                </select>
                <span className="text-[10px] text-dark-secondary block mt-0.5">
                  Only members whose account level is at or above this VIP tier can buy this plan.
                </span>
              </div>

              {/* Purchase Limit & Total Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">
                    Buy Limit per Member
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPurchaseLimit}
                    onChange={(e) => setNewPurchaseLimit(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold text-dark"
                  />
                  <span className="text-[10px] text-dark-secondary block mt-0.5">
                    0 = Unlimited buys
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">
                    Total Limited Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newTotalStock}
                    onChange={(e) => setNewTotalStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold text-dark"
                  />
                  <span className="text-[10px] text-dark-secondary block mt-0.5">
                    0 = Unlimited stock
                  </span>
                </div>
              </div>

              {/* Published checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newActiveCheck"
                  checked={newActive}
                  onChange={(e) => setNewActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <label htmlFor="newActiveCheck" className="text-xs font-semibold text-dark cursor-pointer">
                  Published and available for purchase
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark cursor-pointer disabled:opacity-50"
                >
                  {creating ? "Posting..." : "Post Plan Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editProd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-dark">
                Edit VIP {editProd.level} ({editProd.name})
              </h3>
              <button onClick={() => setEditProd(null)} className="text-slate-400 hover:text-dark cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Image Input & Preview */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  {editImageUrl ? (
                    <img
                      src={editImageUrl.startsWith("http") ? editImageUrl : `http://127.0.0.1:8000${editImageUrl}`}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Image URL or upload below"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-mono"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-primary cursor-pointer">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, false)}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="500"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={editDuration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  placeholder="30"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold"
                />
              </div>

              {/* Daily Income */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Daily Income (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={editDailyIncome}
                  onChange={(e) => handleDailyIncomeChange(e.target.value)}
                  placeholder="25"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold text-emerald-700"
                />
              </div>

              {/* Total Return Amount */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Total Return Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={editTotalReturn}
                  onChange={(e) => setEditTotalReturn(e.target.value)}
                  placeholder="750"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-black text-primary"
                />
                <span className="text-[10px] text-dark-secondary block mt-0.5">
                  Calculated revenue: Daily Income × Duration (or custom amount)
                </span>
              </div>

              {/* Required VIP Level Restriction */}
              <div>
                <label className="block text-xs font-semibold text-dark mb-1 flex items-center justify-between">
                  <span>Allowed VIP Level (Who can buy?)</span>
                  <span className="text-[10px] text-amber-600 font-bold">Tier Restriction</span>
                </label>
                <select
                  value={editMinVIP}
                  onChange={(e) => setEditMinVIP(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold text-dark cursor-pointer"
                >
                  <option value={0}>VIP 0 & Above (Open to All Members)</option>
                  <option value={1}>VIP 1 & Above (Requires VIP 1+)</option>
                  <option value={2}>VIP 2 & Above (Requires VIP 2+)</option>
                  <option value={3}>VIP 3 & Above (Requires VIP 3+)</option>
                  <option value={4}>VIP 4 & Above (Requires VIP 4+)</option>
                  <option value={5}>VIP 5 & Above (Requires VIP 5+)</option>
                  <option value={6}>VIP 6 & Above (Requires VIP 6+)</option>
                  <option value={7}>VIP 7 Only (Elite Exclusive Tier)</option>
                </select>
                <span className="text-[10px] text-dark-secondary block mt-0.5">
                  Only members whose account level is at or above this VIP tier can buy this plan.
                </span>
              </div>

              {/* Purchase Limit & Total Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">
                    Buy Limit per Member
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editPurchaseLimit}
                    onChange={(e) => setEditPurchaseLimit(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold text-dark"
                  />
                  <span className="text-[10px] text-dark-secondary block mt-0.5">
                    0 = Unlimited buys
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">
                    Total Limited Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editTotalStock}
                    onChange={(e) => setEditTotalStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-bold text-dark"
                  />
                  <span className="text-[10px] text-dark-secondary block mt-0.5">
                    0 = Unlimited stock
                  </span>
                </div>
              </div>

              {/* Published checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <label htmlFor="activeCheck" className="text-xs font-semibold text-dark cursor-pointer">
                  Published and available for purchase
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditProd(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

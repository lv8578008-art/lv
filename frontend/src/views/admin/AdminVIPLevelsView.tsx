import React, { useState, useEffect } from "react";
import { Award, Save, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, Calendar, ChevronRight } from "lucide-react";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";

export const AdminVIPLevelsView: React.FC = () => {
  const { showToast } = useToast();
  const [vipLevels, setVipLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchVIPLevels = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminVIPLevels();
      setVipLevels(res);
    } catch (err: any) {
      showToast(err.message || "Failed to load VIP levels", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVIPLevels();
  }, []);

  const handleLevelChange = (index: number, field: string, value: any) => {
    const updated = [...vipLevels];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-update milestone target for previous tier
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.updateAdminVIPLevels(vipLevels);
      showToast(res.message || "VIP Level rules saved successfully!", "success");
      setVipLevels(res.levels);
    } catch (err: any) {
      showToast(err.message || "Failed to save VIP levels", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyDefaults = () => {
    const defaults = [
      { level: 0, name: "VIP 0", tag: "Entry Member", threshold: 0, withdrawal_day: "Sunday" },
      { level: 1, name: "VIP 1", tag: "Bronze Member", threshold: 2000, withdrawal_day: "Saturday" },
      { level: 2, name: "VIP 2", tag: "Silver Member", threshold: 4000, withdrawal_day: "Friday" },
      { level: 3, name: "VIP 3", tag: "Gold Member", threshold: 6000, withdrawal_day: "Thursday" },
      { level: 4, name: "VIP 4", tag: "Platinum Member", threshold: 8000, withdrawal_day: "Wednesday" },
      { level: 5, name: "VIP 5", tag: "Diamond Member", threshold: 10000, withdrawal_day: "Tuesday" },
      { level: 6, name: "VIP 6", tag: "Crown Member", threshold: 12000, withdrawal_day: "Monday" },
      { level: 7, name: "VIP 7", tag: "Elite Member", threshold: 14000, withdrawal_day: "Daily Priority" },
    ];
    setVipLevels(defaults);
    showToast("Loaded standard VIP thresholds (VIP 0: ₹0, VIP 1: ₹2,000, VIP 2: ₹4,000, up to VIP 7: ₹14,000). Click 'Save VIP Rules' to apply.", "info");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>VIP Progression & Promotion Rules</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-dark tracking-tight">
            VIP Levels & Spend Thresholds (VIP 0 to VIP 7)
          </h2>
          <p className="text-xs sm:text-sm text-dark-secondary max-w-2xl leading-relaxed">
            Configure the required plan purchase amount for each VIP tier. When a customer reaches the target plan spend, their account automatically unlocks the next VIP level, milestone badges, and scheduled withdrawal days.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => {
              fetchVIPLevels();
              showToast("Reloaded VIP levels details!", "info");
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            title="Reload fresh details from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Reload Details</span>
          </button>

          <button
            onClick={handleApplyDefaults}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            title="Load standard 2000-rupees step rules"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Standard Step Rule</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black transition-all shadow-soft flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save VIP Rules"}</span>
          </button>
        </div>
      </div>

      {/* Info Callout */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-teal-500/10 border border-amber-200/70 p-4 rounded-2xl flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-1">
          <span className="font-extrabold text-slate-900 block">
            How VIP Promotion Works:
          </span>
          <p className="text-slate-700 leading-relaxed">
            Every user begins at <span className="font-bold text-dark">VIP 0</span>. When they buy plans totaling <span className="font-bold text-dark">₹2,000</span>, they automatically promote to <span className="font-bold text-dark">VIP 1</span>. At <span className="font-bold text-dark">₹4,000</span> they reach <span className="font-bold text-dark">VIP 2</span>, <span className="font-bold text-dark">₹6,000</span> for <span className="font-bold text-dark">VIP 3</span>, up to <span className="font-bold text-dark">₹14,000</span> for <span className="font-bold text-dark">VIP 7 Elite</span>. You can customize the exact amounts and withdrawal days below.
          </p>
        </div>
      </div>

      {/* Editable Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-border text-center text-xs text-dark-secondary">
          Loading VIP levels configuration...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-dark-secondary font-bold uppercase tracking-wider text-[11px] border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Level</th>
                  <th className="py-3.5 px-4">Tier Name</th>
                  <th className="py-3.5 px-4">Badge Title</th>
                  <th className="py-3.5 px-4">Required Plan Spend (₹)</th>
                  <th className="py-3.5 px-4">Next Promotion Goal</th>
                  <th className="py-3.5 px-4">Withdrawal Schedule</th>
                  <th className="py-3.5 px-4">Task Prompt Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {vipLevels.map((lvl, idx) => {
                  const hasNext = lvl.next_threshold !== null && lvl.next_threshold !== undefined;

                  return (
                    <tr key={lvl.level} className="hover:bg-slate-50/70 transition-colors">
                      {/* Level Badge */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs shadow-sm">
                            V{lvl.level}
                          </span>
                        </div>
                      </td>

                      {/* Tier Name */}
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          value={lvl.name}
                          onChange={(e) => handleLevelChange(idx, "name", e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-dark w-28 focus:border-primary focus:outline-none"
                        />
                      </td>

                      {/* Badge Title */}
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          value={lvl.tag}
                          onChange={(e) => handleLevelChange(idx, "tag", e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 w-36 focus:border-primary focus:outline-none"
                        />
                      </td>

                      {/* Required Plan Spend */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            step="any"
                            value={lvl.threshold}
                            onChange={(e) => handleLevelChange(idx, "threshold", parseFloat(e.target.value) || 0)}
                            className="px-3 py-1.5 rounded-xl border border-primary/40 bg-primary/5 text-xs font-black text-primary w-32 focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Next Goal */}
                      <td className="py-4 px-4">
                        {hasNext ? (
                          <div>
                            <span className="font-black text-emerald-700">₹{Number(lvl.next_threshold).toLocaleString("en-IN")}</span>
                            <span className="text-[10px] text-slate-400 block font-semibold">Unlocks VIP {lvl.next_level}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Highest Tier
                          </span>
                        )}
                      </td>

                      {/* Withdrawal Schedule */}
                      <td className="py-4 px-4">
                        <select
                          value={lvl.withdrawal_day}
                          onChange={(e) => handleLevelChange(idx, "withdrawal_day", e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer focus:border-primary focus:outline-none"
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

                      {/* Task Prompt Preview */}
                      <td className="py-4 px-4 text-xs text-slate-600 max-w-xs">
                        <span className="truncate block font-medium" title={lvl.task_desc}>
                          {lvl.task_desc || (hasNext ? `Reach ₹${Number(lvl.next_threshold).toLocaleString("en-IN")} in plans` : "Top tier active")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Save Bar */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-dark-secondary">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Threshold edits immediately update member dashboards and automatic VIP level promotions.</span>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-xs transition-all shadow-soft flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save VIP Rules"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

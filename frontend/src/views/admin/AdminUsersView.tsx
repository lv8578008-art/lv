import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { formatDateTime } from "../../utils/date";

export const AdminUsersView: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getAdminUsers(search, statusFilter);
      setUsers(res);
    } catch (err: any) {
      if (!isBackground) {
        showToast(err.message || "Failed to load users", "error");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(false);
    const interval = setInterval(() => {
      fetchUsers(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(false);
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const res = await api.toggleUserStatus(user.id);
      showToast(res.message, "success");
      fetchUsers(false);
    } catch (err: any) {
      showToast(err.message || "Failed to toggle status", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-dark">User Account Management</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time Feed (Auto-sync 10s)
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-0.5">
            Inspect authentic customer ledger balances, VIP tier passes, and manage account statuses.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=""
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary font-semibold"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-dark-secondary uppercase text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Account ID</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4">VIP Tier</th>
                  <th className="py-3 px-4">Plan Purchases</th>
                  <th className="py-3 px-4">Available Balance</th>
                  <th className="py-3 px-4">Locked / Reserved</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-dark">{u.account_id}</td>
                    <td className="py-3.5 px-4">+91 {u.mobile}</td>
                    <td className="py-3.5 px-4 font-mono text-primary font-bold">{u.referral_code}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.vip_level ?? 0}
                        onChange={async (e) => {
                          const newLvl = parseInt(e.target.value);
                          try {
                            await api.setUserVIPLevel(u.id, newLvl);
                            showToast(`User ${u.account_id} set to VIP Level ${newLvl}`, "success");
                            fetchUsers();
                          } catch (err: any) {
                            showToast(err.message || "Failed to update VIP Level", "error");
                          }
                        }}
                        className="px-2 py-1 rounded-lg text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 cursor-pointer shadow-sm hover:bg-amber-100 transition-colors"
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            VIP {lvl}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary">
                      ₹{(u.total_plan_purchases ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">
                      ₹{u.available_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-dark-secondary">
                      ₹{u.reserved_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{formatDateTime(u.created_at)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                          }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${u.status === "active"
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          }`}
                      >
                        {u.status === "active" ? "Suspend Account" : "Activate Account"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-dark-secondary">
            No users match search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

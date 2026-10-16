import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  KeyRound,
  ShieldCheck,
  Building2,
  FileText,
  MessageSquare,
  LogOut,
  Bell,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  X,
  Phone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { formatDateTime } from "../utils/date";

export const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "support" | "legal">("profile");

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Notification toggle
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);

  // Support / Complaint Ticket state
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Legal modal
  const [legalModal, setLegalModal] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "support") {
      api.getTickets().then(setTickets).catch(console.error);
    }
  }, [activeTab]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showToast("Please enter your current password.", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    try {
      setPwLoading(true);
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      showToast("Password updated successfully!", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(err.message || "Failed to update password.", "error");
    } finally {
      setPwLoading(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast("Please fill in subject and message.", "error");
      return;
    }

    try {
      setSubmittingTicket(true);
      await api.createTicket({ subject, category, message });
      showToast("Support ticket created. Our team will review it shortly.", "success");
      setSubject("");
      setMessage("");
      const updated = await api.getTickets();
      setTickets(updated);
    } catch (err: any) {
      showToast(err.message || "Failed to create support ticket.", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-card">
        <div className="max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-mint text-primary font-bold text-xs">
            <Settings className="w-3.5 h-3.5" />
            <span>Account Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
            Settings & Security Management
          </h1>
          <p className="text-xs sm:text-sm text-dark-secondary leading-relaxed">
            Configure your member profile credentials, password security, session permissions, and submit support tickets directly to the VIP management team.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-border shadow-card flex flex-wrap gap-2">
        {[
          { id: "profile", label: "Profile & Identity", icon: User },
          { id: "security", label: "Password & Security", icon: KeyRound },
          { id: "support", label: "VIP Support & Complaints", icon: MessageSquare },
          { id: "legal", label: "Rules & Policies", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-dark-secondary hover:text-dark hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        {/* 1. PROFILE */}
        {activeTab === "profile" && (
          <div className="max-w-2xl space-y-6">
            <h3 className="font-extrabold text-base text-dark">Member Identification Profile</h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-dark-secondary block mb-1">Username</span>
                  <span className="font-bold text-dark text-sm">{user?.username ? `@${user.username}` : "Not set"}</span>
                </div>
                <div>
                  <span className="text-dark-secondary block mb-1">Account Unique ID</span>
                  <span className="font-mono font-black text-dark text-sm">{user?.account_id}</span>
                </div>
                <div>
                  <span className="text-dark-secondary block mb-1">Registered Phone</span>
                  <span className="font-bold text-dark text-sm">+91 {user?.mobile}</span>
                </div>
                <div>
                  <span className="text-dark-secondary block mb-1">Referral Code</span>
                  <span className="font-mono font-bold text-primary text-sm">{user?.referral_code}</span>
                </div>
                <div>
                  <span className="text-dark-secondary block mb-1">Current Membership Tier</span>
                  <span className="font-bold text-dark text-sm">
                    {user?.active_membership ? `VIP ${user.active_membership.level} (${user.active_membership.name})` : "Standard Member"}
                  </span>
                </div>
              </div>

              {/* Notification preferences */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-bold text-sm text-dark flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span>Notification Preferences</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer">
                    <span>Transaction & Balance Alerts</span>
                    <input
                      type="checkbox"
                      checked={pushNotifs}
                      onChange={(e) => setPushNotifs(e.target.checked)}
                      className="rounded border-slate-300 text-primary h-4 w-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer">
                    <span>Event & Promotion Announcements</span>
                    <input
                      type="checkbox"
                      checked={smsNotifs}
                      onChange={(e) => setSmsNotifs(e.target.checked)}
                      className="rounded border-slate-300 text-primary h-4 w-4"
                    />
                  </label>
                </div>
              </div>

              {/* Logout Sessions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of This Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    showToast("Logged out of all active sessions.", "info");
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-dark-secondary hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  <span>Log Out of All Devices</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. SECURITY */}
        {activeTab === "security" && (
          <div className="max-w-lg space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-dark">Change Password</h3>
              <p className="text-xs text-dark-secondary">
                Ensure your VIP account password uses at least 8 characters with a mix of numbers and letters.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-dark"
                  >
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark mb-1">New Password (Min 8 chars)</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-dark"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Confirm New Password</label>
                <input
                  type={showNew ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-3 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-card flex items-center justify-center gap-2"
              >
                {pwLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        )}

        {/* 3. SUPPORT & COMPLAINTS */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="max-w-2xl">
              <h3 className="font-extrabold text-base text-dark">VIP Help Desk & Complaint Resolution</h3>
              <p className="text-xs text-dark-secondary">
                Submit an inquiry or complaint directly to the platform administrators. Tickets are assigned a priority audit reference.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ticket form */}
              <form onSubmit={handleSubmitTicket} className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-sm text-dark">Submit New Ticket</h4>

                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 py-2 text-xs bg-white border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-border rounded-xl focus:outline-none focus:border-primary"
                  >
                    <option value="deposit">Deposit Verification Issue</option>
                    <option value="withdrawal">Withdrawal Status Inquiry</option>
                    <option value="vip">VIP Membership Question</option>
                    <option value="complaint">Service Complaint</option>
                    <option value="general">General Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">Message Details</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 py-2 text-xs bg-white border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-card flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingTicket ? "Submitting..." : "Send to VIP Support"}</span>
                </button>
              </form>

              {/* Tickets list */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-dark">Your Support Tickets</h4>
                {tickets && tickets.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {tickets.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-bold text-dark">{t.ticket_id}</span>
                            <h5 className="font-bold text-dark mt-0.5">{t.subject}</h5>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === "RESOLVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="text-dark-secondary">{t.message}</p>
                        {t.admin_reply && (
                          <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 mt-2">
                            <span className="font-bold block text-[11px]">Administrator Response:</span>
                            <p className="text-[11px] mt-0.5">{t.admin_reply}</p>
                          </div>
                        )}
                        <span className="text-[10px] text-dark-secondary font-mono block">Submitted: {formatDateTime(t.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center text-xs text-dark-secondary">
                    No tickets submitted yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. LEGAL & POLICIES */}
        {activeTab === "legal" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-dark">Platform Governance & Disclosures</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { title: "Terms & Conditions", key: "terms", desc: "User agreement and rights" },
                { title: "Privacy Policy", key: "privacy", desc: "Data protection and encryption standards" },
                { title: "Deposit & Withdrawal Rules", key: "rules", desc: "Schedules, UTR reconciliation, and AML checks" },
                { title: "Referral Program Terms", key: "referral_terms", desc: "3-tier network policies and anti-fraud rules" },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => setLegalModal(item.title)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-slate-50 cursor-pointer transition-all"
                >
                  <h4 className="font-bold text-dark mb-1">{item.title}</h4>
                  <p className="text-[11px] text-dark-secondary">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legal Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-dark">{legalModal}</h3>
              <button onClick={() => setLegalModal(null)} className="text-slate-400 hover:text-dark">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-dark-secondary leading-relaxed space-y-2 max-h-80 overflow-y-auto">
              <p>
                This document defines the binding platform terms governing <strong>{legalModal}</strong> under applicable Indian legal standards.
              </p>
              <p>
                1. <strong>Verification:</strong> All transactions are subject to AML and regulatory audits. Payments require verifiable UTR and banking confirmations.
              </p>
              <p>
                2. <strong>Account Responsibility:</strong> Members are solely responsible for credential security and designated payout accounts.
              </p>
              <p>
                3. <strong>Dispute Resolution:</strong> All disputes must be logged through the official Help Desk ticketing portal for administrative resolution.
              </p>
            </div>
            <button
              onClick={() => setLegalModal(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

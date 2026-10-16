import React, { useState } from "react";
import { KeyRound, ShieldAlert, Lock, Eye, EyeOff } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const AdminPasswordChangeModal: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.role !== "admin" || !user.must_change_password) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.changeAdminPassword(newPassword, confirmPassword);
      showToast(res.message, "success");
      updateUser({ must_change_password: false });
    } catch (err: any) {
      setError(err.message || "Failed to update administrator password.");
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-border animate-fade-in space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-7 h-7 text-amber-600" />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="font-extrabold text-xl text-dark">Security Checkpoint: Rotate Initial Setup Password</h3>
          <p className="text-xs text-dark-secondary leading-relaxed">
            As a required security policy, the initial superadmin credential must be changed before accessing administrator functions.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-dark uppercase mb-1">
              New Secure Admin Password (Min 8 chars)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder=""
                className="w-full px-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-dark"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-dark uppercase mb-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=""
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-colors shadow-card disabled:opacity-50"
          >
            {loading ? "Rotating Credential..." : "Confirm & Set New Administrator Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

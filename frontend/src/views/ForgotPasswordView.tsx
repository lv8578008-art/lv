import React, { useState } from "react";
import { Crown, Eye, EyeOff, Lock, Phone, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

interface ForgotPasswordViewProps {
  onNavigate: (view: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [mobile, setMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.trim().replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length !== 10) {
      setError("Please enter your 10-digit registered Indian mobile number.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setLoading(true);
      // 1. Authorize recovery session through server security checkpoint
      const authSession = await api.getRecoveryToken(cleanMobile);
      if (!authSession || !authSession.recovery_token) {
        throw new Error("Unable to authorize password recovery session.");
      }

      // 2. Perform authorized password reset using verified token
      await api.forgotPassword({
        mobile: cleanMobile,
        recovery_token: authSession.recovery_token,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });

      setSuccess(true);
      showToast("Password has been reset successfully. Please log in.", "success");
    } catch (err: any) {
      const msg = err.message || "Failed to reset password. Please check your registered number.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-dark via-primary to-teal-500 flex items-center justify-center shadow-card mb-4">
          <Crown className="w-8 h-8 text-gold" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-dark tracking-tight">
          Reset VIP Credentials
        </h2>
        <p className="mt-1 text-sm text-dark-secondary">
          Authorized security recovery for member accounts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-border">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-dark mb-2">Password Successfully Reset</h3>
              <p className="text-xs text-dark-secondary mb-6 leading-relaxed">
                Your credentials have been securely updated and previous sessions have been invalidated. You can now log in with your new password.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-colors shadow-card"
              >
                Proceed to Login
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-start gap-2.5">
                  <span className="shrink-0 text-rose-500 font-bold">!</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Registered mobile */}
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1 uppercase tracking-wide">
                    Registered Mobile Number
                  </label>
                  <div className="relative rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-slate-50/50">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-secondary">
                      <Phone className="w-4 h-4" />
                      <span className="ml-2 text-xs font-bold text-dark border-r border-border pr-2">+91</span>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder=""
                      className="block w-full pl-24 pr-4 py-2.5 text-sm text-dark placeholder-slate-400 bg-transparent rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1 uppercase tracking-wide">
                    New Password (Min 8 chars)
                  </label>
                  <div className="relative rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-slate-50/50">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-secondary">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder=""
                      className="block w-full pl-10 pr-11 py-2.5 text-sm text-dark placeholder-slate-400 bg-transparent rounded-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-dark-secondary hover:text-dark transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1 uppercase tracking-wide">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-slate-50/50">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-secondary">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder=""
                      className="block w-full pl-10 pr-4 py-2.5 text-sm text-dark placeholder-slate-400 bg-transparent rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* Reset button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:opacity-95 shadow-card transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <div className="mt-6 text-center pt-5 border-t border-border">
                <button
                  type="button"
                  onClick={() => onNavigate("login")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-dark-secondary hover:text-dark transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Crown, Eye, EyeOff, Lock, Phone, ArrowRight, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface LoginViewProps {
  onNavigate: (view: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanLogin = mobile.trim();
    if (!cleanLogin) {
      setError("Please enter your mobile number or username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const user = await login(cleanLogin, password, rememberDevice);
      showToast(`Welcome back, ${user.username || user.account_id}!`, "success");
      if (user.role === "admin") {
        onNavigate("admin");
      } else {
        onNavigate("dashboard");
      }
    } catch (err: any) {
      const msg = err.message || "Login failed. Please verify credentials.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-dark via-primary to-teal-500 flex items-center justify-center shadow-card mb-4">
          <Crown className="w-8 h-8 text-gold" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-dark tracking-tight">
          VIP Rewards Club
        </h2>
        <p className="mt-1 text-sm text-dark-secondary">
          Sign in to access your elite benefits & dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-border">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <span className="shrink-0 text-rose-500 font-bold">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mobile input */}
            {/* Mobile or Username input */}
            <div>
              <label className="block text-xs font-semibold text-dark mb-1.5 uppercase tracking-wide">
                Mobile Number or Username
              </label>
              <div className="relative rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-slate-50/50">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-secondary">
                  {/^\d+$/.test(mobile.trim()) || !mobile.trim() ? (
                    <>
                      <Phone className="w-4 h-4" />
                      <span className="ml-2 text-xs font-bold text-dark border-r border-border pr-2">+91</span>
                    </>
                  ) : (
                    <UserIcon className="w-4 h-4 text-primary" />
                  )}
                </div>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder={/^\d+$/.test(mobile.trim()) || !mobile.trim() ? "9876543210" : "username"}
                  className={`block w-full py-3 text-sm text-dark placeholder-slate-400 bg-transparent rounded-xl focus:outline-none ${
                    /^\d+$/.test(mobile.trim()) || !mobile.trim() ? "pl-24 pr-4" : "pl-10 pr-4"
                  }`}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-dark uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate("forgot_password")}
                  className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-slate-50/50">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-secondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className="block w-full pl-10 pr-11 py-3 text-sm text-dark placeholder-slate-400 bg-transparent rounded-xl focus:outline-none"
                  autoComplete="current-password"
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

            {/* Remember Device & Security */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-dark-secondary">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
                <span>Remember this device</span>
              </label>
              <div className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:opacity-95 shadow-card hover:shadow-card-hover transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to VIP Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>


          {/* Switch to SignUp */}
          <div className="mt-6 text-center pt-5 border-t border-border">
            <p className="text-xs text-dark-secondary">
              Don't have an exclusive account yet?{" "}
              <button
                type="button"
                onClick={() => onNavigate("signup")}
                className="font-bold text-primary hover:text-primary-dark transition-colors"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Crown, Eye, EyeOff, Lock, Phone, User as UserIcon, UserPlus, Gift, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface SignUpViewProps {
  onNavigate: (view: string) => void;
  initialReferral?: string;
}

export const SignUpView: React.FC<SignUpViewProps> = ({ onNavigate, initialReferral }) => {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferral || "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check url search params for referral
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (cleanUsername && cleanUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    const cleanMobile = mobile.trim();
    if (!cleanMobile || cleanMobile.length !== 10 || !["6", "7", "8", "9"].includes(cleanMobile[0])) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setLoading(true);
      const user = await register({
        username: cleanUsername || undefined,
        mobile: cleanMobile,
        password,
        confirm_password: confirmPassword,
        referral_code: referralCode.trim() || undefined,
      });

      showToast(`Account ${user.account_id} created successfully!`, "success");
      onNavigate("dashboard");
    } catch (err: any) {
      const msg = err.message || "Failed to create account. Please check your details.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-dark via-primary to-teal-500 flex items-center justify-center shadow-card mb-4">
          <Crown className="w-8 h-8 text-gold" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-dark tracking-tight">
          Create VIP Membership
        </h2>
        <p className="mt-1 text-sm text-dark-secondary">
          Join India's premier high-reward tier platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-border">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-dark mb-1 uppercase tracking-wide">
                Username
              </label>
              <div className="relative rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-slate-50/50">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-secondary">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={30}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="Choose a username (e.g. rahul_vip)"
                  className="block w-full pl-10 pr-4 py-2.5 text-sm text-dark placeholder-slate-400 bg-transparent rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-semibold text-dark mb-1 uppercase tracking-wide">
                Indian Mobile Number
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
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder=""
                  className="block w-full pl-24 pr-4 py-2.5 text-sm text-dark placeholder-slate-400 bg-transparent rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-dark mb-1 uppercase tracking-wide">
                Create Password (Min 8 chars)
              </label>
              <div className="relative rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-slate-50/50">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-secondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-dark mb-1 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-slate-50/50">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-secondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder=""
                  className="block w-full pl-10 pr-4 py-2.5 text-sm text-dark placeholder-slate-400 bg-transparent rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Optional Referral Code */}
            <div>
              <label className="block text-xs font-semibold text-dark mb-1 uppercase tracking-wide">
                Referral Code (Optional)
              </label>
              <div className="relative rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-slate-50/50">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-secondary">
                  <Gift className="w-4 h-4 text-gold" />
                </div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder=""
                  className="block w-full pl-10 pr-4 py-2.5 text-sm text-dark placeholder-slate-400 bg-transparent rounded-xl focus:outline-none font-mono"
                />
              </div>
            </div>


            {/* Terms checkbox */}
            <div className="text-[11px] text-dark-secondary leading-relaxed pt-1">
              By creating an account, you agree to our{" "}
              <span className="text-primary font-semibold underline cursor-pointer">Terms of Service</span>,{" "}
              <span className="text-primary font-semibold underline cursor-pointer">Privacy Policy</span>, and VIP withdrawal schedules.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:opacity-95 shadow-card hover:shadow-card-hover transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Activate VIP Membership</span>
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 text-center pt-5 border-t border-border">
            <p className="text-xs text-dark-secondary">
              Already a VIP Member?{" "}
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="font-bold text-primary hover:text-primary-dark transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

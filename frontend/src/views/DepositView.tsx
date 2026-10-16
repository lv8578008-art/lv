import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowDownCircle,
  QrCode,
  Copy,
  Check,
  UploadCloud,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  ExternalLink,
  Info,
  RefreshCw,
  Image as ImageIcon,
  ChevronRight,
  X,
  CreditCard,
  Zap,
  Sparkles,
  Globe,
  Download,
} from "lucide-react";
import { api } from "../services/api";
import { DepositRequest, DepositConfig } from "../types";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../utils/date";

interface DepositViewProps {
  onRefreshBalance?: (bal: number) => void;
}

export const DepositView: React.FC<DepositViewProps> = ({ onRefreshBalance }) => {
  const { showToast } = useToast();

  // Multi-step state: 1 = Amount Selection, 2 = Pay & Verify (Scanner, UPI Apps, UTR + Screenshot)
  const [step, setStep] = useState<1 | 2>(1);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Form fields
  const [amount, setAmount] = useState<string>("500");
  const [utr, setUtr] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Validation & Duplicate UTR states
  const [isDuplicateUtr, setIsDuplicateUtr] = useState<boolean>(false);
  const [checkingUtr, setCheckingUtr] = useState<boolean>(false);

  // Razorpay state
  const [payingWithRazorpay, setPayingWithRazorpay] = useState(false);

  // Scanner Display state: auto (exact amount + customer tag), universal (all apps), gallery (downloadable), standee (official merchant)
  const [activeScanner, setActiveScanner] = useState<"auto" | "universal" | "gallery" | "standee">("auto");
  const [copiedCustRef, setCopiedCustRef] = useState(false);

  // Config & Data
  const [config, setConfig] = useState<DepositConfig | null>(null);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const quickAmounts = [500, 1500, 5000, 15000, 50000, 100000];

  const fetchDepositData = async () => {
    try {
      const [confRes, depRes] = await Promise.all([
        api.getDepositConfig(),
        api.getDeposits(),
      ]);
      setConfig(confRes);
      setDeposits(depRes);
    } catch (err: any) {
      showToast(err.message || "Failed to load deposit settings", "error");
    }
  };

  useEffect(() => {
    fetchDepositData();
  }, []);

  // UPI deep links & Payment Link handling
  const numAmount = parseFloat(amount) || 0;
  const officialUpi = config?.upi_id || "vippay@oksbi";
  const payeeName = config?.merchant_name || "VIP Rewards";
  const customerAcc = config?.customer_account_id || "VIP-MEMBER";

  const isWebPaymentLink = useMemo(() => {
    return officialUpi.startsWith("http://") || officialUpi.startsWith("https://");
  }, [officialUpi]);

  // Scanner 1: Dynamic Auto-Amount Scanner
  const autoAmountUpiUri = useMemo(() => {
    if (isWebPaymentLink) {
      return officialUpi;
    }
    return `upi://pay?pa=${encodeURIComponent(officialUpi)}&pn=${encodeURIComponent(payeeName)}&am=${encodeURIComponent(
      numAmount.toFixed(2)
    )}&cu=INR&tn=${encodeURIComponent(`DEP-${customerAcc}`)}`;
  }, [isWebPaymentLink, officialUpi, payeeName, numAmount, customerAcc]);

  const autoAmountQrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(autoAmountUpiUri)}`;
  }, [autoAmountUpiUri]);

  // Scanner 2: Universal Scanner (Open amount, compatible with any bank app)
  const universalUpiUri = useMemo(() => {
    if (isWebPaymentLink) {
      return officialUpi;
    }
    return `upi://pay?pa=${encodeURIComponent(officialUpi)}&pn=${encodeURIComponent(payeeName)}&cu=INR&tn=${encodeURIComponent(`DEP-${customerAcc}`)}`;
  }, [isWebPaymentLink, officialUpi, payeeName, customerAcc]);

  const universalQrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(universalUpiUri)}`;
  }, [universalUpiUri]);

  // Scanner 3: High-Contrast Gallery QR
  const galleryQrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=15&data=${encodeURIComponent(autoAmountUpiUri)}`;
  }, [autoAmountUpiUri]);

  // Scanner 4: Official Standee QR
  const standeeQrUrl = config?.qr_code_url || autoAmountQrUrl;

  const currentQrImage = useMemo(() => {
    switch (activeScanner) {
      case "universal":
        return universalQrUrl;
      case "gallery":
        return galleryQrUrl;
      case "standee":
        return standeeQrUrl;
      case "auto":
      default:
        return autoAmountQrUrl;
    }
  }, [activeScanner, autoAmountQrUrl, universalQrUrl, galleryQrUrl, standeeQrUrl]);

  const standardUpiUri = autoAmountUpiUri;
  const dynamicQrUrl = autoAmountQrUrl;

  // Detect mobile device
  const isMobile = useMemo(() => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // App-specific trigger handler with device-awareness
  const handleOpenUpiApp = (appName: "phonepe" | "gpay" | "paytm" | "bhim") => {
    if (isWebPaymentLink) {
      window.open(officialUpi, "_blank");
      showToast(`Opening payment page (${appName.toUpperCase()})...`, "info");
      return;
    }

    if (!isMobile) {
      showToast(
        `UPI Apps can only launch on mobile devices. Please scan the QR code below using ${appName.toUpperCase()} on your phone!`,
        "info"
      );
      const qrEl = document.getElementById("deposit-qr-section");
      if (qrEl) {
        qrEl.scrollIntoView({ behavior: "smooth", block: "center" });
        qrEl.classList.add("ring-4", "ring-primary", "bg-emerald-50/50");
        setTimeout(() => qrEl.classList.remove("ring-4", "ring-primary", "bg-emerald-50/50"), 2500);
      }
      return;
    }

    let deepLink = standardUpiUri;
    if (appName === "phonepe") {
      deepLink = `phonepe://pay?pa=${encodeURIComponent(officialUpi)}&pn=${encodeURIComponent(
        payeeName
      )}&am=${encodeURIComponent(numAmount.toFixed(2))}&cu=INR`;
    } else if (appName === "paytm") {
      deepLink = `paytmmp://pay?pa=${encodeURIComponent(officialUpi)}&pn=${encodeURIComponent(
        payeeName
      )}&am=${encodeURIComponent(numAmount.toFixed(2))}&cu=INR`;
    } else if (appName === "gpay") {
      deepLink = `tez://upi/pay?pa=${encodeURIComponent(officialUpi)}&pn=${encodeURIComponent(
        payeeName
      )}&am=${encodeURIComponent(numAmount.toFixed(2))}&cu=INR`;
    }

    try {
      const a = document.createElement("a");
      a.href = deepLink;
      a.click();
    } catch {
      window.location.href = standardUpiUri;
    }

    showToast(`Opening ${appName.toUpperCase()}... Please approve payment of ₹${numAmount.toLocaleString()}.`, "info");
  };

  // Real-time UTR duplicate checking
  useEffect(() => {
    const clean = utr.trim();
    if (!clean || clean.length < 6) {
      setIsDuplicateUtr(false);
      return;
    }

    // Check local loaded deposits list first
    const matchLocal = deposits.some(
      (d) => d.utr.toLowerCase() === clean.toLowerCase()
    );
    if (matchLocal) {
      setIsDuplicateUtr(true);
      return;
    }

    // Debounced remote backend check
    const timer = setTimeout(async () => {
      try {
        setCheckingUtr(true);
        const res = await api.checkUtrExists(clean);
        setIsDuplicateUtr(res.exists);
      } catch {
        // Silent fallback
      } finally {
        setCheckingUtr(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [utr, deposits]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        showToast("Screenshot file size must be less than 5MB", "error");
        return;
      }
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(officialUpi);
    setCopiedUpi(true);
    showToast("Official UPI address copied!", "success");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyCustRef = () => {
    navigator.clipboard.writeText(`DEP-${customerAcc}`);
    setCopiedCustRef(true);
    showToast(`Customer Reference DEP-${customerAcc} copied!`, "success");
    setTimeout(() => setCopiedCustRef(false), 2000);
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(currentQrImage);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `VIP-Deposit-QR-Rs${numAmount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast("QR code downloaded! Open your UPI app and scan from gallery.", "success");
    } catch {
      window.open(currentQrImage, "_blank");
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    if (!isAmountValid) {
      showToast("Minimum deposit amount is ₹100.", "error");
      return;
    }

    try {
      setPayingWithRazorpay(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast("Unable to load Razorpay SDK. Please check your internet connection.", "error");
        return;
      }

      // 1. Create order on backend
      const order = await api.createRazorpayOrder(numAmount);

      // 2. Open Razorpay Checkout modal
      const options = {
        key: order.key_id,
        amount: order.amount_in_paise,
        currency: order.currency || "INR",
        name: config?.merchant_name || "VIP Rewards Club",
        description: `Wallet Deposit: ₹${numAmount.toLocaleString()}`,
        image: "https://cdn-icons-png.flaticon.com/512/9028/9028031.png",
        order_id: order.order_id,
        prefill: {
          name: order.customer_name || "",
          contact: order.customer_mobile || "",
        },
        notes: {
          account_id: order.customer_account_id || "",
        },
        theme: {
          color: "#0d9488",
        },
        handler: async (response: any) => {
          try {
            // 3. Verify signature cryptographically on backend
            const verifyRes = await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: numAmount,
            });

            showToast(`Deposit Verified! ₹${numAmount.toLocaleString()} added to your wallet instantly.`, "success");
            setStep(1);
            await fetchDepositData();

            if (onRefreshBalance) {
              onRefreshBalance(verifyRes.new_balance);
            }
          } catch (err: any) {
            showToast(err.message || "Payment verification failed. Please contact support with payment ID.", "error");
          }
        },
        modal: {
          ondismiss: () => {
            showToast("Razorpay payment modal closed.", "info");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        showToast(`Payment Failed: ${resp.error.description || resp.error.reason}`, "error");
      });
      rzp.open();
    } catch (err: any) {
      showToast(err.message || "Failed to initialize Razorpay checkout.", "error");
    } finally {
      setPayingWithRazorpay(false);
    }
  };

  // Validation rules:
  // 1. Amount >= 100
  // 2. UTR is non-empty, exactly 12 digits, and NOT duplicate
  // 3. Receipt image is provided
  const isAmountValid = numAmount >= 100;
  const isUtrFormatValid = /^\d{12}$/.test(utr.trim());
  const hasScreenshot = file !== null;
  const canSubmit = isAmountValid && isUtrFormatValid && !isDuplicateUtr && hasScreenshot && !loading;

  const handleProceedToPayment = () => {
    if (!isAmountValid) {
      showToast("Minimum deposit amount is ₹100.", "error");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAmountValid) {
      showToast("Minimum deposit amount is ₹100.", "error");
      return;
    }
    if (!isUtrFormatValid) {
      showToast("Please enter a valid 12-digit numeric UTR/Reference number.", "error");
      return;
    }
    if (isDuplicateUtr) {
      showToast("This UTR has already been submitted! Duplicate UTR is not allowed.", "error");
      return;
    }
    if (!file) {
      showToast("Please upload payment receipt screenshot.", "error");
      return;
    }

    try {
      setLoading(true);
      // 1. Upload screenshot
      const uploadRes = await api.uploadScreenshot(file);

      // 2. Submit deposit request
      const depRes = await api.submitDeposit({
        amount: numAmount,
        utr: utr.trim(),
        screenshot_url: uploadRes.url,
      });

      showToast(`Deposit request ${depRes.txn_id} submitted! Amount will reach your account within 24 hours after verification. Please be patient.`, "success");
      setUtr("");
      setFile(null);
      setFilePreview(null);
      setIsDuplicateUtr(false);
      setStep(1); // Return to step 1 ready for next action
      await fetchDepositData();

      // Refresh global balance
      const dash = await api.getDashboard();
      if (onRefreshBalance) {
        onRefreshBalance(dash.available_balance);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to submit deposit request.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-card">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-mint text-primary font-bold text-xs">
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Official UPI Deposit Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
            Add Funds to VIP Wallet
          </h1>
          <p className="text-xs sm:text-sm text-dark-secondary leading-relaxed">
            Fast, secure UPI deposits. Select your deposit amount, pay via PhonePe, Google Pay, Paytm, or scan QR, and submit your 12-digit UTR with receipt screenshot for immediate ledger verification.
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
          <div
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${step === 1 ? "text-primary font-black" : "text-dark-secondary font-medium"
              }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1
                  ? "bg-primary text-white shadow-soft"
                  : "bg-emerald-100 text-emerald-800"
                }`}
            >
              1
            </div>
            <span className="text-xs sm:text-sm">Step 1: Choose Amount</span>
          </div>

          <div className="w-8 sm:w-12 h-0.5 bg-slate-200" />

          <div
            onClick={() => isAmountValid && setStep(2)}
            className={`flex items-center gap-2 transition-colors ${step === 2
                ? "text-primary font-black"
                : isAmountValid
                  ? "text-dark-secondary font-medium cursor-pointer"
                  : "text-slate-300 font-medium cursor-not-allowed"
              }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2
                  ? "bg-primary text-white shadow-soft"
                  : "bg-slate-100 text-slate-400"
                }`}
            >
              2
            </div>
            <span className="text-xs sm:text-sm">Step 2: Pay & Submit Proof</span>
          </div>
        </div>
      </div>

      {/* 1-Tap Official Platform Deposit Rules Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/5 to-primary-mint/15 rounded-2xl p-4 border border-amber-300/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-soft">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">Official Deposit Rules & SLA Policy</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Notice
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Deposited funds are strictly for purchasing product plans • Verified & credited within 24 hours
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRulesModal(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-soft transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <span>View Rules (1-Tap)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1-Tap Deposit Rules Modal Dialog */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-dark">Official Deposit Policy</h3>
                  <p className="text-xs text-dark-secondary">Account Credit SLA & Fund Usage Terms</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                <span className="font-extrabold text-amber-950 text-xs flex items-center gap-2">
                  <span>🛍️</span>
                  <span>1. Product Purchase Only</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Once deposited, your funds can <strong>ONLY be used to purchase and activate product plans</strong>. Deposited principal cannot be withdrawn directly.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                <span className="font-extrabold text-amber-950 text-xs flex items-center gap-2">
                  <span>⏱️</span>
                  <span>2. 24-Hour Account Credit Window</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  After submitting your 12-digit UTR and payment receipt, your funds will be verified and reach your account <strong>within 24 hours of deposit time</strong>. Please remain patient while verification finishes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-1.5">
                <span className="font-extrabold text-teal-950 text-xs flex items-center gap-2">
                  <span>💰</span>
                  <span>3. 100% Withdrawable Plan Returns</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  All daily plan returns and referral commissions earned are <strong>100% withdrawable</strong> to your bank account or UPI on your designated VIP day.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Official VIP Platform SLA Terms</span>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close (Got it)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 1: AMOUNT SELECTION                                */}
      {/* ======================================================== */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-card max-w-2xl mx-auto space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-primary">Step 1 of 2</span>
            <h2 className="text-xl sm:text-2xl font-black text-dark">Enter Deposit Amount</h2>
            <p className="text-xs text-dark-secondary">
              Choose a quick amount preset or enter a custom deposit amount (Minimum ₹100).
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-secondary">
              Deposit Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-black text-dark text-xl sm:text-2xl">
                ₹
              </span>
              <input
                type="number"
                min={100}
                step={50}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="block w-full pl-10 pr-4 py-4 text-xl sm:text-2xl font-black text-dark bg-slate-50 border-2 border-border rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all"
              />
            </div>

            {/* Quick Amount Chips */}
            <div>
              <span className="text-[11px] font-bold text-dark-secondary uppercase block mb-2">
                Quick Amount Presets
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(q.toString())}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${amount === q.toString()
                        ? "bg-primary text-white border-primary shadow-soft scale-[1.02]"
                        : "bg-slate-50 border-slate-200 text-dark hover:border-primary hover:text-primary"
                      }`}
                  >
                    ₹{q.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-[10px] font-bold uppercase text-dark-secondary">Deposit Fee</span>
              <span className="text-xs font-black text-emerald-600">₹0.00 (Free)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-[10px] font-bold uppercase text-dark-secondary">Min Deposit</span>
              <span className="text-xs font-black text-dark">₹100</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-[10px] font-bold uppercase text-dark-secondary">Credited Amount</span>
              <span className="text-xs font-black text-primary">₹{numAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Step 1 Continue Button */}
          <button
            type="button"
            onClick={handleProceedToPayment}
            disabled={!isAmountValid}
            className="w-full py-4 px-6 rounded-2xl text-base font-black text-white bg-gradient-to-r from-primary to-primary-dark hover:opacity-95 shadow-card hover:shadow-card-hover transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Proceed to Payment (₹{numAmount.toLocaleString("en-IN")})</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: PAYMENT REDIRECTION, QR CODE & VERIFICATION     */}
      {/* ======================================================== */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Active Deposit Amount Bar */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-soft">
                ₹
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-dark-secondary">
                  Paying For Deposit
                </span>
                <div className="text-xl sm:text-2xl font-black text-primary">
                  ₹{numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-dark hover:border-primary hover:text-primary transition-all self-start sm:self-center shadow-soft"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Amount</span>
            </button>
          </div>

          {/* RAZORPAY 1-TAP INSTANT PAYMENT CARD */}
          {config?.razorpay_enabled && (
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 border border-indigo-700/50 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-soft shrink-0">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-white tracking-wide">
                        Razorpay Instant Deposit
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        ⚡ Auto-Credit in 3s
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Pay via Cards, Google Pay, PhonePe, Paytm, Netbanking, or Wallets with zero waiting. No UTR or receipt submission required!
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>256-bit Bank Grade Encrypted • Instant Ledger Approval</span>
                </div>

                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={payingWithRazorpay || !isAmountValid}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>
                    {payingWithRazorpay ? "Launching Gateway..." : `Pay ₹${numAmount.toLocaleString()} Instantly with Razorpay`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Quick UPI App Launch */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-dark flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span>{isMobile ? "1-Tap Direct UPI Payment" : "UPI App Payment"}</span>
                </h3>
                <p className="text-xs text-dark-secondary">
                  {isMobile ? (
                    <>Tap any UPI app below to pay <strong>₹{numAmount.toLocaleString()}</strong> directly:</>
                  ) : (
                    <>Click to launch or scan the amount-embedded QR code below:</>
                  )}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold self-start border ${isMobile
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                {isMobile ? "Instant Launch" : "QR & Form"}
              </span>
            </div>

            {/* UPI App Icons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {/* PhonePe */}
              <button
                type="button"
                onClick={() => handleOpenUpiApp("phonepe")}
                className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-[#5f259f] bg-slate-50/60 hover:bg-[#5f259f]/5 transition-all text-center flex flex-col items-center gap-2 shadow-soft hover:shadow-card cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#5f259f] flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
                  <span className="font-black text-lg">पे</span>
                </div>
                <div>
                  <span className="font-bold text-xs text-dark block group-hover:text-[#5f259f]">PhonePe</span>
                  <span className="text-[10px] text-dark-secondary">
                    {isMobile ? "Tap to launch" : "Scan QR on PC"}
                  </span>
                </div>
              </button>

              {/* Google Pay */}
              <button
                type="button"
                onClick={() => handleOpenUpiApp("gpay")}
                className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-[#1a73e8] bg-slate-50/60 hover:bg-[#1a73e8]/5 transition-all text-center flex flex-col items-center gap-2 shadow-soft hover:shadow-card cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform p-2">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-xs text-dark block group-hover:text-[#1a73e8]">Google Pay</span>
                  <span className="text-[10px] text-dark-secondary">
                    {isMobile ? "Tap to launch" : "Scan QR on PC"}
                  </span>
                </div>
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => handleOpenUpiApp("paytm")}
                className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-[#002e6e] bg-slate-50/60 hover:bg-[#002e6e]/5 transition-all text-center flex flex-col items-center gap-2 shadow-soft hover:shadow-card cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#002e6e] flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform font-black tracking-tight text-xs">
                  Paytm
                </div>
                <div>
                  <span className="font-bold text-xs text-dark block group-hover:text-[#002e6e]">Paytm</span>
                  <span className="text-[10px] text-dark-secondary">
                    {isMobile ? "Tap to launch" : "Scan QR on PC"}
                  </span>
                </div>
              </button>

              {/* BHIM / Any UPI */}
              <button
                type="button"
                onClick={() => handleOpenUpiApp("bhim")}
                className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 bg-slate-50/60 hover:bg-emerald-50/50 transition-all text-center flex flex-col items-center gap-2 shadow-soft hover:shadow-card cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform font-black text-xs">
                  BHIM
                </div>
                <div>
                  <span className="font-bold text-xs text-dark block group-hover:text-emerald-700">Any UPI App</span>
                  <span className="text-[10px] text-dark-secondary">
                    {isMobile ? "Universal Intent" : "Scan QR on PC"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Split Grid - QR Scanner (Left) & Verification Form (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Dynamic QR Scanner & UPI ID */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-border shadow-card space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-dark flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    <span>Scan QR Code to Pay</span>
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Official Gateway
                  </span>
                </div>

                {/* Multiple Scanner Display Tabs */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-dark-secondary uppercase tracking-wider">
                      Choose Scanner Display
                    </span>
                    <span className="text-[10px] text-primary font-bold">1 Official UPI • 4 Displays</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setActiveScanner("auto")}
                      className={`py-2 px-2.5 rounded-xl text-left transition-all flex items-center gap-2 cursor-pointer ${
                        activeScanner === "auto"
                          ? "bg-white text-primary shadow-soft font-black"
                          : "text-slate-600 hover:text-dark font-medium"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      <div className="truncate">
                        <span className="text-[11px] block leading-tight font-extrabold">Auto-Amount</span>
                        <span className="text-[9px] text-slate-400 block truncate">Pre-fills ₹{numAmount}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveScanner("universal")}
                      className={`py-2 px-2.5 rounded-xl text-left transition-all flex items-center gap-2 cursor-pointer ${
                        activeScanner === "universal"
                          ? "bg-white text-primary shadow-soft font-black"
                          : "text-slate-600 hover:text-dark font-medium"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                      <div className="truncate">
                        <span className="text-[11px] block leading-tight font-extrabold">Universal QR</span>
                        <span className="text-[9px] text-slate-400 block truncate">All Banking Apps</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveScanner("gallery")}
                      className={`py-2 px-2.5 rounded-xl text-left transition-all flex items-center gap-2 cursor-pointer ${
                        activeScanner === "gallery"
                          ? "bg-white text-primary shadow-soft font-black"
                          : "text-slate-600 hover:text-dark font-medium"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <div className="truncate">
                        <span className="text-[11px] block leading-tight font-extrabold">Gallery Ready</span>
                        <span className="text-[9px] text-slate-400 block truncate">Scan from photo</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveScanner("standee")}
                      className={`py-2 px-2.5 rounded-xl text-left transition-all flex items-center gap-2 cursor-pointer ${
                        activeScanner === "standee"
                          ? "bg-white text-primary shadow-soft font-black"
                          : "text-slate-600 hover:text-dark font-medium"
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                      <div className="truncate">
                        <span className="text-[11px] block leading-tight font-extrabold">Merchant Standee</span>
                        <span className="text-[9px] text-slate-400 block truncate">Direct Official QR</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Selected QR Display Box */}
                <div id="deposit-qr-section" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3 transition-all duration-300">
                  <div className="w-52 h-52 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-soft mx-auto flex items-center justify-center relative group">
                    <img
                      src={currentQrImage}
                      alt="Amount Embedded QR Code"
                      className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200">
                      <span>Exact Amount: ₹{numAmount.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-dark-secondary">
                      {activeScanner === "auto" && "Scan with Google Pay, PhonePe, Paytm, or BHIM. Amount pre-loaded."}
                      {activeScanner === "universal" && "Standard UPI payload compatible across all Indian bank UPI apps."}
                      {activeScanner === "gallery" && "Save image below and choose 'Scan from Gallery' inside PhonePe or GPay."}
                      {activeScanner === "standee" && "Official verified merchant standee QR code."}
                    </p>
                  </div>

                  {/* 1-Click Download QR Button */}
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-dark transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Download QR Image (Scan from Gallery)</span>
                  </button>
                </div>

                {/* Verified UPI ID / Payment Link Box with 1-Click Copy and Open */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-dark-secondary">
                      {isWebPaymentLink ? "Official Payment Gateway Page" : "Official Business UPI ID"}
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold">100% Verified</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-2">
                    <span className="font-mono font-bold text-xs text-dark select-all truncate mr-2">
                      {officialUpi}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isWebPaymentLink && (
                        <a
                          href={officialUpi}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleCopyUPI}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-primary hover:bg-primary-mint transition-colors cursor-pointer shrink-0"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customer Account Tag (One customer one display tag) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-dark-secondary">
                      Your Unique Payment Reference Tag
                    </label>
                    <span className="text-[10px] text-primary font-bold">Auto-embedded in QR</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                      <span className="font-mono font-black text-xs text-primary truncate select-all">
                        DEP-{customerAcc}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCustRef}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-primary/30 text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-xs"
                    >
                      {copiedCustRef ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Tag</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Step Instructions */}
                <div className="p-4 rounded-2xl bg-primary-mint/40 border border-teal-100 text-xs space-y-2">
                  <span className="font-bold text-primary block">Payment Instructions:</span>
                  <ol className="list-decimal list-inside space-y-1.5 text-dark leading-relaxed text-[11px]">
                    <li>Complete the payment of <strong>₹{numAmount.toLocaleString()}</strong> via your UPI app or scan the QR.</li>
                    <li>Open transaction details in your banking app and copy the <strong>12-digit UTR/Ref number</strong>.</li>
                    <li>Take a screenshot of the completed payment receipt.</li>
                    <li>Submit the form with both UTR & receipt for verification.</li>
                  </ol>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-dark-secondary pt-3 border-t border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Anti-fraud verification: All UTRs reconciled against bank records.</span>
              </div>
            </div>

            {/* Right: Submission Form with UTR & Receipt Verification */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-border shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-lg text-dark">
                      Submit Payment Verification
                    </h3>
                    <p className="text-xs text-dark-secondary">
                      Provide your 12-digit UTR and payment screenshot to verify deposit.
                    </p>
                  </div>
                  <span className="text-xs font-black text-primary px-3 py-1 rounded-full bg-primary-mint">
                    Amount: ₹{numAmount.toLocaleString()}
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* UTR Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-dark-secondary">
                        12-Digit UTR / Transaction Reference Number
                      </label>
                      <span
                        className={`text-[11px] font-mono font-bold ${utr.trim().length === 12
                            ? "text-emerald-600"
                            : utr.trim().length > 12
                              ? "text-rose-600"
                              : "text-dark-secondary"
                          }`}
                      >
                        {utr.trim().length} / 12 digits
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={12}
                        value={utr}
                        onChange={(e) => {
                          // Allow numeric only
                          const clean = e.target.value.replace(/\D/g, "");
                          setUtr(clean);
                        }}
                        placeholder="e.g. 797253986884"
                        className={`block w-full px-4 py-3 text-base font-mono font-bold text-dark bg-slate-50 border-2 rounded-xl focus:outline-none transition-all ${isDuplicateUtr
                            ? "border-rose-500 bg-rose-50/40 text-rose-900 focus:border-rose-600"
                            : utr.trim().length === 12
                              ? "border-emerald-500 focus:border-emerald-600"
                              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                          }`}
                      />
                      {checkingUtr && (
                        <div className="absolute right-3.5 top-3.5">
                          <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Duplicate UTR Alert Banner */}
                    {isDuplicateUtr && (
                      <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Already Submitted!</strong>
                          <span>
                            This UTR reference number has already been submitted in a prior deposit request. Duplicate UTR submissions are strictly disallowed.
                          </span>
                        </div>
                      </div>
                    )}

                    {!isDuplicateUtr && utr.trim().length > 0 && utr.trim().length < 12 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>UTR must be exactly 12 digits from your UPI transaction receipt.</span>
                      </p>
                    )}

                    {!isDuplicateUtr && utr.trim().length === 12 && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid 12-digit UTR reference format verified.</span>
                      </p>
                    )}
                  </div>

                  {/* Payment Screenshot Upload */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark-secondary mb-1">
                      Upload Payment Receipt Screenshot
                    </label>

                    <div className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />

                      {filePreview ? (
                        <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-xl border border-border">
                          <div className="flex items-center gap-3">
                            <img
                              src={filePreview}
                              alt="Receipt preview"
                              className="w-14 h-14 object-cover rounded-xl border border-border"
                            />
                            <div className="text-left text-xs">
                              <div className="font-bold text-dark truncate max-w-xs">{file?.name}</div>
                              <div className="text-[11px] text-emerald-600 font-semibold">
                                Receipt attached • {(file!.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] text-primary font-bold px-2.5 py-1 rounded-lg bg-primary-mint border border-primary/20">
                            Change Image
                          </span>
                        </div>
                      ) : (
                        <div className="py-4 space-y-1">
                          <UploadCloud className="w-9 h-9 text-primary mx-auto mb-1" />
                          <p className="text-xs font-bold text-dark">
                            Click or drag payment screenshot here
                          </p>
                          <p className="text-[10px] text-dark-secondary">
                            Supports JPG, PNG, or WEBP up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Readiness Checklist */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dark-secondary block">
                      Verification Readiness Checklist:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {isAmountValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span className={isAmountValid ? "text-dark font-semibold" : "text-dark-secondary"}>
                          Amount ₹{numAmount}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isUtrFormatValid && !isDuplicateUtr ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span
                          className={
                            isUtrFormatValid && !isDuplicateUtr ? "text-dark font-semibold" : "text-dark-secondary"
                          }
                        >
                          12-digit Unique UTR
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasScreenshot ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span className={hasScreenshot ? "text-dark font-semibold" : "text-dark-secondary"}>
                          Receipt Screenshot
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full py-4 px-4 rounded-xl text-sm font-black text-white bg-gradient-to-r from-primary to-primary-dark hover:opacity-95 shadow-card hover:shadow-card-hover transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isDuplicateUtr
                            ? "Duplicate UTR - Already Submitted"
                            : !isUtrFormatValid
                              ? "Enter 12-Digit UTR Number"
                              : !hasScreenshot
                                ? "Upload Receipt Screenshot"
                                : "Submit Deposit Verification Request"}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* USER DEPOSIT HISTORY TABLE                               */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-base sm:text-lg text-dark">
              Recent Deposit Requests & Status
            </h3>
            <p className="text-xs text-dark-secondary">
              Real-time audit history of your deposit submissions.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchDepositData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-dark-secondary transition-colors"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {deposits && deposits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-dark-secondary font-semibold uppercase text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">UTR Number</th>
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-dark">{d.txn_id}</td>
                    <td className="py-3.5 px-4 font-black text-dark">
                      ₹{d.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-dark-secondary select-all">{d.utr}</td>
                    <td className="py-3.5 px-4">
                      {d.screenshot_url ? (
                        <a
                          href={d.screenshot_url.startsWith("http") ? d.screenshot_url : `http://127.0.0.1:8000${d.screenshot_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-dark-secondary font-mono">{formatDateTime(d.created_at)}</td>
                    <td className="py-3.5 px-4">
                      {d.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      )}
                      {d.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Verifying</span>
                        </span>
                      )}
                      {d.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-dark-secondary">
                      {d.admin_notes || "Under review"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-dark-secondary text-xs">
            <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <span>No deposit requests submitted yet.</span>
          </div>
        )}
      </div>
    </div>
  );
};

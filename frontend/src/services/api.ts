const API_BASE = "http://127.0.0.1:8000/api";

function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem("vip_auth_token");
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // --- AUTH ---
  async login(payload: { mobile: string; password: string; remember_device?: boolean }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ access_token: string; user: any }>(res);
  },

  async register(payload: {
    username?: string;
    mobile: string;
    password: string;
    confirm_password: string;
    referral_code?: string;
    verification_code?: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ access_token: string; user: any }>(res);
  },

  async getRecoveryToken(mobile: string) {
    const res = await fetch(`${API_BASE}/auth/recovery-token?mobile=${encodeURIComponent(mobile)}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; recovery_token: string; message: string }>(res);
  },

  async forgotPassword(payload: {
    mobile: string;
    recovery_token: string;
    new_password: string;
    confirm_new_password: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async changePassword(payload: { old_password: string; new_password: string; confirm_new_password: string }) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // --- DASHBOARD ---
  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // --- VIP PRODUCTS ---
  async getVIPProducts() {
    const res = await fetch(`${API_BASE}/vip/products`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async purchaseVIP(productId: number) {
    const res = await fetch(`${API_BASE}/vip/purchase`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ product_id: productId }),
    });
    return handleResponse<{ success: boolean; message: string; remaining_balance: number; current_vip_level?: number }>(res);
  },

  async getVIPProgress() {
    const res = await fetch(`${API_BASE}/vip/progress`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // --- DEPOSITS ---
  async getDepositConfig() {
    const res = await fetch(`${API_BASE}/deposits/config`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<{
      upi_id: string;
      qr_code_url: string;
      instructions: string;
      customer_account_id?: string;
      customer_mobile?: string;
      merchant_name?: string;
      razorpay_enabled?: boolean;
      razorpay_key_id?: string;
    }>(res);
  },

  async createRazorpayOrder(amount: number) {
    const res = await fetch(`${API_BASE}/deposits/razorpay/create-order`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ amount }),
    });
    return handleResponse<{
      success: boolean;
      order_id: string;
      amount: number;
      amount_in_paise: number;
      currency: string;
      key_id: string;
      receipt: string;
      customer_name?: string;
      customer_mobile?: string;
      customer_account_id?: string;
    }>(res);
  },

  async verifyRazorpayPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    amount: number;
  }) {
    const res = await fetch(`${API_BASE}/deposits/razorpay/verify-payment`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{
      success: boolean;
      message: string;
      txn_id: string;
      new_balance: number;
      payment_id?: string;
    }>(res);
  },

  async uploadScreenshot(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/uploads/screenshot`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse<{ success: boolean; url: string; filename: string }>(res);
  },

  async checkUtrExists(utr: string) {
    const res = await fetch(`${API_BASE}/deposits/check-utr?utr=${encodeURIComponent(utr)}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<{ exists: boolean; utr: string }>(res);
  },

  async submitDeposit(payload: { amount: number; utr: string; screenshot_url: string }) {
    const res = await fetch(`${API_BASE}/deposits`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async getDeposits() {
    const res = await fetch(`${API_BASE}/deposits`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  // --- WITHDRAWALS ---
  async getWithdrawalSchedule() {
    const res = await fetch(`${API_BASE}/withdrawals/schedule-info`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getPayoutMethods() {
    const res = await fetch(`${API_BASE}/withdrawals/methods`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async addPayoutMethod(payload: {
    type: string;
    account_holder: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
    upi_id?: string;
  }) {
    const res = await fetch(`${API_BASE}/withdrawals/methods`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async submitWithdrawal(payload: { amount: number; payout_method_id: number }) {
    const res = await fetch(`${API_BASE}/withdrawals`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async getWithdrawals() {
    const res = await fetch(`${API_BASE}/withdrawals`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  // --- REFERRALS ---
  async getReferralDashboard() {
    const res = await fetch(`${API_BASE}/referrals`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // --- TRANSACTIONS ---
  async getTransactions(category: string, status_filter = "ALL") {
    const res = await fetch(
      `${API_BASE}/transactions/all?category=${category}&status_filter=${status_filter}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    return handleResponse<any[]>(res);
  },

  // --- EVENTS ---
  async getEvents(statusFilter = "ALL") {
    const res = await fetch(`${API_BASE}/events?status_filter=${statusFilter}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  // --- SUPPORT ---
  async createTicket(payload: { subject: string; category: string; message: string }) {
    const res = await fetch(`${API_BASE}/support/tickets`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async getTickets() {
    const res = await fetch(`${API_BASE}/support/tickets`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  // --- ADMIN ---
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getAdminUsers(search?: string, statusFilter?: string) {
    let url = `${API_BASE}/admin/users?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (statusFilter) url += `status_filter=${encodeURIComponent(statusFilter)}&`;
    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async toggleUserStatus(userId: number) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-status`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getAdminDeposits(statusFilter = "ALL") {
    const res = await fetch(`${API_BASE}/admin/deposits?status_filter=${statusFilter}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async decideDeposit(depositId: number, status: string, adminNotes?: string) {
    const res = await fetch(`${API_BASE}/admin/deposits/${depositId}/decide`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });
    return handleResponse<any>(res);
  },

  async getAdminWithdrawals(statusFilter = "ALL") {
    const res = await fetch(`${API_BASE}/admin/withdrawals?status_filter=${statusFilter}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async decideWithdrawal(withdrawalId: number, status: string, payoutRef?: string, adminNotes?: string) {
    const res = await fetch(`${API_BASE}/admin/withdrawals/${withdrawalId}/decide`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        status,
        payout_reference: payoutRef,
        admin_notes: adminNotes,
      }),
    });
    return handleResponse<any>(res);
  },

  async updateVIPProduct(productId: number, payload: any) {
    const res = await fetch(`${API_BASE}/admin/vip-products/${productId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async createVIPProduct(payload: any) {
    const res = await fetch(`${API_BASE}/admin/vip-products`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async deleteVIPProduct(productId: number) {
    const res = await fetch(`${API_BASE}/admin/vip-products/${productId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async setUserVIPLevel(userId: number, vipLevel: number) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/set-vip-level`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ vip_level: vipLevel }),
    });
    return handleResponse<any>(res);
  },

  async getAdminVIPLevels() {
    const res = await fetch(`${API_BASE}/admin/vip-levels`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async updateAdminVIPLevels(payload: any[]) {
    const res = await fetch(`${API_BASE}/admin/vip-levels`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ success: boolean; message: string; levels: any[] }>(res);
  },

  async createEvent(payload: any) {
    const res = await fetch(`${API_BASE}/admin/events`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async deleteEvent(eventId: number) {
    const res = await fetch(`${API_BASE}/admin/events/${eventId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getAdminTickets() {
    const res = await fetch(`${API_BASE}/admin/tickets`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async replyTicket(ticketId: number, reply: string, status = "RESOLVED") {
    const res = await fetch(`${API_BASE}/admin/tickets/${ticketId}/reply`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ reply, status }),
    });
    return handleResponse<any>(res);
  },

  async getAdminSettings() {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<Record<string, string>>(res);
  },

  async updateAdminSettings(settings: Record<string, string>) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse<any>(res);
  },

  async changeAdminPassword(newPassword: string, confirmNewPassword: string) {
    const res = await fetch(`${API_BASE}/admin/change-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      }),
    });
    return handleResponse<any>(res);
  },

  async getDailySettlementStatus() {
    const res = await fetch(`${API_BASE}/admin/settlement/status`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<{
      ist_current_time: string;
      today_date: string;
      next_midnight_run: string;
      time_until_midnight: string;
      total_active_plans: number;
      settled_today_count: number;
      pending_today_count: number;
      daily_yield_pool: number;
      engine_status: string;
    }>(res);
  },

  async triggerDailySettlement(payload?: { target_date?: string; force_run?: boolean }) {
    const res = await fetch(`${API_BASE}/admin/settlement/run`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload || {}),
    });
    return handleResponse<any>(res);
  },
};

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { formatDateTime } from "../../utils/date";

export const AdminTicketsView: React.FC = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply modal
  const [replyTicketItem, setReplyTicketItem] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("RESOLVED");
  const [sending, setSending] = useState(false);

  const fetchTickets = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getAdminTickets();
      setTickets(res);
    } catch (err: any) {
      if (!isBackground) {
        showToast(err.message || "Failed to load support tickets", "error");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(false);
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTicketItem || !replyText.trim()) return;

    try {
      setSending(true);
      await api.replyTicket(replyTicketItem.id, replyText.trim(), replyStatus);
      showToast(`Reply sent to ticket ${replyTicketItem.ticket_id}`, "success");
      setReplyTicketItem(null);
      setReplyText("");
      fetchTickets(false);
    } catch (err: any) {
      showToast(err.message || "Failed to send reply", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-dark">Customer Support & Complaints Queue</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time Feed (Auto-sync 10s)
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-0.5">
            Review member inquiries, deposit discrepancies, and provide official administrator responses.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-border shadow-card">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-dark-secondary uppercase text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject & Message</th>
                  <th className="py-3 px-4">Admin Reply</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-dark">{t.ticket_id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-dark">{t.account_id}</div>
                      <div className="text-[10px] text-dark-secondary">+91 {t.mobile}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold uppercase text-[10px]">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-dark truncate">{t.subject}</div>
                      <div className="text-[11px] text-dark-secondary line-clamp-2">{t.message}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-dark-secondary">
                      {t.admin_reply || <span className="text-slate-400 italic">No reply yet</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-dark-secondary text-[11px]">
                      {formatDateTime(t.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          setReplyTicketItem(t);
                          setReplyText(t.admin_reply || "");
                        }}
                        className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark"
                      >
                        {t.admin_reply ? "Edit Reply" : "Reply"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-dark-secondary">
            No support tickets submitted yet.
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyTicketItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-dark">Reply to Ticket {replyTicketItem.ticket_id}</h3>
              <button onClick={() => setReplyTicketItem(null)} className="text-slate-400 hover:text-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="font-bold text-dark">{replyTicketItem.subject}</div>
              <p className="text-dark-secondary">{replyTicketItem.message}</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Administrator Official Reply</label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder=""
                  className="w-full p-3 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Set Status</label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-border rounded-xl"
                >
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="OPEN">KEEP OPEN</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyTicketItem(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark"
                >
                  {sending ? "Sending..." : "Submit Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

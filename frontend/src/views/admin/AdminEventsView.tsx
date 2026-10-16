import React, { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, X, Clock, Crown } from "lucide-react";
import { api } from "../../services/api";
import { EventItem } from "../../types";
import { useToast } from "../../context/ToastContext";
import { formatDateOnly } from "../../utils/date";

export const AdminEventsView: React.FC = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minVip, setMinVip] = useState(1);
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16)
  );
  const [terms, setTerms] = useState("Standard promotional terms apply.");
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getEvents("ALL");
      setEvents(res);
    } catch (err: any) {
      if (!isBackground) {
        showToast(err.message || "Failed to load events", "error");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(false);
    const interval = setInterval(() => {
      fetchEvents(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast("Please provide event title and description", "error");
      return;
    }

    try {
      setSubmitting(true);
      await api.createEvent({
        title: title.trim(),
        description: description.trim(),
        min_vip_level: minVip,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        terms: terms.trim(),
      });
      showToast("Event created successfully!", "success");
      setShowCreate(false);
      setTitle("");
      setDescription("");
      fetchEvents();
    } catch (err: any) {
      showToast(err.message || "Failed to create event", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteEvent(id);
      showToast("Event archived.", "info");
      fetchEvents();
    } catch (err: any) {
      showToast(err.message || "Failed to archive event", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-dark">Promotional Events & Campaigns</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time Feed (Auto-sync 10s)
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-0.5">
            Publish seasonal raffles, holiday rewards, and VIP member community announcements.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-border p-5 shadow-card animate-pulse space-y-3" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-dark text-sm">No Active Campaigns</h4>
          <p className="text-xs text-dark-secondary mt-1 max-w-sm mx-auto">
            All mock data has been purged. Click "Create Event" to launch authentic promotional campaigns for your members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-2xl border border-border p-5 shadow-card space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-dark">
                    {ev.status}
                  </span>
                  <span className="text-[10px] font-bold text-gold flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>VIP {ev.min_vip_level}+</span>
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-dark">{ev.title}</h4>
                <p className="text-xs text-dark-secondary mt-1">{ev.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-dark-secondary">
                <span>{formatDateOnly(ev.start_time)}</span>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                  title="Archive Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-dark">Create New Campaign Event</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark mb-1">Eligible Minimum VIP Level</label>
                <select
                  value={minVip}
                  onChange={(e) => setMinVip(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-border rounded-xl"
                >
                  {[1, 2, 3, 4, 5, 6].map((l) => (
                    <option key={l} value={l}>VIP {l}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark"
                >
                  {submitting ? "Publishing..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

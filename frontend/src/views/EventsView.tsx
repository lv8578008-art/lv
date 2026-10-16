import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Crown,
  Clock,
  Filter,
  Flame,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";
import { EventItem } from "../types";
import { useToast } from "../context/ToastContext";
import { formatDateOnly } from "../utils/date";

export const EventsView: React.FC = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedEventTerms, setSelectedEventTerms] = useState<EventItem | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents(filter);
      setEvents(res);
    } catch (err: any) {
      showToast(err.message || "Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  // Live countdown timer component
  const Countdown = ({ targetDate }: { targetDate: string }) => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) return null;
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);
      return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) {
      return <span className="text-xs font-bold text-slate-500">Event Concluded</span>;
    }

    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-dark">
        <div className="bg-slate-100 px-2 py-1 rounded-md text-center">
          <span className="font-mono">{timeLeft.days}</span>
          <span className="text-[9px] text-dark-secondary block -mt-0.5">d</span>
        </div>
        <span>:</span>
        <div className="bg-slate-100 px-2 py-1 rounded-md text-center">
          <span className="font-mono">{timeLeft.hours}</span>
          <span className="text-[9px] text-dark-secondary block -mt-0.5">h</span>
        </div>
        <span>:</span>
        <div className="bg-slate-100 px-2 py-1 rounded-md text-center">
          <span className="font-mono">{timeLeft.minutes}</span>
          <span className="text-[9px] text-dark-secondary block -mt-0.5">m</span>
        </div>
        <span>:</span>
        <div className="bg-slate-100 px-2 py-1 rounded-md text-center">
          <span className="font-mono text-primary">{timeLeft.seconds}</span>
          <span className="text-[9px] text-dark-secondary block -mt-0.5">s</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-mint text-primary font-bold text-xs">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>VIP Experience Calendar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
            Upcoming Member Events & Draws
          </h1>
          <p className="text-xs sm:text-sm text-dark-secondary max-w-2xl leading-relaxed">
            Exclusive seasonal banquets, high-roller weekend booster fests, prosperity mega draws, and elite partner networking conventions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          {["ALL", "UPCOMING", "LIVE", "COMPLETED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === f
                  ? "bg-white text-primary shadow-sm"
                  : "text-dark-secondary hover:text-dark"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => {
            const isLive = ev.status === "LIVE";
            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                {/* Event Card Top Banner */}
                <div
                  className={`p-5 text-white relative ${
                    isLive
                      ? "bg-gradient-to-r from-teal-700 to-emerald-800"
                      : "bg-gradient-to-r from-slate-800 to-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isLive
                          ? "bg-rose-500 text-white animate-pulse"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {isLive && <Flame className="w-3 h-3 text-white" />}
                      <span>{ev.status}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold bg-black/30 px-2 py-0.5 rounded-lg border border-white/10">
                      <Crown className="w-3.5 h-3.5" />
                      <span>VIP {ev.min_vip_level}+ Tier</span>
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base tracking-tight leading-snug">
                    {ev.title}
                  </h3>
                </div>

                {/* Event Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-dark-secondary leading-relaxed">
                    {ev.description}
                  </p>

                  {/* Countdown Timer */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-dark-secondary uppercase tracking-wider block">
                      {isLive ? "Ends In:" : "Commences In:"}
                    </span>
                    <Countdown targetDate={isLive ? ev.end_time : ev.start_time} />
                  </div>

                  {/* Dates & Actions */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-dark-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Schedule:</span>
                      </span>
                      <span className="font-medium text-dark">
                        {formatDateOnly(ev.start_time)} — {formatDateOnly(ev.end_time)}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedEventTerms(ev)}
                      className="w-full py-2.5 rounded-xl border border-primary/20 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-colors"
                    >
                      Event Terms & Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center text-dark-secondary border border-border shadow-card">
          <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-dark">No events match the selected filter</p>
          <p className="text-xs text-dark-secondary mt-1">Check back soon for new promotions and prize draws.</p>
        </div>
      )}

      {/* Event Terms Modal */}
      {selectedEventTerms && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 font-bold text-dark text-base">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span>{selectedEventTerms.title}</span>
              </div>
              <button
                onClick={() => setSelectedEventTerms(null)}
                className="text-slate-400 hover:text-dark p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-dark-secondary leading-relaxed max-h-80 overflow-y-auto">
              <p className="font-semibold text-dark">{selectedEventTerms.description}</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-dark">Eligibility:</div>
                <p>Members holding VIP Level {selectedEventTerms.min_vip_level} or higher during the promotion window.</p>
              </div>
              <div className="p-3 rounded-xl bg-primary-mint/50 border border-teal-100 space-y-1">
                <div className="font-bold text-primary">Rules & Terms:</div>
                <p>{selectedEventTerms.terms}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedEventTerms(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

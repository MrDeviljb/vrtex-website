"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Plus, CheckCircle2, Clock, Send, AlertCircle, Loader2 } from "lucide-react";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Registration");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Selected Ticket for Chat/Replies
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support");
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.tickets?.length > 0 && !selectedTicket) {
          setSelectedTicket(data.tickets[0]);
        }
      }
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback("Ticket submitted successfully!");
        setSubject("");
        setMessage("");
        setIsCreating(false);
        fetchTickets();
      } else {
        setFeedback(data.message || "Failed to submit ticket. Please log in first.");
      }
    } catch {
      setFeedback("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REPLY",
          ticketId: selectedTicket.id,
          message: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplyText("");
        // Refresh ticket
        const ticketRes = await fetch("/api/support");
        const ticketData = await ticketRes.json();
        if (ticketData.success) {
          setTickets(ticketData.tickets);
          const updated = ticketData.tickets.find((t: any) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch {
      console.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green block mb-1">
            DISPUTES & SUPPORT PORTAL
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
            PLAYER SUPPORT TICKETS
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            File dispute reports, inquire about prize payouts, or resolve BGMI UID verification questions.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-6 py-3 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-xs uppercase tracking-wider transition shadow-neon-green flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "View My Tickets" : "Open New Ticket"}</span>
        </button>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-xl bg-surface-light border border-neon-green/40 text-xs text-neon-green flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* CREATE TICKET FORM */}
      {isCreating ? (
        <div className="max-w-2xl mx-auto bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h3 className="font-display font-bold text-2xl text-white mb-2">Submit a Ticket / Dispute</h3>
          <p className="text-xs text-gray-400 mb-6">Our referee and finance team respond within 15-30 minutes.</p>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">CATEGORY</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-white outline-none focus:border-neon-green"
              >
                <option value="Registration">Registration Issue</option>
                <option value="Room">Room Access / Password Issue</option>
                <option value="Payment">Payment & Entry Fee</option>
                <option value="Result">Match Result & Point Dispute</option>
                <option value="Other">General Query / Account Help</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">SUBJECT</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your query or dispute..."
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-white outline-none focus:border-neon-green"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">DETAILED MESSAGE</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include tournament name, match number, team name, and specific dispute description..."
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-white outline-none focus:border-neon-green"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-6 py-2.5 rounded-xl border border-border text-xs text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* TICKET LIST & CHAT VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Ticket List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-display font-bold text-base text-gray-400 uppercase tracking-wider mb-2">
              Your Tickets ({tickets.length})
            </h3>

            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-6 bg-surface rounded-2xl border border-border text-center text-xs text-gray-400">
                No tickets opened yet. Click &apos;Open New Ticket&apos; above if you need assistance.
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    selectedTicket?.id === t.id
                      ? "bg-surface-light border-neon-green/50 shadow-neon-green"
                      : "bg-surface border-border hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-gray-300">
                      {t.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        t.status === "OPEN"
                          ? "bg-blue-500/20 text-blue-400"
                          : t.status === "RESOLVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-white text-sm line-clamp-1">{t.subject}</h4>
                  <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{t.message}</p>
                  <span className="text-[9px] text-gray-500 font-mono block mt-2">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Selected Ticket Conversation */}
          <div className="lg:col-span-8 bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between min-h-[450px]">
            {selectedTicket ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-light text-neon-green border border-neon-green/30">
                          {selectedTicket.category}
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          Ticket #{selectedTicket.id.slice(-6)}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-xl text-white mt-1">
                        {selectedTicket.subject}
                      </h3>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-md uppercase ${
                        selectedTicket.status === "OPEN"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                          : selectedTicket.status === "RESOLVED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>

                  {/* Initial Message */}
                  <div className="p-4 rounded-xl bg-surface-light border border-border mb-4 text-xs text-gray-200 leading-relaxed">
                    <span className="text-[10px] font-mono text-gray-400 block mb-1">
                      Original Query by {selectedTicket.user?.username || "You"}:
                    </span>
                    {selectedTicket.message}
                  </div>

                  {/* Conversation Replies */}
                  <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
                    {selectedTicket.replies?.map((r: any) => (
                      <div
                        key={r.id}
                        className={`p-3.5 rounded-xl text-xs max-w-md ${
                          r.isAdmin
                            ? "bg-neon-green/10 border border-neon-green/30 text-white ml-auto"
                            : "bg-surface-light border border-border text-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-neon-green text-[11px]">
                            {r.isAdmin ? "🛡️ Official DevX eSports Referee" : r.sender?.username || "You"}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono">
                            {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{r.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Box */}
                <form onSubmit={handleSendReply} className="pt-4 border-t border-border flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message reply..."
                    className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neon-green"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-3 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs text-gray-400">
                Select a ticket from the left column to view replies.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Clock, XCircle, ArrowDown, History, ChevronDown, ChevronUp, Loader2, AlertCircle,
} from "lucide-react";

export default function AdminSlotsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentSlug, setSelectedTournamentSlug] = useState<string>("");
  const [slotData, setSlotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Change slot modal
  const [changingRegistration, setChangingRegistration] = useState<any | null>(null);
  const [newSlotNumber, setNewSlotNumber] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Cancel registration modal
  const [cancellingReg, setCancellingReg] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Slot history
  const [historyData, setHistoryData] = useState<Record<number, any[]>>({});
  const [expandedHistory, setExpandedHistory] = useState<Set<number>>(new Set());
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentSlug) {
      fetchSlots(selectedTournamentSlug);
      setHistoryData({});
      setExpandedHistory(new Set());
    }
  }, [selectedTournamentSlug]);

  async function fetchTournaments() {
    try {
      const res = await fetch("/api/tournaments");
      const json = await res.json();
      if (json.success && json.tournaments.length > 0) {
        setTournaments(json.tournaments);
        setSelectedTournamentSlug(json.tournaments[0].slug);
      }
    } catch {}
  }

  async function fetchSlots(slug: string) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/tournaments/${slug}/slots`);
      const json = await res.json();
      if (json.success) {
        setSlotData(json.data);
      } else {
        setError(json.message || "Failed to load slots.");
      }
    } catch {
      setError("Network error fetching slot allocation.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSlotHistory(slotNumber: number) {
    if (!slotData) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/admin/slots/history?tournamentId=${slotData.tournamentId}&slotNumber=${slotNumber}`
      );
      const json = await res.json();
      if (json.success) {
        setHistoryData((prev) => ({ ...prev, [slotNumber]: json.history }));
      }
    } catch {}
    setHistoryLoading(false);
  }

  const toggleHistory = async (slotNumber: number) => {
    const next = new Set(expandedHistory);
    if (next.has(slotNumber)) {
      next.delete(slotNumber);
    } else {
      next.add(slotNumber);
      if (!historyData[slotNumber]) {
        await fetchSlotHistory(slotNumber);
      }
    }
    setExpandedHistory(next);
  };

  const handleChangeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingRegistration || !newSlotNumber) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/slots/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: changingRegistration.registrationId || changingRegistration.id,
          newSlotNumber,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setChangingRegistration(null);
        await fetchSlots(selectedTournamentSlug);
      } else {
        alert(json.message || "Failed to change slot.");
      }
    } catch {
      alert("Error changing slot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingReg) return;
    setCancelSubmitting(true);
    setCancelError("");
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: cancellingReg.registrationId || cancellingReg.id,
          status: "CANCELLED",
          reason: cancelReason || "Cancelled by admin",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCancellingReg(null);
        setCancelReason("");
        await fetchSlots(selectedTournamentSlug);
      } else {
        setCancelError(json.message || "Failed to cancel registration.");
      }
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleMoveToWaitlist = async (slot: any) => {
    if (!confirm(`Move "${slot.teamName}" to waitlist and release Slot ${slot.slotLabel}?`)) return;
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: slot.registrationId,
          status: "WAITLIST",
          reason: "Moved to waitlist by admin",
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchSlots(selectedTournamentSlug);
      } else {
        alert(json.message || "Failed to move to waitlist.");
      }
    } catch {
      alert("Error moving to waitlist.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">
            Slot Allocation Management
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Assign, swap, cancel, or move teams to waitlist. Every change is audit-logged.
          </p>
        </div>
        {tournaments.length > 0 && (
          <select
            value={selectedTournamentSlug}
            onChange={(e) => setSelectedTournamentSlug(e.target.value)}
            className="bg-[#121827] border border-cyan-500/40 text-cyan-300 font-mono text-xs px-4 py-2 rounded-xl focus:outline-none"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.title} ({t.maxTeams} Slots)
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-sm">
          Loading slot matrix...
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-500/40 p-4 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      ) : !slotData ? (
        <div className="bg-[#121827] border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
          No tournament selected.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="bg-[#121827] border border-gray-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <span className="text-gray-400 block">Tournament</span>
              <span className="text-white font-bold">{slotData.tournamentTitle}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Active Slots</span>
              <span className="text-cyan-400 font-bold text-base">
                {slotData.activeSlots ?? slotData.occupiedSlots} / {slotData.totalSlots}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Approved</span>
              <span className="text-emerald-400 font-bold text-base">{slotData.occupiedSlots}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Waitlist</span>
              <span className="text-purple-300 font-bold text-base">{slotData.waitlistCount ?? 0}</span>
            </div>
          </div>

          {/* Slot Table */}
          <div className="bg-[#121827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0B0E17] text-gray-400 uppercase tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-4">Slot</th>
                    <th className="p-4">Team</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {slotData.slots.map((slot: any) => (
                    <>
                      <tr key={slot.slotNumber} className="hover:bg-cyan-950/20 transition">
                        <td className="p-4 text-cyan-400 font-bold text-sm">{slot.slotLabel}</td>
                        <td className="p-4 text-white font-sans font-bold">
                          {slot.isApproved && "🔒 "}{slot.teamName}
                          {slot.teamTag && (
                            <span className="text-gray-500 font-normal ml-1">[{slot.teamTag}]</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                              slot.isApproved
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : slot.isOccupied
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-gray-800 text-gray-500 border-gray-700"
                            }`}
                          >
                            {slot.displayStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {/* History toggle */}
                            <button
                              onClick={() => toggleHistory(slot.slotNumber)}
                              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1"
                              title="Slot History"
                            >
                              <History className="w-3 h-3" />
                              History
                              {expandedHistory.has(slot.slotNumber) ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {slot.isOccupied && (
                              <>
                                <button
                                  onClick={() => {
                                    setChangingRegistration(slot);
                                    setNewSlotNumber(slot.slotNumber);
                                  }}
                                  className="bg-cyan-600 hover:bg-cyan-500 text-black px-2.5 py-1.5 rounded text-[11px] font-extrabold"
                                >
                                  CHANGE SLOT
                                </button>
                                <button
                                  onClick={() => handleMoveToWaitlist(slot)}
                                  className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1"
                                >
                                  <ArrowDown className="w-3 h-3" /> WAITLIST
                                </button>
                                <button
                                  onClick={() => {
                                    setCancellingReg(slot);
                                    setCancelReason("");
                                    setCancelError("");
                                  }}
                                  className="bg-red-700/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" /> CANCEL
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Slot History Accordion */}
                      {expandedHistory.has(slot.slotNumber) && (
                        <tr key={`history-${slot.slotNumber}`} className="bg-[#0B0E17]">
                          <td colSpan={4} className="p-4">
                            <div className="space-y-2">
                              <p className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                                {slot.slotLabel} History
                              </p>
                              {historyLoading ? (
                                <div className="text-gray-500 text-xs flex items-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                                </div>
                              ) : historyData[slot.slotNumber]?.length > 0 ? (
                                historyData[slot.slotNumber].map((h: any) => (
                                  <div
                                    key={h.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 p-2.5 bg-black/40 border border-gray-800/60 rounded-lg text-[11px] font-mono"
                                  >
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      h.action === "CANCELLED" || h.action === "ADMIN_OVERRIDE"
                                        ? "text-red-400 border-red-500/30 bg-red-500/10"
                                        : h.action === "REASSIGNED"
                                        ? "text-purple-300 border-purple-500/30 bg-purple-500/10"
                                        : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                    }`}>
                                      {h.action}
                                    </span>
                                    <span className="text-gray-500">
                                      {h.previousTeamName} → {h.newTeamName}
                                    </span>
                                    <span className="text-gray-600">
                                      by {h.changedByName || "SYSTEM"}
                                    </span>
                                    <span className="text-gray-600 sm:ml-auto">
                                      {new Date(h.createdAt).toLocaleString("en-IN", {
                                        dateStyle: "short", timeStyle: "short",
                                      })}
                                    </span>
                                    {h.reason && (
                                      <span className="text-gray-500 italic">{h.reason}</span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-600 text-[11px]">No history records for this slot.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Waitlist Section */}
          {slotData.waitlistCount > 0 && (
            <div className="bg-[#121827] border border-purple-500/30 rounded-2xl overflow-hidden">
              <div className="bg-purple-950/30 px-6 py-3 border-b border-purple-500/20 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-300" />
                <h3 className="text-sm font-bold text-purple-300 font-mono uppercase tracking-wider">
                  Waitlist — {slotData.waitlistCount} Team{slotData.waitlistCount !== 1 ? "s" : ""}
                </h3>
              </div>
              <table className="w-full text-xs font-mono">
                <thead className="bg-black/30 text-gray-400 uppercase tracking-wider border-b border-purple-500/10">
                  <tr>
                    <th className="p-3.5">Position</th>
                    <th className="p-3.5">Team</th>
                    <th className="p-3.5">Tag</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/30">
                  {slotData.waitlistTeams.map((wt: any) => (
                    <tr key={wt.registrationId} className="hover:bg-purple-950/20 transition">
                      <td className="p-3.5 text-purple-300 font-bold">#{wt.waitlistPosition}</td>
                      <td className="p-3.5 text-white font-sans font-bold">{wt.teamName}</td>
                      <td className="p-3.5 text-gray-400">[{wt.teamTag}]</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          WAITLIST
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setCancellingReg({ ...wt, slotLabel: "Waitlist" });
                            setCancelReason("");
                            setCancelError("");
                          }}
                          className="bg-red-700/80 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 ml-auto"
                        >
                          <XCircle className="w-3 h-3" /> CANCEL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Change Slot Modal */}
      {changingRegistration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-3 font-mono">
              Reassign Team Slot Number
            </h3>
            <div className="text-xs font-mono text-gray-300 space-y-1 bg-black/50 p-3 rounded-xl">
              <p>Team: <span className="text-cyan-400 font-bold">{changingRegistration.teamName}</span></p>
              <p>Current Slot: <span className="text-amber-400 font-bold">{changingRegistration.slotLabel}</span></p>
            </div>
            <form onSubmit={handleChangeSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 uppercase mb-2">
                  Select New Slot Number (1 to {slotData.totalSlots})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={slotData.totalSlots}
                  value={newSlotNumber}
                  onChange={(e) => setNewSlotNumber(Number(e.target.value))}
                  className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setChangingRegistration(null)}
                  className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-xs font-bold font-mono"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold py-2.5 rounded-xl text-xs uppercase font-mono"
                >
                  {submitting ? "SAVING..." : "REASSIGN SLOT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Cancel Registration Modal */}
      {cancellingReg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-red-500/30 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-3 font-mono flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" /> Cancel Registration
            </h3>
            <div className="text-xs font-mono text-gray-300 space-y-1 bg-black/50 p-3 rounded-xl">
              <p>Team: <span className="text-white font-bold">{cancellingReg.teamName}</span></p>
              <p>Slot: <span className="text-amber-400 font-bold">{cancellingReg.slotLabel}</span></p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
              ⚠ This will cancel the registration and release the slot. The next waitlisted team will be auto-assigned if available.
            </div>
            <form onSubmit={handleCancelReg} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 uppercase mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="Reason for cancellation..."
                  className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-red-400 resize-none"
                />
              </div>
              {cancelError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" /> {cancelError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setCancellingReg(null); setCancelError(""); }}
                  className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-xs font-bold font-mono"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase font-mono flex items-center justify-center gap-2"
                >
                  {cancelSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  {cancelSubmitting ? "CANCELLING..." : "CONFIRM CANCEL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

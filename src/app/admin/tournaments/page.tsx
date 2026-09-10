"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";

const TOURNAMENT_STATUSES = [
  { value: "REGISTRATION_OPEN", label: "Open (Reg Open)", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:border-emerald-400" },
  { value: "REGISTRATION_CLOSED", label: "Closed (Reg Closed)", color: "bg-amber-500/20 text-amber-400 border-amber-500/40 hover:border-amber-400" },
  { value: "UPCOMING", label: "Upcoming", color: "bg-blue-500/20 text-blue-400 border-blue-500/40 hover:border-blue-400" },
  { value: "ROOM_RELEASED", label: "Room Released", color: "bg-purple-500/20 text-purple-400 border-purple-500/40 hover:border-purple-400" },
  { value: "LIVE", label: "Live (In Progress)", color: "bg-red-500/20 text-red-400 border-red-500/40 hover:border-red-400" },
  { value: "COMPLETED", label: "Completed", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:border-cyan-400" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-gray-500/20 text-gray-400 border-gray-500/40 hover:border-gray-400" },
];

function getStatusBadgeStyle(status: string) {
  const match = TOURNAMENT_STATUSES.find((s) => s.value === status);
  return match ? match.color : "bg-surface-light text-neon-green border-neon-green/30";
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Status updating indicator
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ slug: string; text: string; isError?: boolean } | null>(null);

  // Edit Modal State
  const [editingTournament, setEditingTournament] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Create Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [gameMode, setGameMode] = useState("Squad");
  const [perspective, setPerspective] = useState("TPP");
  const [maxTeams, setMaxTeams] = useState(25);
  const [maxRosterMain, setMaxRosterMain] = useState(4);
  const [maxRosterSub, setMaxRosterSub] = useState(1);
  const [entryFee, setEntryFee] = useState(0);
  const [prizePool, setPrizePool] = useState(10000);
  const [startDate, setStartDate] = useState("");
  const [isScrim, setIsScrim] = useState(false);
  const [status, setStatus] = useState("REGISTRATION_OPEN");
  const [rulesText, setRulesText] = useState("Standard BGMI Esports rules apply.");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      if (data.success) {
        setTournaments(data.tournaments || []);
      }
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // Quick inline status change handler
  const handleStatusChange = async (tourneySlug: string, newStatus: string) => {
    setUpdatingSlug(tourneySlug);
    setStatusFeedback(null);

    try {
      const res = await fetch(`/api/tournaments/${tourneySlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTournaments((prev) =>
          prev.map((t) => (t.slug === tourneySlug ? { ...t, status: newStatus } : t))
        );
        setStatusFeedback({ slug: tourneySlug, text: `✓ Updated to ${newStatus}` });
        setTimeout(() => setStatusFeedback(null), 3000);
      } else {
        setStatusFeedback({
          slug: tourneySlug,
          text: data.message || "Failed to update status",
          isError: true,
        });
      }
    } catch {
      setStatusFeedback({
        slug: tourneySlug,
        text: "Network error updating status",
        isError: true,
      });
    } finally {
      setUpdatingSlug(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          gameMode,
          perspective,
          maxTeams: Number(maxTeams),
          maxRosterMain: Number(maxRosterMain),
          maxRosterSub: Number(maxRosterSub),
          entryFee: Number(entryFee),
          prizePool: Number(prizePool),
          startDate: new Date(startDate).toISOString(),
          isScrim,
          status,
          rulesText,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsCreating(false);
        setTitle("");
        setSlug("");
        setDescription("");
        fetchTournaments();
      } else {
        setFormError(data.message || "Failed to create tournament.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (t: any) => {
    setEditingTournament({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description || "",
      status: t.status,
      gameMode: t.gameMode,
      perspective: t.perspective,
      maxTeams: t.maxTeams,
      maxRosterMain: t.maxRosterMain || 4,
      maxRosterSub: t.maxRosterSub || 1,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      startDate: t.startDate ? new Date(t.startDate).toISOString().slice(0, 16) : "",
      rulesText: t.rulesText || "",
      isScrim: t.isScrim,
    });
    setEditError("");
  };

  // Submit Edit Modal Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch(`/api/tournaments/${editingTournament.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingTournament.title,
          description: editingTournament.description,
          status: editingTournament.status,
          gameMode: editingTournament.gameMode,
          perspective: editingTournament.perspective,
          maxTeams: Number(editingTournament.maxTeams),
          maxRosterMain: Number(editingTournament.maxRosterMain),
          maxRosterSub: Number(editingTournament.maxRosterSub),
          entryFee: Number(editingTournament.entryFee),
          prizePool: Number(editingTournament.prizePool),
          startDate: editingTournament.startDate ? new Date(editingTournament.startDate).toISOString() : undefined,
          rulesText: editingTournament.rulesText,
          isScrim: editingTournament.isScrim,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingTournament(null);
        fetchTournaments();
      } else {
        setEditError(data.message || "Failed to save changes.");
      }
    } catch {
      setEditError("Network error while saving.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (tourneySlug: string) => {
    if (!confirm("Are you sure you want to delete this tournament? This will remove all registrations and room data.")) return;
    try {
      const res = await fetch(`/api/tournaments/${tourneySlug}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchTournaments();
    } catch {
      alert("Failed to delete tournament.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold block mb-1">
            EVENT ORCHESTRATION
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
            TOURNAMENT & SCRIM MANAGEMENT
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Create, schedule, open/close registrations, update tournament status, and configure roster rules.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-6 py-3 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-xs uppercase tracking-wider transition shadow-neon-green flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Close Form" : "Create New Event"}</span>
        </button>
      </div>

      {/* CREATE EVENT FORM */}
      {isCreating && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-neon-green/40 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-display font-bold text-xl text-white">Create Official Tournament / Scrim</h3>
              <p className="text-xs text-gray-400">Configure parameters, status, and team capacity.</p>
            </div>
            <span className="text-xs font-mono text-neon-green px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/30">
              NEW EVENT
            </span>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-accent-red/40 text-xs text-red-300">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">EVENT TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                    }
                  }}
                  placeholder="e.g. BGMI Masters Season 4"
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">URL SLUG</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="bgmi-masters-season-4"
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">DESCRIPTION</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full event description and format..."
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">GAME MODE</label>
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
                >
                  <option value="Squad">Squad</option>
                  <option value="Duo">Duo</option>
                  <option value="Solo">Solo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">PERSPECTIVE</label>
                <select
                  value={perspective}
                  onChange={(e) => setPerspective(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
                >
                  <option value="TPP">TPP</option>
                  <option value="FPP">FPP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">ENTRY FEE (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">PRIZE POOL (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={prizePool}
                  onChange={(e) => setPrizePool(Number(e.target.value))}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">MAX TEAMS / SLOTS</label>
                <input
                  type="number"
                  min={2}
                  max={25}
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(Number(e.target.value))}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">MAIN ROSTER LIMIT</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={maxRosterMain}
                  onChange={(e) => setMaxRosterMain(Number(e.target.value))}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">SUBSTITUTE LIMIT</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={maxRosterSub}
                  onChange={(e) => setMaxRosterSub(Number(e.target.value))}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">INITIAL STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
                >
                  {TOURNAMENT_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">START DATE & TIME</label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">EVENT TYPE</label>
                <select
                  value={isScrim ? "true" : "false"}
                  onChange={(e) => setIsScrim(e.target.value === "true")}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
                >
                  <option value="false">Tournament</option>
                  <option value="true">Daily Scrim</option>
                </select>
              </div>
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
                disabled={formLoading}
                className="px-8 py-2.5 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
              >
                {formLoading ? "Publishing..." : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tournaments List Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-light/30">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent-gold" />
            <span className="font-display font-bold text-sm text-white">
              All Tournaments & Scrims ({tournaments.length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-gray-400">
            Click status dropdown to instantly open, close, or update status
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent-gold animate-spin mb-3" />
            <p className="text-xs font-mono text-gray-400">Loading tournaments...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border text-gray-400 font-mono uppercase">
                <tr>
                  <th className="p-4">Event Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Prize Pool</th>
                  <th className="p-4">Teams</th>
                  <th className="p-4">Start Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-light/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-white font-display text-sm">{t.title}</div>
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5">/{t.slug}</div>
                    </td>
                    <td className="p-4 font-mono text-gray-300">{t.isScrim ? "SCRIM" : "TOURNAMENT"}</td>
                    <td className="p-4 text-gray-300">{t.gameMode} ({t.perspective})</td>
                    <td className="p-4 font-mono font-bold text-neon-green">₹{t.prizePool.toLocaleString()}</td>
                    <td className="p-4 font-mono text-gray-300">
                      {t._count?.registrations || 0} / {t.maxTeams}
                    </td>
                    <td className="p-4 font-mono text-gray-400">{new Date(t.startDate).toLocaleDateString()}</td>

                    {/* STATUS COLUMN — Interactive Dropdown */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="relative inline-flex items-center">
                          <select
                            value={t.status}
                            disabled={updatingSlug === t.slug}
                            onChange={(e) => handleStatusChange(t.slug, e.target.value)}
                            title="Click to change status"
                            className={`appearance-none text-[10px] font-mono font-bold pl-2.5 pr-7 py-1 rounded-lg border cursor-pointer outline-none transition uppercase tracking-wider ${getStatusBadgeStyle(
                              t.status
                            )} disabled:opacity-50`}
                          >
                            {TOURNAMENT_STATUSES.map((st) => (
                              <option
                                key={st.value}
                                value={st.value}
                                className="bg-[#0b101b] text-white font-sans text-xs py-1"
                              >
                                {st.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2 flex items-center text-gray-400">
                            {updatingSlug === t.slug ? (
                              <Loader2 className="w-3 h-3 animate-spin text-accent-gold" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </div>

                        {/* Inline status feedback */}
                        {statusFeedback && statusFeedback.slug === t.slug && (
                          <span
                            className={`text-[10px] font-mono font-semibold ${
                              statusFeedback.isError ? "text-accent-red" : "text-neon-green"
                            }`}
                          >
                            {statusFeedback.text}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg bg-surface-light hover:bg-border text-cyan-400 hover:text-white transition"
                        title="Edit Tournament Details & Status"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.slug)}
                        className="p-1.5 rounded-lg bg-surface-light hover:bg-border text-accent-red transition"
                        title="Delete Tournament"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT TOURNAMENT MODAL */}
      {editingTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0e1422] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 block mb-1">
                  ADMIN OVERRIDE
                </span>
                <h3 className="font-display font-black text-2xl text-white">Edit Tournament & Status</h3>
              </div>
              <button
                onClick={() => setEditingTournament(null)}
                className="p-2 rounded-xl bg-surface-light hover:bg-border text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-accent-red/40 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Title & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">EVENT TITLE</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.title}
                    onChange={(e) =>
                      setEditingTournament({ ...editingTournament, title: e.target.value })
                    }
                    className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">STATUS (OPEN / CLOSED / ETC.)</label>
                  <select
                    value={editingTournament.status}
                    onChange={(e) =>
                      setEditingTournament({ ...editingTournament, status: e.target.value })
                    }
                    className="w-full bg-surface-light border border-cyan-500/40 rounded-xl p-3 text-xs text-white font-mono font-bold outline-none focus:border-cyan-400"
                  >
                    {TOURNAMENT_STATUSES.map((st) => (
                      <option key={st.value} value={st.value} className="bg-[#121827] text-white">
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">DESCRIPTION</label>
                <textarea
                  rows={2}
                  value={editingTournament.description}
                  onChange={(e) =>
                    setEditingTournament({ ...editingTournament, description: e.target.value })
                  }
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              {/* Numerical Limits */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">MAX TEAMS</label>
                  <input
                    type="number"
                    min={2}
                    max={25}
                    value={editingTournament.maxTeams}
                    onChange={(e) =>
                      setEditingTournament({ ...editingTournament, maxTeams: Number(e.target.value) })
                    }
                    className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">MAIN ROSTER</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={editingTournament.maxRosterMain}
                    onChange={(e) =>
                      setEditingTournament({ ...editingTournament, maxRosterMain: Number(e.target.value) })
                    }
                    className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">SUB LIMIT</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={editingTournament.maxRosterSub}
                    onChange={(e) =>
                      setEditingTournament({ ...editingTournament, maxRosterSub: Number(e.target.value) })
                    }
                    className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">PRIZE POOL (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingTournament.prizePool}
                    onChange={(e) =>
                      setEditingTournament({ ...editingTournament, prizePool: Number(e.target.value) })
                    }
                    className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Start date & entry fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">START DATE & TIME</label>
                  <input
                    type="datetime-local"
                    value={editingTournament.startDate}
                    onChange={(e) =>
                      setEditingTournament({ ...editingTournament, startDate: e.target.value })
                    }
                    className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">ENTRY FEE (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingTournament.entryFee}
                    onChange={(e) =>
                      setEditingTournament({ ...editingTournament, entryFee: Number(e.target.value) })
                    }
                    className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingTournament(null)}
                  className="px-6 py-2.5 rounded-xl border border-border text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-8 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{editLoading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

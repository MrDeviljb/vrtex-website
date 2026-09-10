"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Edit2,
  Save,
} from "lucide-react";

export default function AdminRoomsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  // Edit Room Modal Form State
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [releaseTime, setReleaseTime] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Confirmation Modal for Immediate Release
  const [confirmReleaseMatch, setConfirmReleaseMatch] = useState<any>(null);

  useEffect(() => {
    fetchMatchesAndRooms();
  }, []);

  const fetchMatchesAndRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      if (data.success) {
        // Fetch full match details for each tournament
        const fullTourneys: any[] = [];
        for (const t of data.tournaments) {
          const detailRes = await fetch(`/api/tournaments/${t.slug}`);
          const detailData = await detailRes.json();
          if (detailData.success) {
            fullTourneys.push(detailData.tournament);
          }
        }
        setTournaments(fullTourneys);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (match: any) => {
    setSelectedMatch(match);
    setRoomId(match.room?.roomId || "");
    setRoomPassword(match.room?.roomPassword || "");
    const existingDate = match.room?.releaseTime
      ? new Date(match.room.releaseTime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);
    setReleaseTime(existingDate);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPSERT",
          roomId,
          roomPassword,
          releaseTime: new Date(releaseTime).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback("Room credentials updated successfully!");
        setTimeout(() => setFeedback(""), 3000);
        setSelectedMatch(null);
        fetchMatchesAndRooms();
      }
    } catch {
      alert("Error saving room.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseNow = async () => {
    if (!confirmReleaseMatch) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/matches/${confirmReleaseMatch.id}/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RELEASE_NOW" }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Room for Match #${confirmReleaseMatch.matchNumber} released to all registered players!`);
        setTimeout(() => setFeedback(""), 3000);
        setConfirmReleaseMatch(null);
        fetchMatchesAndRooms();
      }
    } catch {
      alert("Error releasing room.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleHide = async (matchId: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_HIDE" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMatchesAndRooms();
      }
    } catch {
      alert("Error toggling room visibility.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold block mb-1">
          CUSTOM LOBBY CONTROL
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          ROOM MANAGEMENT PANEL
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Configure custom Room IDs, passwords, and automated release times. Server time strictly gatekeeps player access.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-neon-green text-xs text-neon-green flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-gold animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">Loading custom lobbies...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {tournaments.map((t) => (
            <div key={t.id} className="p-6 rounded-2xl bg-surface border border-border shadow-card-glow space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-display font-bold text-xl text-white">{t.title}</h3>
                  <span className="text-[11px] font-mono text-gray-400">
                    Status: {t.status} | Mode: {t.gameMode}
                  </span>
                </div>
              </div>

              {/* Matches & Rooms Table */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-light border-b border-border text-gray-400 font-mono uppercase">
                    <tr>
                      <th className="p-3.5">Match #</th>
                      <th className="p-3.5">Map</th>
                      <th className="p-3.5">Room ID</th>
                      <th className="p-3.5">Password</th>
                      <th className="p-3.5">Release Time</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {t.matches?.map((m: any) => {
                      const hasRoom = !!m.room;
                      const isTimePassed = hasRoom && new Date(m.room.releaseTime) <= new Date();
                      const isReleased = hasRoom && (m.room.isReleased || isTimePassed);
                      const isHidden = hasRoom && m.room.isManuallyHidden;

                      return (
                        <tr key={m.id} className="hover:bg-surface-light/40 transition">
                          <td className="p-3.5 font-bold font-mono text-white">Match #{m.matchNumber}</td>
                          <td className="p-3.5 font-semibold text-gray-200">{m.map}</td>
                          <td className="p-3.5 font-mono font-bold text-white">
                            {hasRoom ? m.room.roomId : <span className="text-gray-500">Not set</span>}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-neon-green">
                            {hasRoom ? m.room.roomPassword : <span className="text-gray-500">Not set</span>}
                          </td>
                          <td className="p-3.5 font-mono text-gray-300">
                            {hasRoom ? new Date(m.room.releaseTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                          </td>
                          <td className="p-3.5">
                            {isHidden ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                HIDDEN
                              </span>
                            ) : isReleased ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                RELEASED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                LOCKED
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="px-2.5 py-1 rounded-lg bg-surface-light hover:bg-border text-gray-200 font-mono text-[11px] border border-border"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => setConfirmReleaseMatch(m)}
                              disabled={isReleased && !isHidden}
                              className="px-2.5 py-1 rounded-lg bg-neon-green/15 hover:bg-neon-green text-neon-green hover:text-black font-mono font-bold text-[11px] border border-neon-green/30 disabled:opacity-30"
                            >
                              RELEASE NOW
                            </button>
                            <button
                              onClick={() => handleToggleHide(m.id)}
                              className="px-2.5 py-1 rounded-lg bg-surface-light hover:bg-border text-gray-400 hover:text-white font-mono text-[11px] border border-border"
                            >
                              {isHidden ? "UNHIDE" : "HIDE"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-display font-bold text-xl text-white mb-1">
              Edit Room: Match #{selectedMatch.matchNumber}
            </h3>
            <p className="text-xs text-gray-400 mb-4">Set credentials and scheduled release time.</p>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">ROOM ID</label>
                <input
                  type="text"
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="e.g. 73829104"
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">ROOM PASSWORD</label>
                <input
                  type="text"
                  required
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="e.g. 12345"
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">RELEASE DATE & TIME</label>
                <input
                  type="datetime-local"
                  required
                  value={releaseTime}
                  onChange={(e) => setReleaseTime(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Room Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR IMMEDIATE RELEASE */}
      {confirmReleaseMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-neon-green rounded-2xl max-w-md w-full p-6 shadow-neon-glow">
            <div className="w-12 h-12 rounded-xl bg-neon-green/20 text-neon-green flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-white text-center mb-2">
              Confirm Immediate Room Release
            </h3>
            <p className="text-xs text-gray-300 text-center leading-relaxed mb-6">
              &quot;Are you sure you want to release this room to all eligible participants?&quot;
              <br />
              <span className="text-neon-green font-semibold">
                Match #{confirmReleaseMatch.matchNumber} ({confirmReleaseMatch.map})
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReleaseMatch(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseNow}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider transition shadow-neon-green disabled:opacity-50"
              >
                {actionLoading ? "Releasing..." : "Yes, Release Room Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

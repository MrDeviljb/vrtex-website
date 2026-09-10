"use client";

import React, { useState, useEffect } from "react";
import { Award, Trophy, Plus, Save, CheckCircle2, Loader2 } from "lucide-react";

export default function AdminMatchesPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [teamResults, setTeamResults] = useState<{ [teamId: string]: { placement: number; kills: number } }>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Create match state
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [selectedTourneyId, setSelectedTourneyId] = useState("");
  const [matchNumber, setMatchNumber] = useState(1);
  const [map, setMap] = useState("Erangel");
  const [startTime, setStartTime] = useState("");

  useEffect(() => {
    fetchTournamentsWithMatches();
  }, []);

  const fetchTournamentsWithMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      if (data.success) {
        const list: any[] = [];
        for (const t of data.tournaments) {
          const detailRes = await fetch(`/api/tournaments/${t.slug}`);
          const detailData = await detailRes.json();
          if (detailData.success) list.push(detailData.tournament);
        }
        setTournaments(list);
        if (list.length > 0 && !selectedTourneyId) setSelectedTourneyId(list[0].id);
      }
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (match: any, tournament: any) => {
    setSelectedMatch({ ...match, tournament });
    const initial: any = {};
    for (const reg of tournament.registrations) {
      const existing = match.results?.find((r: any) => r.teamId === reg.teamId);
      initial[reg.teamId] = {
        placement: existing?.placement || 1,
        kills: existing?.kills || 0,
      };
    }
    setTeamResults(initial);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    setSaveLoading(true);
    try {
      const payload = Object.entries(teamResults).map(([teamId, data]) => ({
        teamId,
        placement: Number(data.placement),
        kills: Number(data.kills),
      }));

      const res = await fetch(`/api/matches/${selectedMatch.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamResults: payload }),
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        setFeedback("Match results saved and points calculated!");
        setTimeout(() => setFeedback(""), 3000);
        setSelectedMatch(null);
        fetchTournamentsWithMatches();
      } else {
        alert(resData.message || "Failed to save results.");
      }
    } catch {
      alert("Network error saving results.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: selectedTourneyId,
          matchNumber,
          map,
          startTime: new Date(startTime).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreatingMatch(false);
        fetchTournamentsWithMatches();
      }
    } catch {
      alert("Failed to create match.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold block mb-1">
            OFFICIAL REFEREE SCORING
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
            MATCH & RESULT MANAGEMENT
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Input match placements and kill statistics. Points are evaluated against tournament scoring rules automatically.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingMatch(!isCreatingMatch)}
          className="px-6 py-3 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-xs uppercase tracking-wider transition shadow-neon-green flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreatingMatch ? "Cancel" : "Add New Match"}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-neon-green text-xs text-neon-green flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* CREATE MATCH FORM */}
      {isCreatingMatch && (
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-2xl max-w-xl">
          <h3 className="font-display font-bold text-xl text-white mb-4">Add Match to Tournament</h3>
          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">TOURNAMENT</label>
              <select
                value={selectedTourneyId}
                onChange={(e) => setSelectedTourneyId(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">MATCH NUMBER</label>
                <input
                  type="number"
                  min={1}
                  value={matchNumber}
                  onChange={(e) => setMatchNumber(Number(e.target.value))}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">MAP</label>
                <select
                  value={map}
                  onChange={(e) => setMap(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
                >
                  <option value="Erangel">Erangel</option>
                  <option value="Miramar">Miramar</option>
                  <option value="Sanhok">Sanhok</option>
                  <option value="Vikendi">Vikendi</option>
                  <option value="Rondo">Rondo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">START TIME</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider transition"
            >
              Confirm & Schedule Match
            </button>
          </form>
        </div>
      )}

      {/* TOURNAMENT MATCHES LIST */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-gold animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">Loading matches...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tournaments.map((t) => (
            <div key={t.id} className="p-6 rounded-2xl bg-surface border border-border shadow-card-glow space-y-4">
              <h3 className="font-display font-bold text-xl text-white border-b border-border pb-3">
                {t.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {t.matches?.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-surface-light border border-border flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-neon-green">
                          Match #{m.matchNumber}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-gray-400">
                          {m.status}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-white text-base">{m.map} ({m.mode})</h4>
                      <p className="text-[11px] font-mono text-gray-400">
                        {new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectMatch(m, t)}
                      className="mt-4 w-full py-2 rounded-lg bg-surface hover:bg-neon-green text-gray-200 hover:text-black border border-border hover:border-neon-green font-mono text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{m.status === "COMPLETED" ? "Edit Results" : "Enter Results"}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RESULT ENTRY MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-2xl text-white mb-1">
              Score Match #{selectedMatch.matchNumber} ({selectedMatch.map})
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Enter final placement (1 to {selectedMatch.tournament?.registrations?.length || 25}) and kills for each squad.
            </p>

            <form onSubmit={handleSaveResults} className="space-y-4">
              <div className="space-y-3">
                {selectedMatch.tournament?.registrations?.map((reg: any) => {
                  const curr = teamResults[reg.teamId] || { placement: 1, kills: 0 };
                  return (
                    <div
                      key={reg.teamId}
                      className="p-3 rounded-xl bg-surface-light border border-border flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <span className="font-display font-bold text-sm text-white block">
                          {reg.team?.name}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          TAG: [{reg.team?.tag}]
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-gray-400">Place:</span>
                          <input
                            type="number"
                            min={1}
                            max={25}
                            value={curr.placement}
                            onChange={(e) =>
                              setTeamResults({
                                ...teamResults,
                                [reg.teamId]: {
                                  ...curr,
                                  placement: Number(e.target.value),
                                },
                              })
                            }
                            className="w-16 bg-surface border border-border rounded-lg p-2 text-center text-xs text-white font-mono outline-none focus:border-neon-green"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-gray-400">Kills:</span>
                          <input
                            type="number"
                            min={0}
                            value={curr.kills}
                            onChange={(e) =>
                              setTeamResults({
                                ...teamResults,
                                [reg.teamId]: {
                                  ...curr,
                                  kills: Number(e.target.value),
                                },
                              })
                            }
                            className="w-16 bg-surface border border-border rounded-lg p-2 text-center text-xs text-white font-mono outline-none focus:border-neon-green"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 py-2.5 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? "Calculating..." : "Save & Calculate Points"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

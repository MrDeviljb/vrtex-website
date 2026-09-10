"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  Shield,
  Layers,
  Award,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import RoomAccessBox from "@/components/RoomAccessBox";

export default function TournamentDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [tournament, setTournament] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "matches" | "teams" | "leaderboard" | "rules">("overview");

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [confirmedRules, setConfirmedRules] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  useEffect(() => {
    fetchTournamentData();
    fetchCurrentUser();
  }, [slug]);

  const fetchTournamentData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${slug}`);
      const data = await res.json();
      if (data.success && data.tournament) {
        setTournament(data.tournament);
        setUserRegistration(data.userRegistration);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      }
    } catch {}
  };

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setRegError("Please select a team.");
      return;
    }
    if (!confirmedRules) {
      setRegError("You must read and agree to the tournament fair-play rules.");
      return;
    }

    setRegistering(true);
    setRegError("");
    setRegSuccess("");

    try {
      const res = await fetch(`/api/tournaments/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeamId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRegSuccess(data.message || "Registration successful!");
        setTimeout(() => {
          setIsRegisterModalOpen(false);
          fetchTournamentData();
        }, 1500);
      } else {
        setRegError(data.message || "Failed to register for tournament.");
      }
    } catch {
      setRegError("Network error. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-accent-red mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-white">Tournament Not Found</h2>
        <p className="text-gray-400 text-sm mt-2">The requested tournament could not be found or has been removed.</p>
      </div>
    );
  }

  const isFree = tournament.entryFee === 0;
  const isApproved = userRegistration && userRegistration.status === "APPROVED";
  const now = new Date();
  const isRegOpen = tournament.status === "REGISTRATION_OPEN" && now <= new Date(tournament.regEnd);

  return (
    <div className="min-h-screen pb-20">
      {/* Banner & Header Section */}
      <div className="relative bg-surface-light border-b border-border">
        <div className="h-64 sm:h-80 w-full overflow-hidden relative">
          <img
            src={tournament.bannerUrl || "/bgmi_hero.jpg"}
            alt={tournament.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 relative z-10">
          <div className="bg-surface/95 backdrop-blur-xl border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Info */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 text-xs font-mono font-bold rounded-md badge-open uppercase">
                    {tournament.status.replace("_", " ")}
                  </span>
                  {tournament.isScrim && (
                    <span className="px-2.5 py-1 text-xs font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      SCRIM
                    </span>
                  )}
                  <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-surface-light text-gray-300 border border-border">
                    {tournament.gameMode} ({tournament.perspective})
                  </span>
                </div>

                <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
                  {tournament.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-gray-300 pt-1 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-neon-green" />
                    <span>{new Date(tournament.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-neon-green" />
                    <span>{new Date(tournament.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-neon-green" />
                    <span>{tournament.registrations.length} / {tournament.maxTeams} Teams</span>
                  </div>
                </div>
              </div>

              {/* Right: Prize & Registration Action */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
                <div>
                  <span className="text-[11px] text-gray-400 block uppercase font-mono tracking-wider">TOTAL PRIZE POOL</span>
                  <span className="font-display font-black text-3xl sm:text-4xl text-neon-green">
                    ₹{tournament.prizePool.toLocaleString()}
                  </span>
                </div>

                {isApproved ? (
                  <div className="px-5 py-2.5 rounded-xl bg-neon-green/15 border border-neon-green/40 text-neon-green text-xs font-bold font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>TEAM REGISTERED & APPROVED</span>
                  </div>
                ) : isRegOpen ? (
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        router.push("/login");
                      } else {
                        setIsRegisterModalOpen(true);
                      }
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-sm tracking-wider uppercase transition shadow-neon-green"
                  >
                    REGISTER YOUR SQUAD
                  </button>
                ) : (
                  <div className="px-5 py-2.5 rounded-xl bg-surface-light border border-border text-gray-400 text-xs font-mono">
                    REGISTRATION CLOSED
                  </div>
                )}
              </div>
            </div>

            {/* Countdown Banner */}
            {isRegOpen && (
              <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-gray-300">Registration Closes in:</span>
                <CountdownTimer targetDate={tournament.regEnd} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="p-5 rounded-2xl bg-surface border border-border">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neon-green block mb-4">
            TOURNAMENT TIMELINE
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-surface-light border border-border">
              <span className="text-[10px] text-gray-500 block">STEP 1</span>
              <span className="font-bold text-white">Registration Opens</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-light border border-border">
              <span className="text-[10px] text-gray-500 block">STEP 2</span>
              <span className="font-bold text-white">Registration Closes</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-light border border-border">
              <span className="text-[10px] text-gray-500 block">STEP 3</span>
              <span className="font-bold text-white">Teams Approved</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neon-green/10 border border-neon-green/30">
              <span className="text-[10px] text-neon-green block">STEP 4</span>
              <span className="font-bold text-neon-green">Room Details Released</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-light border border-border">
              <span className="text-[10px] text-gray-500 block">STEP 5</span>
              <span className="font-bold text-white">Match Starts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-light border border-border">
              <span className="text-[10px] text-gray-500 block">STEP 6</span>
              <span className="font-bold text-white">Results Published</span>
            </div>
            <div className="p-2.5 rounded-xl bg-accent-gold/10 border border-accent-gold/30">
              <span className="text-[10px] text-accent-gold block">STEP 7</span>
              <span className="font-bold text-accent-gold">Prize Distribution</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex border-b border-border gap-2 sm:gap-6 overflow-x-auto pb-px">
          {(["overview", "matches", "teams", "leaderboard", "rules"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-3 text-sm font-bold uppercase font-display tracking-wider border-b-2 transition whitespace-nowrap ${
                activeTab === tab
                  ? "text-neon-green border-neon-green"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <h3 className="font-display font-bold text-xl text-white mb-3">About The Tournament</h3>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {tournament.description}
                </p>
              </div>

              {/* Prize Breakdown */}
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent-gold" /> Prize Pool Distribution
                </h3>
                <div className="space-y-2.5">
                  {tournament.prizes.length === 0 ? (
                    <p className="text-xs text-gray-400">Prizes will be published upon registration close.</p>
                  ) : (
                    tournament.prizes.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-surface-light border border-border"
                      >
                        <span className="font-mono text-sm font-bold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-xs">
                            #{p.rank}
                          </span>
                          {p.rank === 1 ? "1st Place (Champion)" : p.rank === 2 ? "2nd Place" : `${p.rank}rd Place`}
                        </span>
                        <span className="font-mono text-base font-extrabold text-neon-green">
                          ₹{p.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Quick Details */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 text-xs">
                <h4 className="font-display font-bold text-base text-white border-b border-border pb-2">
                  Tournament Overview
                </h4>

                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Game</span>
                  <span className="font-semibold text-white">BGMI (Battlegrounds Mobile India)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Mode</span>
                  <span className="font-semibold text-white">{tournament.gameMode}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Perspective</span>
                  <span className="font-semibold text-white">{tournament.perspective}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Entry Fee</span>
                  <span className="font-semibold text-neon-green font-mono">
                    {isFree ? "FREE" : `₹${tournament.entryFee}`}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Total Matches</span>
                  <span className="font-semibold text-white font-mono">{tournament.matches.length} Matches</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Registered Teams</span>
                  <span className="font-semibold text-white font-mono">{tournament.registrations.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATCHES & ROOM ACCESS */}
        {activeTab === "matches" && (
          <div className="mt-8 space-y-6">
            {tournament.matches.length === 0 ? (
              <div className="p-12 bg-surface rounded-2xl border border-border text-center text-xs text-gray-400">
                Match schedules will be posted here before tournament launch.
              </div>
            ) : (
              tournament.matches.map((m: any) => (
                <div key={m.id} className="p-6 rounded-2xl bg-surface border border-border space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-neon-green uppercase tracking-wider block">
                        MATCH #{m.matchNumber}
                      </span>
                      <h3 className="font-display font-bold text-2xl text-white">
                        Map: {m.map} ({m.mode})
                      </h3>
                    </div>
                    <div className="text-right text-xs font-mono">
                      <span className="text-gray-400 block">SCHEDULE</span>
                      <span className="text-white font-bold">
                        {new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* ROOM ACCESS CREDENTIALS BOX */}
                  <RoomAccessBox
                    matchId={m.id}
                    matchNumber={m.matchNumber}
                    initialReleaseTime={m.room?.releaseTime}
                    isUserRegistered={isApproved}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: TEAMS */}
        {activeTab === "teams" && (
          <div className="mt-8">
            <h3 className="font-display font-bold text-xl text-white mb-4">
              Registered Teams ({tournament.registrations.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournament.registrations.map((reg: any, idx: number) => (
                <div
                  key={reg.id}
                  className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-500 font-bold">#{idx + 1}</span>
                    <div>
                      <h4 className="font-display font-bold text-white text-base">{reg.team.name}</h4>
                      <p className="text-[11px] text-gray-400 font-mono">
                        Captain: {reg.team.captain?.profile?.bgmiUsername || reg.team.captain?.username}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-light text-neon-green border border-neon-green/30">
                    {reg.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <div className="mt-8">
            <h3 className="font-display font-bold text-xl text-white mb-4">
              Tournament Standings
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-light border-b border-border text-gray-400 font-mono uppercase">
                  <tr>
                    <th className="p-3.5">Rank</th>
                    <th className="p-3.5">Team</th>
                    <th className="p-3.5 text-center">Matches</th>
                    <th className="p-3.5 text-center">WWCD</th>
                    <th className="p-3.5 text-center">Kills</th>
                    <th className="p-3.5 text-center">Place PTS</th>
                    <th className="p-3.5 text-center">Total PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tournament.registrations.map((reg: any, idx: number) => {
                    // Aggregate team results in this tournament
                    let matchesPlayed = 0;
                    let wwcd = 0;
                    let kills = 0;
                    let placePts = 0;
                    let totalPts = 0;

                    for (const m of tournament.matches) {
                      const res = m.results?.find((r: any) => r.teamId === reg.teamId);
                      if (res) {
                        matchesPlayed++;
                        if (res.placement === 1) wwcd++;
                        kills += res.kills;
                        placePts += res.placementPoints;
                        totalPts += res.totalPoints;
                      }
                    }

                    return (
                      <tr key={reg.id} className="hover:bg-surface-light/40 transition">
                        <td className="p-3.5 font-bold font-mono text-neon-green">#{idx + 1}</td>
                        <td className="p-3.5 font-bold text-white">{reg.team.name}</td>
                        <td className="p-3.5 text-center font-mono">{matchesPlayed}</td>
                        <td className="p-3.5 text-center font-mono text-accent-gold">{wwcd}</td>
                        <td className="p-3.5 text-center font-mono">{kills}</td>
                        <td className="p-3.5 text-center font-mono">{placePts}</td>
                        <td className="p-3.5 text-center font-mono font-extrabold text-neon-green text-sm">
                          {totalPts}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: RULES */}
        {activeTab === "rules" && (
          <div className="mt-8 p-6 rounded-2xl bg-surface border border-border">
            <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-neon-green" /> Official Tournament Rulebook
            </h3>
            <div className="prose prose-invert max-w-none text-xs text-gray-300 leading-relaxed whitespace-pre-line space-y-4">
              {tournament.rulesText}
            </div>
          </div>
        )}
      </div>

      {/* REGISTRATION MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-display font-bold text-2xl text-white mb-2">Register For {tournament.title}</h3>
            <p className="text-xs text-gray-400 mb-6">Select your squad roster and confirm entry rules.</p>

            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-accent-red/40 text-xs text-red-300">
                {regError}
              </div>
            )}
            {regSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-neon-green/40 text-xs text-neon-green">
                {regSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">SELECT SQUAD</label>
                {currentUser?.captainTeams?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-surface-light border border-border text-center">
                    <p className="text-xs text-gray-400 mb-2">You are not the captain of any squad yet.</p>
                    <button
                      type="button"
                      onClick={() => router.push("/my-team")}
                      className="text-xs text-neon-green font-bold underline"
                    >
                      Create Squad in My Team
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full bg-surface-light border border-border rounded-xl p-3 text-sm text-white outline-none focus:border-neon-green"
                  >
                    <option value="">-- Select Your Team --</option>
                    {currentUser?.captainTeams?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.members.length} players)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="p-3 bg-surface-light rounded-xl border border-border text-xs text-gray-300 space-y-1 font-mono">
                <div>Entry Fee: <span className="text-neon-green font-bold">{isFree ? "FREE" : `₹${tournament.entryFee}`}</span></div>
                <div>Game Mode: <span className="text-white">{tournament.gameMode} ({tournament.perspective})</span></div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="confirmRules"
                  checked={confirmedRules}
                  onChange={(e) => setConfirmedRules(e.target.checked)}
                  className="mt-1 accent-emerald-500"
                />
                <label htmlFor="confirmRules" className="text-xs text-gray-400 leading-relaxed">
                  I certify that all squad players have verified BGMI UIDs and will not use emulators, iPads, or prohibited third-party software.
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering || !currentUser?.captainTeams?.length}
                  className="flex-1 py-2.5 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
                >
                  {registering ? "Registering..." : "Confirm & Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

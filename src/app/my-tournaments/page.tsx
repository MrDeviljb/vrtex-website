"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  XCircle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Crown,
  Shield,
  Users,
  Clock,
} from "lucide-react";

type RosterMember = {
  userId: string;
  bgmiUsername: string | null;
  bgmiUid: string | null;
  isVerified: boolean;
  role: string;
};

type RegistrationItem = {
  registrationId: string;
  tournamentId: string;
  tournamentTitle: string;
  tournamentSlug: string;
  tournamentStatus: string;
  bannerUrl: string | null;
  startDate: string;
  gameMode: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  slotNumber: string;
  registrationStatus: string;
  waitlistPosition: number | null;
  paymentStatus: string;
  matchStatus: string;
  entryFee: number;
  registeredAt: string;
  isCaptain: boolean;
  canCancel: boolean;
  roster: {
    captain: { userId: string; bgmiUsername: string | null; bgmiUid: string | null; isVerified: boolean };
    mainMembers: RosterMember[];
    substitutes: RosterMember[];
    counts: { main: number; sub: number; maxMain: number; maxSub: number };
  };
};

type CancelModal = {
  open: boolean;
  item: RegistrationItem | null;
  loading: boolean;
  error: string;
  success: string;
};

function StatusBadge({ status, type = "reg" }: { status: string; type?: string }) {
  const map: Record<string, string> = {
    APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    UNDER_REVIEW: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    PENDING: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    WAITLIST: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
    DISQUALIFIED: "bg-red-700/20 text-red-500 border-red-700/30",
    REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
    FREE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    REFUND_PENDING: "bg-amber-700/20 text-amber-400 border-amber-500/30",
    REFUNDED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    LIVE: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const cls = map[status] || "bg-gray-700/30 text-gray-400 border-gray-700/40";
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${cls} uppercase`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PlayerChip({ player, role }: { player: { bgmiUsername: string | null; bgmiUid: string | null; isVerified: boolean }; role: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
      <div className="w-6 h-6 rounded-md bg-surface flex items-center justify-center text-[10px] font-bold text-neon-green flex-shrink-0">
        {(player.bgmiUsername || "?").charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <span className="text-xs font-display font-bold text-white truncate block">
          『{player.bgmiUsername || "—"}』
        </span>
      </div>
      {player.isVerified && (
        <span title="Verified">
          <CheckCircle2 className="w-3 h-3 text-neon-green flex-shrink-0" />
        </span>
      )}
      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
        role === "CAPTAIN" ? "text-accent-gold bg-accent-gold/10 border-accent-gold/30"
          : role === "SUBSTITUTE" ? "text-purple-300 bg-purple-500/10 border-purple-500/30"
          : "text-neon-green bg-neon-green/10 border-neon-green/30"
      }`}>
        {role === "CAPTAIN" ? "👑" : role === "SUBSTITUTE" ? "SUB" : "MAIN"}
      </span>
    </div>
  );
}

export default function MyTournamentsPage() {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedRosters, setExpandedRosters] = useState<Set<string>>(new Set());

  const [cancelModal, setCancelModal] = useState<CancelModal>({
    open: false,
    item: null,
    loading: false,
    error: "",
    success: "",
  });

  const fetchMyTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tournaments/my");
      const json = await res.json();
      if (json.success) {
        setRegistrations(json.registrations);
      } else {
        setError(json.message || "Failed to load registered tournaments.");
      }
    } catch {
      setError("Network error loading tournaments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTournaments();
  }, [fetchMyTournaments]);

  const toggleRoster = (id: string) => {
    setExpandedRosters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCancelModal = (item: RegistrationItem) => {
    setCancelModal({ open: true, item, loading: false, error: "", success: "" });
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, item: null, loading: false, error: "", success: "" });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.item) return;
    setCancelModal((m) => ({ ...m, loading: true, error: "", success: "" }));

    try {
      const res = await fetch(`/api/registrations/${cancelModal.item.registrationId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by team captain" }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCancelModal((m) => ({ ...m, loading: false, success: data.message }));
        setTimeout(() => {
          closeCancelModal();
          fetchMyTournaments();
        }, 2500);
      } else {
        setCancelModal((m) => ({ ...m, loading: false, error: data.message || "Failed to cancel." }));
      }
    } catch {
      setCancelModal((m) => ({ ...m, loading: false, error: "Network error. Please try again." }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col font-sans">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <span className="text-xs font-mono uppercase tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full">
            MY COMPETITIONS
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-2">
            My Registered Tournaments
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your team slots, roster, and registrations.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400 text-sm font-mono">Fetching Registered Events...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/40 border border-red-500/40 p-6 rounded-2xl text-center">
            <p className="text-red-400 font-semibold mb-2">Error Loading Tournaments</p>
            <p className="text-gray-300 text-sm">{error}</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-[#121827] border border-gray-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 my-8">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto text-3xl">🎮</div>
            <h3 className="text-xl font-bold text-white">No Tournament Registrations Yet</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              You haven't registered for any BGMI tournaments or scrims yet.
            </p>
            <div className="pt-2">
              <Link
                href="/tournaments"
                className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-cyan-900/30"
              >
                BROWSE TOURNAMENTS
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {registrations.map((item) => (
              <div
                key={item.registrationId}
                className={`bg-gradient-to-b from-[#121827] to-[#0D121F] border rounded-3xl overflow-hidden shadow-xl transition ${
                  item.registrationStatus === "CANCELLED"
                    ? "border-red-500/30 opacity-70"
                    : "border-gray-800 hover:border-cyan-500/30"
                }`}
              >
                {/* Card Header Banner */}
                <div className="relative h-28 bg-gray-900 overflow-hidden">
                  <img
                    src={item.bannerUrl || "/bgmi_hero.jpg"}
                    alt={item.tournamentTitle}
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121827] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    <span className="bg-black/80 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase">
                      {item.gameMode}
                    </span>
                    {item.entryFee > 0 ? (
                      <span className="bg-amber-950/90 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                        PAID (₹{item.entryFee})
                      </span>
                    ) : (
                      <span className="bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                        FREE ENTRY
                      </span>
                    )}
                    {item.isCaptain && (
                      <span className="bg-accent-gold/20 text-accent-gold border border-accent-gold/40 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" /> CAPTAIN
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Title + Date */}
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{item.tournamentTitle}</h3>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">
                      📅{" "}
                      {new Date(item.startDate).toLocaleDateString("en-IN", {
                        weekday: "short", year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Info Grid */}
                  <div className="bg-black/40 border border-gray-800/80 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono">Team</span>
                      <span className="font-bold text-white">{item.teamName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono">Assigned Slot</span>
                      <span className={`font-mono font-bold ${
                        item.waitlistPosition ? "text-purple-300" : "text-cyan-400"
                      }`}>
                        {item.slotNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono">Registration</span>
                      <StatusBadge status={item.registrationStatus} />
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono">Payment</span>
                      <StatusBadge status={item.paymentStatus} />
                    </div>
                  </div>

                  {/* Match Status */}
                  {item.matchStatus !== item.tournamentStatus && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-400">Match Status:</span>
                      <StatusBadge status={item.matchStatus} />
                    </div>
                  )}

                  {/* Roster Section */}
                  <div>
                    <button
                      onClick={() => toggleRoster(item.registrationId)}
                      className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition w-full text-left"
                    >
                      <Users className="w-3.5 h-3.5" />
                      ROSTER ({item.roster.counts.main + item.roster.counts.sub} players)
                      <span className="ml-auto">{expandedRosters.has(item.registrationId) ? "▲" : "▼"}</span>
                    </button>

                    {expandedRosters.has(item.registrationId) && (
                      <div className="mt-3 p-4 rounded-xl bg-black/30 border border-gray-800/60 space-y-1">
                        {/* Captain */}
                        <PlayerChip player={item.roster.captain} role="CAPTAIN" />
                        {/* Main */}
                        {item.roster.mainMembers.map((m) => (
                          <PlayerChip key={m.userId} player={m} role="PLAYER" />
                        ))}
                        {/* Subs */}
                        {item.roster.substitutes.map((m) => (
                          <PlayerChip key={m.userId} player={m} role="SUBSTITUTE" />
                        ))}
                        {/* Roster limits */}
                        <div className="flex gap-4 pt-2 text-[10px] font-mono text-gray-500">
                          <span>MAIN {item.roster.counts.main}/{item.roster.counts.maxMain}</span>
                          <span>SUB {item.roster.counts.sub}/{item.roster.counts.maxSub}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-1">
                    {/* Payment button */}
                    {item.entryFee > 0 &&
                      item.paymentStatus !== "APPROVED" &&
                      item.registrationStatus !== "APPROVED" &&
                      item.registrationStatus !== "CANCELLED" && (
                        <Link
                          href={`/payment/${item.registrationId}`}
                          className="flex-1 text-center bg-amber-600 hover:bg-amber-500 text-black font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
                        >
                          💳 COMPLETE PAYMENT
                        </Link>
                      )}

                    {/* View Tournament */}
                    <Link
                      href={`/tournament/${item.tournamentSlug}`}
                      className="flex-1 text-center bg-cyan-600 hover:bg-cyan-500 text-black font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
                    >
                      VIEW TOURNAMENT →
                    </Link>

                    {/* Manage Team — captain only */}
                    {item.isCaptain && item.registrationStatus !== "CANCELLED" && (
                      <Link
                        href={`/my-team/manage/${item.teamId}`}
                        className="flex-1 text-center bg-neon-green/10 hover:bg-neon-green hover:text-black border border-neon-green/40 text-neon-green font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
                      >
                        ⚙ MANAGE TEAM
                      </Link>
                    )}

                    {/* Cancel Registration — captain only, when eligible */}
                    {item.canCancel && (
                      <button
                        onClick={() => openCancelModal(item)}
                        className="flex-1 text-center bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/40 text-accent-red font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
                      >
                        ✕ CANCEL REGISTRATION
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cancel Registration Modal */}
      {cancelModal.open && cancelModal.item && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-gray-700 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-xl">Cancel Registration?</h3>
                <p className="text-xs text-gray-400">This action cannot be undone.</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 rounded-2xl bg-black/40 border border-gray-800 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Tournament</span>
                <span className="text-white font-bold">{cancelModal.item.tournamentTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Team</span>
                <span className="text-white font-bold">{cancelModal.item.teamName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Assigned Slot</span>
                <span className="text-cyan-400 font-bold">{cancelModal.item.slotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Registration</span>
                <StatusBadge status={cancelModal.item.registrationStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment</span>
                <StatusBadge status={cancelModal.item.paymentStatus} />
              </div>
            </div>

            {/* Warning */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
              ⚠ After cancellation, your slot will be released and may be assigned to another registered team.
              {cancelModal.item.entryFee > 0 &&
                " Refund eligibility will be reviewed according to the tournament's refund policy."}
            </div>

            {cancelModal.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {cancelModal.error}
              </div>
            )}

            {cancelModal.success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {cancelModal.success}
              </div>
            )}

            {!cancelModal.success && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={closeCancelModal}
                  className="py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider transition"
                >
                  Keep Registration
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelModal.loading}
                  className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelModal.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {cancelModal.loading ? "Cancelling..." : "Cancel Registration"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

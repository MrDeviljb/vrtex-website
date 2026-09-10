"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Crown, Shield, CheckCircle2, XCircle,
  AlertCircle, Loader2, Plus, Trash2, ChevronLeft,
  UserCheck, UserX, Search,
} from "lucide-react";

type RosterMember = {
  memberId: string;
  userId: string;
  username: string;
  bgmiUsername: string | null;
  bgmiUid: string | null;
  isVerified: boolean;
  role: string;
  joinedAt: string;
  isCaptainOfTeam: boolean;
};

type RosterData = {
  teamId: string;
  teamName: string;
  teamTag: string;
  captainId: string;
  isCaptain: boolean;
  captain: {
    userId: string;
    username: string;
    bgmiUsername: string | null;
    bgmiUid: string | null;
    isVerified: boolean;
  };
  mainMembers: RosterMember[];
  substitutes: RosterMember[];
  counts: { main: number; sub: number; totalMembers: number };
};

type VerifiedPlayer = {
  uid: string;
  username: string;
};

export default function ManagePlayersPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();

  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add player state
  const [bgmiUid, setBgmiUid] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedPlayer, setVerifiedPlayer] = useState<VerifiedPlayer | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [selectedRole, setSelectedRole] = useState<"PLAYER" | "SUBSTITUTE">("PLAYER");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  // Remove confirmation
  const [removingMember, setRemovingMember] = useState<RosterMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState("");

  // Roster limits (fetched from active tournament reg)
  const [maxMain, setMaxMain] = useState(4);
  const [maxSub, setMaxSub] = useState(1);

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/roster`);
      const data = await res.json();
      if (data.success) {
        setRoster(data);
      } else {
        setError(data.message || "Failed to load roster.");
      }
    } catch {
      setError("Network error loading roster.");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Fetch roster limits from my-tournaments
  const fetchLimits = useCallback(async () => {
    try {
      const res = await fetch("/api/tournaments/my");
      const data = await res.json();
      if (data.success && data.registrations?.length > 0) {
        // Use limits from the most recent active registration for this team
        const reg = data.registrations.find((r: any) => r.teamId === teamId);
        if (reg) {
          setMaxMain(reg.roster?.counts?.maxMain ?? 4);
          setMaxSub(reg.roster?.counts?.maxSub ?? 1);
        }
      }
    } catch {}
  }, [teamId]);

  useEffect(() => {
    fetchRoster();
    fetchLimits();
  }, [fetchRoster, fetchLimits]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bgmiUid.trim()) return;

    setVerifying(true);
    setVerifyError("");
    setVerifiedPlayer(null);
    setAddError("");
    setAddSuccess("");

    try {
      const res = await fetch(`/api/teams/${teamId}/roster/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bgmiUid: bgmiUid.trim() }),
      });
      const data = await res.json();
      if (data.success && data.player) {
        setVerifiedPlayer(data.player);
      } else {
        setVerifyError(data.message || "Verification failed.");
      }
    } catch {
      setVerifyError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!verifiedPlayer) return;

    setAdding(true);
    setAddError("");
    setAddSuccess("");

    try {
      const res = await fetch(`/api/teams/${teamId}/roster/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bgmiUid: verifiedPlayer.uid, role: selectedRole }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAddSuccess(data.message);
        setBgmiUid("");
        setVerifiedPlayer(null);
        setSelectedRole("PLAYER");
        await fetchRoster();
      } else {
        setAddError(data.message || "Failed to add player.");
      }
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    setRemoveLoading(true);
    setRemoveError("");

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REMOVE_MEMBER", targetUserId: removingMember.userId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRemovingMember(null);
        await fetchRoster();
      } else {
        setRemoveError(data.message || "Failed to remove player.");
      }
    } catch {
      setRemoveError("Network error. Please try again.");
    } finally {
      setRemoveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
      </div>
    );
  }

  if (error || !roster) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-accent-red mx-auto mb-4" />
        <h2 className="font-display font-bold text-xl text-white">Could not load roster</h2>
        <p className="text-gray-400 text-sm mt-2">{error}</p>
        <button onClick={() => router.back()} className="mt-6 text-neon-green text-sm hover:underline">
          ← Go Back
        </button>
      </div>
    );
  }

  if (!roster.isCaptain) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h2 className="font-display font-bold text-xl text-white">Captain Only</h2>
        <p className="text-gray-400 text-sm mt-2">
          Only the Team Captain can manage the roster. You can view the roster from My Team.
        </p>
        <button onClick={() => router.back()} className="mt-6 text-neon-green text-sm hover:underline">
          ← Go Back
        </button>
      </div>
    );
  }

  const mainFull = roster.counts.main >= maxMain;
  const subFull = roster.counts.sub >= maxSub;

  const RosterRow = ({
    member,
    showRemove,
  }: {
    member: {
      userId: string;
      username: string;
      bgmiUsername: string | null;
      bgmiUid: string | null;
      isVerified: boolean;
      role: string;
      isCaptainOfTeam?: boolean;
    };
    showRemove: boolean;
  }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-light border border-border hover:border-neon-green/20 transition group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center font-bold text-neon-green flex-shrink-0">
          {(member.bgmiUsername || member.username).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-white">
              『{member.bgmiUsername || member.username}』
            </span>
            {member.isVerified ? (
              <span className="flex items-center gap-1 text-[10px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/30 px-1.5 py-0.5 rounded">
                <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                <XCircle className="w-2.5 h-2.5" /> UNVERIFIED
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            UID: {member.bgmiUid || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
            member.role === "CAPTAIN"
              ? "bg-accent-gold/20 text-accent-gold border-accent-gold/40"
              : member.role === "SUBSTITUTE"
              ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
              : "bg-neon-green/10 text-neon-green border-neon-green/30"
          }`}
        >
          {member.role === "CAPTAIN" ? "👑 CAPTAIN" : member.role}
        </span>
        {showRemove && !member.isCaptainOfTeam && (
          <button
            onClick={() => setRemovingMember(member as RosterMember)}
            className="p-1.5 rounded-lg bg-surface hover:bg-accent-red/20 hover:border-accent-red/40 border border-transparent text-gray-500 hover:text-accent-red transition"
            title="Remove player"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition mb-4"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green block mb-1">
          CAPTAIN MANAGEMENT
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide">
          {roster.teamName} — MANAGE ROSTER
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Add or remove players from your tournament squad.
        </p>
      </div>

      {/* Roster Counter */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-5 rounded-2xl border ${
            mainFull
              ? "bg-accent-red/10 border-accent-red/40"
              : "bg-surface border-border"
          }`}
        >
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Main Roster</p>
          <p
            className={`font-display font-black text-3xl mt-1 ${
              mainFull ? "text-accent-red" : "text-neon-green"
            }`}
          >
            {roster.counts.main}/{maxMain}
          </p>
          {mainFull && (
            <p className="text-[11px] text-accent-red font-mono mt-1">Main roster is full.</p>
          )}
        </div>
        <div
          className={`p-5 rounded-2xl border ${
            subFull
              ? "bg-accent-red/10 border-accent-red/40"
              : "bg-surface border-border"
          }`}
        >
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Substitute</p>
          <p
            className={`font-display font-black text-3xl mt-1 ${
              subFull ? "text-accent-red" : "text-neon-green"
            }`}
          >
            {roster.counts.sub}/{maxSub}
          </p>
          {subFull && (
            <p className="text-[11px] text-accent-red font-mono mt-1">Substitute slot is full.</p>
          )}
        </div>
      </div>

      {/* Current Roster */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border space-y-6">
        <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-green" /> Current Roster
        </h2>

        {/* Captain */}
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Crown className="w-3 h-3 text-accent-gold" /> Captain
          </p>
          <RosterRow
            member={{ ...roster.captain, role: "CAPTAIN", isCaptainOfTeam: true }}
            showRemove={false}
          />
        </div>

        {/* Main Members */}
        {roster.mainMembers.length > 0 && (
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
              Main Players ({roster.mainMembers.length}/{maxMain - 1})
            </p>
            <div className="space-y-2">
              {roster.mainMembers.map((m) => (
                <RosterRow key={m.memberId} member={m} showRemove={roster.isCaptain} />
              ))}
            </div>
          </div>
        )}

        {/* Substitutes */}
        {roster.substitutes.length > 0 && (
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
              Substitute ({roster.substitutes.length}/{maxSub})
            </p>
            <div className="space-y-2">
              {roster.substitutes.map((m) => (
                <RosterRow key={m.memberId} member={m} showRemove={roster.isCaptain} />
              ))}
            </div>
          </div>
        )}

        {roster.mainMembers.length === 0 && roster.substitutes.length === 0 && (
          <p className="text-gray-500 text-sm italic">
            No players added yet. Use the form below to add players by BGMI UID.
          </p>
        )}
      </div>

      {/* Add Player Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-neon-green/20 space-y-6">
        <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-neon-green" /> Add Player
        </h2>

        {addSuccess && (
          <div className="p-3.5 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {addSuccess}
          </div>
        )}

        {/* Step 1: Enter UID and Verify */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
              BGMI UID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bgmiUid}
                onChange={(e) => {
                  setBgmiUid(e.target.value);
                  setVerifiedPlayer(null);
                  setVerifyError("");
                  setAddError("");
                }}
                placeholder="e.g. 55622232685"
                className="flex-1 bg-surface-light border border-border rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-neon-green transition"
                disabled={verifying}
              />
              <button
                type="submit"
                disabled={verifying || !bgmiUid.trim()}
                className="px-5 py-3 rounded-xl bg-surface-light hover:bg-neon-green hover:text-black border border-border hover:border-neon-green text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-2"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {verifying ? "Verifying..." : "Verify Player"}
              </button>
            </div>
          </div>

          {verifyError && (
            <div className="p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" /> {verifyError}
            </div>
          )}
        </form>

        {/* Step 2: Verified player card */}
        {verifiedPlayer && (
          <div className="p-4 rounded-2xl bg-neon-green/5 border border-neon-green/30 space-y-4">
            <div className="flex items-center gap-2 text-neon-green font-mono font-bold text-sm">
              <UserCheck className="w-5 h-5" />
              ✓ VERIFIED PLAYER
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">BGMI Username</p>
                <p className="text-white font-bold text-base">『{verifiedPlayer.username}』</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">BGMI UID</p>
                <p className="text-white font-bold">{verifiedPlayer.uid}</p>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <p className="text-xs font-mono text-gray-300 uppercase tracking-wider mb-2">Select Role</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("PLAYER")}
                  className={`p-3 rounded-xl border text-xs font-bold font-mono uppercase tracking-wider transition ${
                    selectedRole === "PLAYER"
                      ? "bg-neon-green text-black border-neon-green"
                      : "bg-surface text-gray-300 border-border hover:border-neon-green/50"
                  }`}
                  disabled={mainFull}
                >
                  Main Player {mainFull && "(Full)"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("SUBSTITUTE")}
                  className={`p-3 rounded-xl border text-xs font-bold font-mono uppercase tracking-wider transition ${
                    selectedRole === "SUBSTITUTE"
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-surface text-gray-300 border-border hover:border-purple-500/50"
                  }`}
                  disabled={subFull}
                >
                  Substitute {subFull && "(Full)"}
                </button>
              </div>
              {mainFull && selectedRole === "PLAYER" && (
                <p className="text-[11px] text-accent-red font-mono mt-1">Main roster is full. Please select Substitute.</p>
              )}
              {subFull && selectedRole === "SUBSTITUTE" && (
                <p className="text-[11px] text-accent-red font-mono mt-1">Substitute slot is full.</p>
              )}
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" /> {addError}
              </div>
            )}

            <button
              onClick={handleAddPlayer}
              disabled={
                adding ||
                (selectedRole === "PLAYER" && mainFull) ||
                (selectedRole === "SUBSTITUTE" && subFull)
              }
              className="w-full py-3 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-xs uppercase tracking-wider transition shadow-neon-green disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {adding ? "Adding..." : `Add to Team as ${selectedRole === "PLAYER" ? "Main Player" : "Substitute"}`}
            </button>
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {removingMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-red/10 border border-accent-red/30 flex items-center justify-center">
                <UserX className="w-6 h-6 text-accent-red" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-lg">Remove Player?</h3>
                <p className="text-xs text-gray-400">This will remove the player from your team roster.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-light border border-border text-xs font-mono space-y-1">
              <p className="text-gray-400">Player</p>
              <p className="text-white font-bold">
                『{removingMember.bgmiUsername || removingMember.username}』
              </p>
              <p className="text-gray-400 mt-1">UID: {removingMember.bgmiUid || "—"}</p>
              <p className="text-gray-400">Role: {removingMember.role}</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono">
              ⚠ The player's platform account will not be deleted. Only their membership in this team will be removed.
            </div>

            {removeError && (
              <div className="p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs">
                {removeError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setRemovingMember(null); setRemoveError(""); }}
                className="py-3 rounded-xl bg-surface-light border border-border text-white font-bold text-xs uppercase tracking-wider hover:bg-border transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={removeLoading}
                className="py-3 rounded-xl bg-accent-red hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {removeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {removeLoading ? "Removing..." : "Remove Player"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

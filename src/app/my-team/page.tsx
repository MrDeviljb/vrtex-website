"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Plus,
  Copy,
  Check,
  Crown,
  UserX,
  ArrowRightLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

export default function MyTeamPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Create Team State
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Join Team State
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tag }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setName("");
        setTag("");
        setIsCreating(false);
        fetchUserData();
      } else {
        setCreateError(data.message || "Failed to create team.");
      }
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinLoading(true);
    setJoinMessage("");

    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setJoinMessage(data.message || "Joined team successfully!");
        setJoinCode("");
        fetchUserData();
      } else {
        setJoinMessage(data.message || "Failed to join team.");
      }
    } catch {
      setJoinMessage("Network error. Please try again.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleRemoveMember = async (teamId: string, targetUserId: string) => {
    if (!confirm("Are you sure you want to remove this player from the roster?")) return;
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REMOVE_MEMBER", targetUserId }),
      });
      const data = await res.json();
      if (data.success) fetchUserData();
    } catch {}
  };

  const handleTransferCaptain = async (teamId: string, targetUserId: string) => {
    if (!confirm("Are you sure you want to transfer captaincy to this player?")) return;
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TRANSFER_CAPTAINCY", targetUserId }),
      });
      const data = await res.json();
      if (data.success) fetchUserData();
    } catch {}
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to leave this team?")) return;
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LEAVE_TEAM" }),
      });
      const data = await res.json();
      if (data.success) fetchUserData();
    } catch {}
  };

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
      </div>
    );
  }

  const activeTeams = [
    ...(currentUser?.captainTeams || []),
    ...(currentUser?.teamMemberships?.map((tm: any) => tm.team) || []),
  ];

  // Remove duplicates
  const uniqueTeams = Array.from(new Map(activeTeams.map((t: any) => [t.id, t])).values());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green block mb-1">
            SQUAD MANAGEMENT & ROSTER
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
            MY SQUADS
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Build your team, invite players via code, manage roles, and register for tournaments.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-6 py-3 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-xs uppercase tracking-wider transition shadow-neon-green flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Cancel" : "Create New Squad"}</span>
        </button>
      </div>

      {/* CREATE SQUAD FORM */}
      {isCreating && (
        <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-surface border border-neon-green/40 shadow-2xl max-w-xl mx-auto">
          <h3 className="font-display font-bold text-2xl text-white mb-2">Create a New Squad</h3>
          <p className="text-xs text-gray-400 mb-6">You will be designated as the team captain.</p>

          {createError && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/50 border border-accent-red/40 text-xs text-red-300">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">TEAM NAME</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Soul Esports"
                className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-neon-green"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">TEAM TAG (3-5 CHARACTERS)</label>
              <input
                type="text"
                required
                maxLength={5}
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                placeholder="e.g. SOUL"
                className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-sm text-white font-mono uppercase outline-none focus:border-neon-green"
              />
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full py-3.5 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider transition shadow-neon-green disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Confirm & Create Squad"}
            </button>
          </form>
        </div>
      )}

      {/* JOIN SQUAD WITH INVITE CODE BAR */}
      <div className="mb-10 p-5 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-display font-bold text-base text-white">Join An Existing Squad</h4>
          <p className="text-xs text-gray-400">Have an invite code from your squad captain?</p>
        </div>

        <form onSubmit={handleJoinTeam} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="e.g. ALPHA-2026"
            className="bg-surface-light border border-border rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase outline-none focus:border-neon-green w-full sm:w-48"
          />
          <button
            type="submit"
            disabled={joinLoading || !joinCode.trim()}
            className="px-5 py-2.5 rounded-xl bg-surface-light hover:bg-neon-green hover:text-black border border-border hover:border-neon-green text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
          >
            {joinLoading ? "Joining..." : "Join"}
          </button>
        </form>
      </div>

      {joinMessage && (
        <div className="mb-6 p-4 rounded-xl bg-surface-light border border-border text-xs text-neon-green">
          {joinMessage}
        </div>
      )}

      {/* SQUAD LIST */}
      {uniqueTeams.length === 0 ? (
        <div className="p-12 rounded-3xl bg-surface border border-border text-center">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xl text-white mb-1">No Squads Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
            Create your own team or enter an invite code to join your friends.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {uniqueTeams.map((team: any) => {
            const isCaptain = team.captainId === currentUser.id;
            return (
              <div
                key={team.id}
                className="p-6 sm:p-8 rounded-3xl bg-surface border border-border space-y-6 shadow-2xl"
              >
                {/* Team Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                  <div className="flex items-center gap-4">
                    <span className="w-14 h-14 rounded-2xl bg-surface-light border-2 border-neon-green/40 flex items-center justify-center text-neon-green font-display font-black text-2xl">
                      {team.tag}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
                          {team.name}
                        </h3>
                        {isCaptain && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent-gold/20 text-accent-gold border border-accent-gold/40 flex items-center gap-1">
                            <Crown className="w-3 h-3" /> CAPTAIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        TAG: [{team.tag}] | {team.members?.length || 0} / 6 Roster Slots
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                    {/* Invite Code Box */}
                    <div className="flex items-center gap-2 bg-surface-light p-2 rounded-xl border border-border">
                      <span className="text-xs font-mono text-gray-400 px-2">
                        Code: <span className="text-white font-bold">{team.inviteCode}</span>
                      </span>
                      <button
                        onClick={() => copyInvite(team.inviteCode)}
                        className="p-2 rounded-lg bg-surface hover:bg-border text-neon-green transition"
                        title="Copy Invite Code"
                      >
                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Manage Players Button for Captain */}
                    {isCaptain && (
                      <Link
                        href={`/my-team/manage/${team.id}`}
                        className="px-4 py-2.5 rounded-xl bg-neon-green/10 hover:bg-neon-green hover:text-black border border-neon-green/40 text-neon-green font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Manage Players</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Roster Grid */}
                <div>
                  <h4 className="font-display font-bold text-sm text-gray-300 uppercase tracking-wider mb-4">
                    Squad Roster
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team.members?.map((member: any) => {
                      const isMemberCaptain = member.role === "CAPTAIN";
                      const isSelf = member.userId === currentUser.id;

                      return (
                        <div
                          key={member.id}
                          className="p-4 rounded-2xl bg-surface-light border border-border flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center font-bold text-sm text-neon-green">
                              {member.user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-display font-bold text-white text-base">
                                  {member.user?.profile?.bgmiUsername || member.user?.username}
                                </span>
                                {isMemberCaptain && (
                                  <Crown className="w-3.5 h-3.5 text-accent-gold" />
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-gray-400 block">
                                {member.role} {member.user?.profile?.bgmiUid && `| UID: ${member.user.profile.bgmiUid}`}
                              </span>
                            </div>
                          </div>

                          {/* Action for captain */}
                          {isCaptain && !isSelf && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleTransferCaptain(team.id, member.userId)}
                                title="Transfer Captaincy"
                                className="p-1.5 rounded-lg bg-surface hover:bg-border text-gray-400 hover:text-accent-gold transition text-xs"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveMember(team.id, member.userId)}
                                title="Remove Player"
                                className="p-1.5 rounded-lg bg-surface hover:bg-border text-gray-400 hover:text-accent-red transition text-xs"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Action for self if not captain */}
                          {!isCaptain && isSelf && (
                            <button
                              onClick={() => handleLeaveTeam(team.id)}
                              className="text-[11px] text-accent-red font-mono hover:underline"
                            >
                              Leave
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

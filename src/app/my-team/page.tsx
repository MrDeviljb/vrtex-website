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
  UserPlus,
  Pencil,
  X,
  Edit2,
  Trash2,
} from "lucide-react";

type ManualPlayerSlot = {
  playerName: string;
  bgmiUid: string;
  role: "PLAYER" | "SUBSTITUTE";
};

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
  const [createPlayers, setCreatePlayers] = useState<ManualPlayerSlot[]>([
    { playerName: "", bgmiUid: "", role: "PLAYER" },
    { playerName: "", bgmiUid: "", role: "PLAYER" },
    { playerName: "", bgmiUid: "", role: "PLAYER" },
    { playerName: "", bgmiUid: "", role: "SUBSTITUTE" },
  ]);

  // Join Team State
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Quick Add Player Modal State
  const [quickAddTeam, setQuickAddTeam] = useState<any>(null);
  const [quickPlayerName, setQuickPlayerName] = useState("");
  const [quickBgmiUid, setQuickBgmiUid] = useState("");
  const [quickRole, setQuickRole] = useState<"PLAYER" | "SUBSTITUTE">("PLAYER");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [quickSuccess, setQuickSuccess] = useState("");

  // Edit Team Details Modal State
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamTag, setEditTeamTag] = useState("");
  const [editTeamLoading, setEditTeamLoading] = useState(false);
  const [editTeamError, setEditTeamError] = useState("");

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

    // Filter out rows where BGMI UID is empty
    const validPlayers = createPlayers.filter((p) => p.bgmiUid.trim().length > 0);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          tag: tag.trim().toUpperCase(),
          players: validPlayers,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setName("");
        setTag("");
        setCreatePlayers([
          { playerName: "", bgmiUid: "", role: "PLAYER" },
          { playerName: "", bgmiUid: "", role: "PLAYER" },
          { playerName: "", bgmiUid: "", role: "PLAYER" },
          { playerName: "", bgmiUid: "", role: "SUBSTITUTE" },
        ]);
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

  const handleAddPlayerRow = () => {
    setCreatePlayers([
      ...createPlayers,
      { playerName: "", bgmiUid: "", role: "PLAYER" },
    ]);
  };

  const handleRemovePlayerRow = (index: number) => {
    setCreatePlayers(createPlayers.filter((_, idx) => idx !== index));
  };

  const handlePlayerRowChange = (
    index: number,
    field: keyof ManualPlayerSlot,
    value: string
  ) => {
    const updated = [...createPlayers];
    updated[index] = { ...updated[index], [field]: value };
    setCreatePlayers(updated);
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
        body: JSON.stringify({ inviteCode: joinCode.trim() }),
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

  // Quick Add Player Submit
  const handleQuickAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTeam) return;
    if (!quickBgmiUid.trim()) {
      setQuickError("Please enter BGMI UID.");
      return;
    }

    setQuickLoading(true);
    setQuickError("");
    setQuickSuccess("");

    try {
      const res = await fetch(`/api/teams/${quickAddTeam.id}/roster/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: quickPlayerName.trim(),
          bgmiUid: quickBgmiUid.trim(),
          role: quickRole,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setQuickSuccess(data.message || "Player added successfully!");
        setTimeout(() => {
          setQuickAddTeam(null);
          setQuickPlayerName("");
          setQuickBgmiUid("");
          setQuickSuccess("");
          fetchUserData();
        }, 1200);
      } else {
        setQuickError(data.message || "Failed to add player.");
      }
    } catch {
      setQuickError("Network error. Please try again.");
    } finally {
      setQuickLoading(false);
    }
  };

  // Edit Team Details Submit
  const handleEditTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    setEditTeamLoading(true);
    setEditTeamError("");

    try {
      const res = await fetch(`/api/teams/${editingTeam.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TEAM_DETAILS",
          name: editTeamName.trim(),
          tag: editTeamTag.trim().toUpperCase(),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setEditingTeam(null);
        fetchUserData();
      } else {
        setEditTeamError(data.message || "Failed to update team.");
      }
    } catch {
      setEditTeamError("Network error. Please try again.");
    } finally {
      setEditTeamLoading(false);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green block mb-1">
            SQUAD MANAGEMENT & ROSTER
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
            MY SQUADS
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Build your team, fill player details manually, manage roster roles, and dominate BGMI tournaments.
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

      {/* CREATE SQUAD FORM (WITH MANUAL PLAYER DETAILS FILL) */}
      {isCreating && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-neon-green/40 shadow-2xl max-w-2xl mx-auto space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="font-display font-bold text-2xl text-white mb-1">Create a New Squad</h3>
            <p className="text-xs text-gray-400">
              You will be the team captain. You can also fill in your squad players' details manually below.
            </p>
          </div>

          {createError && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-accent-red/40 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateTeam} className="space-y-6">
            {/* Team Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
                  TEAM NAME <span className="text-neon-green">*</span>
                </label>
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
                <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
                  TEAM TAG (3-5 CHARS) <span className="text-neon-green">*</span>
                </label>
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
            </div>

            {/* SQUAD PLAYERS MANUAL ENTRY SECTION */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-neon-green" /> Fill Squad Players Manually (Optional)
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Add your teammates now or leave blank to invite them later via team code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPlayerRow}
                  className="px-3 py-1.5 rounded-lg bg-surface-light hover:bg-neon-green/10 border border-border hover:border-neon-green/30 text-neon-green text-[11px] font-mono font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Slot
                </button>
              </div>

              {/* Slot 1: Captain Notice */}
              <div className="p-3.5 rounded-xl bg-surface-light/50 border border-border flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-gray-300">
                  <Crown className="w-4 h-4 text-accent-gold" />
                  <span>Slot 1: Captain</span>
                  <span className="text-white font-bold">
                    『{currentUser?.profile?.bgmiUsername || currentUser?.username}』
                  </span>
                </div>
                <span className="text-gray-400">
                  UID: {currentUser?.profile?.bgmiUid || "Verified"}
                </span>
              </div>

              {/* Dynamic Player Slots */}
              {createPlayers.map((player, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-light border border-border space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neon-green font-bold">
                      Slot {idx + 2}: {player.role === "SUBSTITUTE" ? "Substitute Player" : "Main Player"}
                    </span>
                    {createPlayers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayerRow(idx)}
                        className="text-gray-500 hover:text-accent-red transition p-1"
                        title="Remove slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={player.playerName}
                      onChange={(e) => handlePlayerRowChange(idx, "playerName", e.target.value)}
                      placeholder="Player IGN (e.g. Mortal)"
                      className="bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-neon-green"
                    />
                    <input
                      type="text"
                      value={player.bgmiUid}
                      onChange={(e) => handlePlayerRowChange(idx, "bgmiUid", e.target.value)}
                      placeholder="BGMI UID (e.g. 5123456789)"
                      className="bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-neon-green"
                    />
                    <select
                      value={player.role}
                      onChange={(e) => handlePlayerRowChange(idx, "role", e.target.value as any)}
                      className="bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-neon-green"
                    >
                      <option value="PLAYER">Main Player</option>
                      <option value="SUBSTITUTE">Substitute</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full py-3.5 rounded-xl bg-neon-green text-black font-extrabold text-xs uppercase tracking-wider transition shadow-neon-green disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {createLoading ? "Creating Squad..." : "Confirm & Create Squad"}
            </button>
          </form>
        </div>
      )}

      {/* JOIN SQUAD WITH INVITE CODE BAR */}
      <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
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
        <div className="p-4 rounded-xl bg-surface-light border border-border text-xs text-neon-green">
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
                        {isCaptain && (
                          <button
                            onClick={() => {
                              setEditingTeam(team);
                              setEditTeamName(team.name);
                              setEditTeamTag(team.tag);
                              setEditTeamError("");
                            }}
                            className="p-1.5 rounded-lg bg-surface-light hover:bg-border text-gray-400 hover:text-white transition text-xs"
                            title="Edit Team Name & Tag"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        TAG: [{team.tag}] | {team.members?.length || 0} Active Players
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

                    {/* Quick Add Player Button for Captain */}
                    {isCaptain && (
                      <button
                        onClick={() => {
                          setQuickAddTeam(team);
                          setQuickPlayerName("");
                          setQuickBgmiUid("");
                          setQuickRole("PLAYER");
                          setQuickError("");
                          setQuickSuccess("");
                        }}
                        className="px-4 py-2.5 rounded-xl bg-surface-light hover:bg-neon-green/20 border border-border hover:border-neon-green/50 text-white hover:text-neon-green font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4 text-neon-green" />
                        <span>+ Add Player</span>
                      </button>
                    )}

                    {/* Manage Players Button for Captain */}
                    {isCaptain && (
                      <Link
                        href={`/my-team/manage/${team.id}`}
                        className="px-4 py-2.5 rounded-xl bg-neon-green/10 hover:bg-neon-green hover:text-black border border-neon-green/40 text-neon-green font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Manage Roster</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Roster Grid */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display font-bold text-sm text-gray-300 uppercase tracking-wider">
                      Squad Roster & Player Details
                    </h4>
                    {isCaptain && (
                      <button
                        onClick={() => {
                          setQuickAddTeam(team);
                          setQuickPlayerName("");
                          setQuickBgmiUid("");
                          setQuickRole("PLAYER");
                          setQuickError("");
                          setQuickSuccess("");
                        }}
                        className="text-xs text-neon-green hover:underline font-mono font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Player Manually
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team.members?.map((member: any) => {
                      const isMemberCaptain = member.role === "CAPTAIN";
                      const isSelf = member.userId === currentUser.id;

                      return (
                        <div
                          key={member.id}
                          className="p-4 rounded-2xl bg-surface-light border border-border flex items-center justify-between hover:border-neon-green/20 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center font-bold text-sm text-neon-green">
                              {(member.user?.profile?.bgmiUsername || member.user?.username || "?")
                                .charAt(0)
                                .toUpperCase()}
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

      {/* QUICK ADD PLAYER MODAL */}
      {quickAddTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">Add Player Manually</h3>
                  <p className="text-xs text-gray-400">Add to {quickAddTeam.name} [{quickAddTeam.tag}]</p>
                </div>
              </div>
              <button
                onClick={() => setQuickAddTeam(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickSuccess && (
              <div className="p-3.5 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{quickSuccess}</span>
              </div>
            )}

            {quickError && (
              <div className="p-3.5 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            <form onSubmit={handleQuickAddPlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
                  Player In-Game Name (IGN) <span className="text-neon-green">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickPlayerName}
                  onChange={(e) => setQuickPlayerName(e.target.value)}
                  placeholder="e.g. 『JONATHAN』"
                  className="w-full bg-surface-light border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
                  BGMI User ID (UID) <span className="text-neon-green">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickBgmiUid}
                  onChange={(e) => setQuickBgmiUid(e.target.value)}
                  placeholder="e.g. 5123456789"
                  className="w-full bg-surface-light border border-border rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
                  Role
                </label>
                <select
                  value={quickRole}
                  onChange={(e) => setQuickRole(e.target.value as any)}
                  className="w-full bg-surface-light border border-border rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-neon-green"
                >
                  <option value="PLAYER">Main Player</option>
                  <option value="SUBSTITUTE">Substitute</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickAddTeam(null)}
                  className="py-3 rounded-xl bg-surface-light border border-border text-white font-bold text-xs uppercase tracking-wider hover:bg-border transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickLoading}
                  className="py-3 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {quickLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {quickLoading ? "Adding..." : "Add Player"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM DETAILS MODAL */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">Edit Squad Details</h3>
                  <p className="text-xs text-gray-400">Update your squad's name and clan tag.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTeam(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editTeamError && (
              <div className="p-3.5 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs">
                {editTeamError}
              </div>
            )}

            <form onSubmit={handleEditTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
                  Team Tag
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={editTeamTag}
                  onChange={(e) => setEditTeamTag(e.target.value.toUpperCase())}
                  className="w-full bg-surface-light border border-border rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase outline-none focus:border-neon-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="py-3 rounded-xl bg-surface-light border border-border text-white font-bold text-xs uppercase tracking-wider hover:bg-border transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editTeamLoading}
                  className="py-3 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editTeamLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editTeamLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

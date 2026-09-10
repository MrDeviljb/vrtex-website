"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Ban,
  CheckCircle2,
  Shield,
  Loader2,
  AlertCircle,
  Trash2,
  Crown,
  UserCheck,
  UserX,
  X,
  Sparkles,
} from "lucide-react";

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"PLAYERS" | "TEAMS">("PLAYERS");

  // Players State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");

  // Teams State
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");

  // Action Loading & Feedback
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Confirmation Modals
  const [deleteUserModal, setDeleteUserModal] = useState<any | null>(null);
  const [deleteTeamModal, setDeleteTeamModal] = useState<any | null>(null);
  const [suspendModal, setSuspendModal] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [userSearch]);

  // Fetch Teams
  const fetchTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const res = await fetch(`/api/admin/teams?search=${encodeURIComponent(teamSearch)}`);
      const data = await res.json();
      if (data.success) {
        setTeams(data.teams || []);
      }
    } catch {
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }, [teamSearch]);

  useEffect(() => {
    if (activeTab === "PLAYERS") {
      fetchUsers();
    } else {
      fetchTeams();
    }
  }, [activeTab, fetchUsers, fetchTeams]);

  const showToast = (text: string, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Toggle Suspend/Ban directly
  const handleToggleSuspend = async (user: any) => {
    setActionLoadingId(user.id);
    const newBannedState = !user.isBanned;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          action: newBannedState ? "SUSPEND" : "UNBAN",
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isBanned: newBannedState } : u))
        );
        showToast(
          newBannedState
            ? `Player @${user.username} suspended.`
            : `Player @${user.username} activated.`
        );
      } else {
        showToast(data.message || "Failed to update account status.", true);
      }
    } catch {
      showToast("Network error updating account status.", true);
    } finally {
      setActionLoadingId(null);
      setSuspendModal(null);
    }
  };

  // Delete User Confirmation Action
  const handleConfirmDeleteUser = async () => {
    if (!deleteUserModal) return;
    setModalLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: deleteUserModal.id,
          action: "DELETE_USER",
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteUserModal.id));
        showToast(data.message || `Player @${deleteUserModal.username} deleted.`);
        setDeleteUserModal(null);
      } else {
        showToast(data.message || "Failed to delete player.", true);
      }
    } catch {
      showToast("Network error deleting player.", true);
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Team Confirmation Action
  const handleConfirmDeleteTeam = async () => {
    if (!deleteTeamModal) return;
    setModalLoading(true);

    try {
      const res = await fetch(`/api/admin/teams?id=${deleteTeamModal.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTeams((prev) => prev.filter((t) => t.id !== deleteTeamModal.id));
        showToast(data.message || `Team "${deleteTeamModal.name}" deleted.`);
        setDeleteTeamModal(null);
      } else {
        showToast(data.message || "Failed to delete team.", true);
      }
    } catch {
      showToast("Network error deleting team.", true);
    } finally {
      setModalLoading(false);
    }
  };

  // Change Role
  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    setActionLoadingId(targetUserId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action: "CHANGE_ROLE", newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
        );
        showToast(`Role updated to ${newRole}`);
      } else {
        showToast(data.message || "Failed to change role.", true);
      }
    } catch {
      showToast("Error updating user role.", true);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold block mb-1">
            PLAYER & SQUAD DIRECTORY
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
            USER & TEAM MANAGEMENT
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Search players and squads, manage privileges, enforce suspensions, or remove accounts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-surface border border-border">
          <button
            onClick={() => setActiveTab("PLAYERS")}
            className={`px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === "PLAYERS"
                ? "bg-neon-green text-black shadow-neon-green"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Players ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("TEAMS")}
            className={`px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === "TEAMS"
                ? "bg-cyan-500 text-black shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Squads & Teams ({teams.length})</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
            feedback.isError
              ? "bg-red-950/50 border-accent-red text-red-300"
              : "bg-emerald-950/50 border-neon-green text-neon-green"
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-accent-red" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-neon-green" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* TAB 1: PLAYERS VIEW */}
      {activeTab === "PLAYERS" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by username, email, BGMI UID, or ign..."
              className="w-full bg-surface border border-border focus:border-neon-green rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none font-mono"
            />
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl">
            {loadingUsers ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-3" />
                <p className="text-xs font-mono text-gray-400">Loading player accounts...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-light border-b border-border text-gray-400 font-mono uppercase">
                    <tr>
                      <th className="p-4">Account</th>
                      <th className="p-4">BGMI UID</th>
                      <th className="p-4">BGMI Username</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Captained Squads</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {users.map((u) => {
                      const isUpdating = actionLoadingId === u.id;
                      const isSuper = u.role === "SUPER_ADMIN";

                      return (
                        <tr key={u.id} className="hover:bg-surface-light/40 transition">
                          <td className="p-4">
                            <span className="font-bold text-white font-display text-sm block">
                              {u.username}
                            </span>
                            <span className="text-gray-400 font-mono text-[10px]">{u.email}</span>
                          </td>
                          <td className="p-4 font-mono text-neon-green font-semibold">
                            {u.profile?.bgmiUid || "Not linked"}
                          </td>
                          <td className="p-4 font-semibold text-gray-200">
                            {u.profile?.bgmiUsername ? `『${u.profile.bgmiUsername}』` : "—"}
                          </td>
                          <td className="p-4">
                            <select
                              value={u.role}
                              disabled={isSuper || isUpdating}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              className="bg-surface-light border border-border rounded-lg p-1.5 text-[11px] font-mono text-white outline-none focus:border-accent-gold disabled:opacity-60"
                            >
                              <option value="PLAYER">PLAYER</option>
                              <option value="TOURNAMENT_ADMIN">TOURNAMENT_ADMIN</option>
                              <option value="MODERATOR">MODERATOR</option>
                              <option value="FINANCE_ADMIN">FINANCE_ADMIN</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {u.captainTeams && u.captainTeams.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.captainTeams.map((t: any) => (
                                  <span
                                    key={t.id}
                                    className="px-2 py-0.5 rounded bg-surface-light text-accent-gold border border-accent-gold/30 text-[10px] font-mono"
                                  >
                                    [{t.tag}] {t.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 font-mono text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            {u.isBanned ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                                SUSPENDED
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-4 text-right">
                            {!isSuper && (
                              <div className="flex items-center justify-end gap-2">
                                {/* Suspend / Unsuspend Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuspend(u)}
                                  disabled={isUpdating}
                                  title={u.isBanned ? "Activate / Unban Account" : "Suspend Account"}
                                  className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border transition flex items-center gap-1.5 ${
                                    u.isBanned
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500 hover:text-black"
                                      : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-black"
                                  } disabled:opacity-50`}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : u.isBanned ? (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <Ban className="w-3.5 h-3.5" />
                                  )}
                                  <span>{u.isBanned ? "Activate" : "Suspend"}</span>
                                </button>

                                {/* Delete User Button */}
                                <button
                                  type="button"
                                  onClick={() => setDeleteUserModal(u)}
                                  disabled={isUpdating}
                                  title="Delete Player Account"
                                  className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 transition disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS VIEW */}
      {activeTab === "TEAMS" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              placeholder="Search by team name, tag, or captain..."
              className="w-full bg-surface border border-border focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none font-mono"
            />
          </div>

          {/* Teams Table */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl">
            {loadingTeams ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                <p className="text-xs font-mono text-gray-400">Loading squad directory...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="py-16 text-center text-gray-400 font-mono text-xs">
                No teams found matching search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-light border-b border-border text-gray-400 font-mono uppercase">
                    <tr>
                      <th className="p-4">Squad Name</th>
                      <th className="p-4">Tag</th>
                      <th className="p-4">Team Captain</th>
                      <th className="p-4">Members</th>
                      <th className="p-4">Tournaments Registered</th>
                      <th className="p-4">Created Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {teams.map((t) => (
                      <tr key={t.id} className="hover:bg-surface-light/40 transition">
                        <td className="p-4">
                          <span className="font-bold text-white font-display text-sm block">
                            {t.name}
                          </span>
                          <span className="text-gray-400 font-mono text-[10px]">ID: {t.id}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-cyan-400">
                          [{t.tag}]
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-accent-gold" />
                            <span className="font-bold text-gray-200">
                              @{t.captain?.username}
                            </span>
                          </div>
                          {t.captain?.profile?.bgmiUsername && (
                            <span className="text-[10px] font-mono text-gray-400 block">
                              『{t.captain.profile.bgmiUsername}』
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-gray-300">
                          {t._count?.members || t.members?.length || 0} Players
                        </td>
                        <td className="p-4">
                          {t.registrations && t.registrations.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {t.registrations.map((reg: any) => (
                                <span
                                  key={reg.id || reg.tournament?.id}
                                  className="px-2 py-0.5 rounded bg-surface-light text-neon-green border border-neon-green/30 text-[10px] font-mono"
                                >
                                  {reg.tournament?.title}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 font-mono text-[11px]">None</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-gray-400">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteTeamModal(t)}
                            title="Delete Squad"
                            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 font-mono text-[11px] font-bold transition flex items-center gap-1.5 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Team</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DELETE USER CONFIRMATION */}
      {deleteUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e1422] border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-display font-black text-xl text-white">Delete Player Account</h3>
              </div>
              <button
                onClick={() => setDeleteUserModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-surface-light border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Username</span>
                <span className="text-white font-bold">@{deleteUserModal.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-gray-300 font-mono">{deleteUserModal.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">BGMI UID</span>
                <span className="text-neon-green font-mono">{deleteUserModal.profile?.bgmiUid || "None"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono">
              ⚠ WARNING: Deleting this player will remove their account, profile, team memberships, and any captained squads.
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteUserModal(null)}
                className="py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={modalLoading}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{modalLoading ? "Deleting..." : "Delete Player"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE TEAM CONFIRMATION */}
      {deleteTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e1422] border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-display font-black text-xl text-white">Delete Squad / Team</h3>
              </div>
              <button
                onClick={() => setDeleteTeamModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-surface-light border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Squad Name</span>
                <span className="text-white font-bold">{deleteTeamModal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tag</span>
                <span className="text-cyan-400 font-mono font-bold">[{deleteTeamModal.tag}]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Captain</span>
                <span className="text-accent-gold font-bold">@{deleteTeamModal.captain?.username}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono">
              ⚠ WARNING: Deleting this squad will remove all roster memberships and release any tournament registrations held by this team.
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTeamModal(null)}
                className="py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTeam}
                disabled={modalLoading}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{modalLoading ? "Deleting..." : "Delete Squad"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const AVAILABLE_PERMISSIONS = [
  { id: "MANAGE_TOURNAMENTS", label: "Manage Tournaments & Scrims" },
  { id: "MANAGE_REGISTRATIONS", label: "Manage Team Registrations" },
  { id: "APPROVE_PAYMENTS", label: "Approve & Reject Payments" },
  { id: "MANAGE_SLOTS", label: "Manage & Reassign Slots" },
  { id: "MANAGE_ROOMS", label: "Manage & Release Match Rooms" },
  { id: "ENTER_RESULTS", label: "Enter Match Results" },
  { id: "PUBLISH_LEADERBOARD", label: "Publish Tournament Leaderboard" },
  { id: "HANDLE_SUPPORT", label: "Handle Support Tickets" },
];

export default function AdminModeratorsPage() {
  const [moderators, setModerators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "MANAGE_TOURNAMENTS",
    "MANAGE_REGISTRATIONS",
    "APPROVE_PAYMENTS",
    "MANAGE_SLOTS",
    "MANAGE_ROOMS",
    "ENTER_RESULTS",
  ]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchModerators();
  }, []);

  async function fetchModerators() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/moderators");
      const json = await res.json();
      if (json.success) {
        setModerators(json.moderators);
      } else {
        setError(json.message || "Failed to load moderators.");
      }
    } catch (err) {
      setError("Network error fetching moderators.");
    } finally {
      setLoading(false);
    }
  }

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreateModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Password and Confirm Password do not match.");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/admin/moderators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          confirmPassword,
          displayName,
          permissions: selectedPermissions,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setDisplayName("");
        await fetchModerators();
      } else {
        alert(json.message || "Failed to create moderator.");
      }
    } catch (err) {
      alert("Error creating moderator.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (mod: any) => {
    if (!confirm(`Are you sure you want to delete moderator "${mod.username}"?`)) return;

    try {
      const res = await fetch(`/api/admin/moderators/${mod.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        await fetchModerators();
      } else {
        alert(json.message || "Failed to delete moderator.");
      }
    } catch (err) {
      alert("Error deleting moderator.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">
            Moderator Management
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Super Admin Access Control: Assign granular operational permissions for tournament staff.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-900/30"
        >
          + CREATE MODERATOR
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-sm">
          Loading moderator accounts...
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-500/40 p-4 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      ) : moderators.length === 0 ? (
        <div className="bg-[#121827] border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
          No moderator accounts created yet. Click "+ CREATE MODERATOR" to grant staff access.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {moderators.map((mod) => {
            let perms: string[] = [];
            try {
              perms = JSON.parse(mod.permissions || "[]");
            } catch {
              perms = [];
            }

            return (
              <div
                key={mod.id}
                className="bg-[#121827] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      🛡️ {mod.username}
                      <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                        {mod.role}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {mod.profile?.bio || "Tournament Referee"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(mod)}
                    className="text-red-400 hover:text-red-300 text-xs font-mono bg-red-950/40 border border-red-500/30 px-2.5 py-1 rounded-lg"
                  >
                    DELETE
                  </button>
                </div>

                <div className="border-t border-gray-800 pt-3">
                  <p className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                    Granted Permissions ({perms.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {perms.map((p) => (
                      <span
                        key={p}
                        className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono px-2 py-0.5 rounded"
                      >
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Moderator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white uppercase font-mono">
                + Create Moderator Account
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateModerator} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mod_devil"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Referee"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 uppercase tracking-wider font-bold">
                  Operational Permissions:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-black/40 p-3 rounded-xl border border-gray-800">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label key={perm.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                      />
                      <span className="text-[11px] text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold py-3 rounded-xl uppercase tracking-wider"
                >
                  {creating ? "CREATING..." : "CREATE MODERATOR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

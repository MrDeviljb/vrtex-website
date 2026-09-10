"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/registrations");
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations || []);
      }
    } catch {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (registrationId: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRegistrations();
      }
    } catch {
      alert("Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold block mb-1">
          ROSTER VERIFICATION & APPROVALS
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          REGISTRATION MANAGEMENT
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Review entered squads, authenticated BGMI player IDs, and toggle team eligibility for room releases.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent-gold animate-spin mb-3" />
            <p className="text-xs font-mono text-gray-400">Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No registrations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border text-gray-400 font-mono uppercase">
                <tr>
                  <th className="p-4">Squad</th>
                  <th className="p-4">Captain</th>
                  <th className="p-4">BGMI UID</th>
                  <th className="p-4">Players</th>
                  <th className="p-4">Tournament</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-surface-light/40 transition">
                    <td className="p-4 font-bold text-white font-display text-sm">
                      {reg.team?.name} <span className="text-gray-500 font-mono text-[10px]">[{reg.team?.tag}]</span>
                    </td>
                    <td className="p-4 font-semibold text-gray-300">
                      {reg.team?.captain?.profile?.bgmiUsername || reg.team?.captain?.username}
                    </td>
                    <td className="p-4 font-mono text-neon-green">
                      {reg.team?.captain?.profile?.bgmiUid || "Unverified"}
                    </td>
                    <td className="p-4 font-mono text-gray-300">
                      {reg.team?.members?.length || 0} players
                    </td>
                    <td className="p-4 font-semibold text-white truncate max-w-[150px]">
                      {reg.tournament?.title}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          reg.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : reg.status === "REJECTED"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : reg.status === "DISQUALIFIED"
                            ? "bg-red-900/40 text-red-300 border border-red-500"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-gray-400">
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {reg.status !== "APPROVED" && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, "APPROVED")}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black font-mono font-bold text-[11px] border border-emerald-500/30"
                        >
                          Approve
                        </button>
                      )}
                      {reg.status !== "REJECTED" && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, "REJECTED")}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-black font-mono font-bold text-[11px] border border-red-500/30"
                        >
                          Reject
                        </button>
                      )}
                      {reg.status !== "DISQUALIFIED" && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, "DISQUALIFIED")}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-surface-light hover:bg-red-900/50 text-gray-400 hover:text-red-300 font-mono text-[11px] border border-border"
                        >
                          Disqualify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

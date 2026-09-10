"use client";

import React, { useState, useEffect } from "react";
import { FileText, Shield, Loader2, Clock } from "lucide-react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold block mb-1">
          COMPLIANCE & TRACEABILITY
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          OPERATIONAL AUDIT LOG
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Immutable event log of administrative actions including custom room releases, team approvals, suspensions, and prize payouts.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent-gold animate-spin mb-3" />
            <p className="text-xs font-mono text-gray-400">Loading audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border text-gray-400 font-mono uppercase">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin Operator</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-light/40 transition font-mono">
                    <td className="p-4 text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white block">
                        @{log.admin?.username || "Unknown"}
                      </span>
                      <span className="text-[10px] text-accent-gold">{log.admin?.role}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-light border border-border text-neon-green">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-gray-200 font-semibold font-sans">{log.target}</td>
                    <td className="p-4 text-gray-400 max-w-xs font-sans text-xs truncate">
                      {log.details || "—"}
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

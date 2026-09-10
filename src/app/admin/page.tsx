"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Trophy,
  Flame,
  UserCheck,
  Award,
  Clock,
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin mb-3" />
        <p className="text-xs font-mono text-gray-400">Loading operations dashboard...</p>
      </div>
    );
  }

  const stats = data?.stats || {};

  const kpis = [
    { label: "TOTAL USERS", value: stats.totalUsers || 0, icon: Users, color: "text-blue-400" },
    { label: "TOTAL SQUADS", value: stats.totalTeams || 0, icon: Trophy, color: "text-emerald-400" },
    { label: "LIVE TOURNAMENTS", value: stats.liveTournaments || 0, icon: Flame, color: "text-red-400" },
    { label: "UPCOMING EVENTS", value: stats.upcomingTournaments || 0, icon: Clock, color: "text-purple-400" },
    { label: "ACTIVE SCRIMS", value: stats.activeScrims || 0, icon: Flame, color: "text-orange-400" },
    { label: "PENDING REGISTRATIONS", value: stats.pendingRegistrations || 0, icon: UserCheck, color: "text-amber-400" },
    { label: "TOTAL PRIZE POOL", value: `₹${(stats.totalPrizePool || 0).toLocaleString()}`, icon: Award, color: "text-neon-green" },
    { label: "COMPLETED MATCHES", value: stats.completedMatches || 0, icon: Shield, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-10">
      {/* Top Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold block mb-1">
          COMMAND CENTER
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          ESPORTS OPERATIONS DASHBOARD
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Real-time telemetry, squad registrations, custom room releases, and match result processing.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-card-glow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="font-display font-black text-2xl sm:text-3xl text-white">
                {kpi.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Registrations & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Registrations */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 shadow-card-glow">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h3 className="font-display font-bold text-lg text-white">
              Recent Team Registrations
            </h3>
            <Link
              href="/admin/registrations"
              className="text-xs text-accent-gold font-mono hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-2">
            {data?.recentRegistrations?.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No recent registrations.</p>
            ) : (
              data?.recentRegistrations?.map((reg: any) => (
                <div
                  key={reg.id}
                  className="p-3 rounded-xl bg-surface-light border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-display font-bold text-white text-sm block">
                      {reg.team?.name}
                    </span>
                    <span className="text-gray-400 text-[11px] font-mono">
                      Tournament: {reg.tournament?.title}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      reg.status === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {reg.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Operational Audit Trail */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-6 shadow-card-glow">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h3 className="font-display font-bold text-lg text-white">
              Recent Audit Log
            </h3>
            <Link
              href="/admin/audit-logs"
              className="text-xs text-accent-gold font-mono hover:underline"
            >
              Full Log →
            </Link>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data?.recentAuditLogs?.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No audit logs recorded yet.</p>
            ) : (
              data?.recentAuditLogs?.map((log: any) => (
                <div key={log.id} className="text-xs border-l-2 border-accent-gold pl-3 py-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span className="text-accent-gold font-bold">@{log.admin?.username}</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="font-semibold text-gray-200 mt-0.5">{log.action}: {log.target}</p>
                  {log.details && <p className="text-[11px] text-gray-400 mt-0.5">{log.details}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

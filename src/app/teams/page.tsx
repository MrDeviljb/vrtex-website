"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Trophy, Shield, Plus, Loader2, ArrowRight } from "lucide-react";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (data.success) {
        setTeams(data.teams || []);
      }
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green block mb-1">
            BGMI SQUADS & ROSTERS
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
            REGISTERED TEAMS
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Browse verified rosters, active squad captains, and tournament participation.
          </p>
        </div>

        <Link
          href="/my-team"
          className="px-6 py-3 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-xs uppercase tracking-wider transition shadow-neon-green flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create or Manage Team</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">Loading squads...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="py-16 text-center bg-surface rounded-2xl border border-border p-8">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xl text-white">No Teams Registered Yet</h3>
          <p className="text-xs text-gray-400 mt-1">Be the first squad to register for competitive BGMI seasons!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-surface border border-border hover:border-neon-green/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-card-glow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-surface-light border border-neon-green/30 flex items-center justify-center font-display font-extrabold text-lg text-neon-green">
                    {team.tag}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-surface-light text-gray-300 border border-border">
                    {team.members.length} Players
                  </span>
                </div>

                <h3 className="font-display font-bold text-2xl text-white mb-1">
                  {team.name}
                </h3>
                <p className="text-xs text-gray-400 font-mono mb-4">
                  Captain: <span className="text-white font-semibold">{team.captain.profile?.bgmiUsername || team.captain.username}</span>
                </p>

                {/* Roster Badges */}
                <div className="space-y-1.5 mb-6">
                  <span className="text-[10px] uppercase font-mono text-gray-500 block">ACTIVE ROSTER</span>
                  <div className="flex flex-wrap gap-1.5">
                    {team.members.map((m: any) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded text-[11px] bg-surface-light border border-border text-gray-300 font-mono"
                      >
                        {m.role === "CAPTAIN" ? "👑 " : ""}{m.user.profile?.bgmiUsername || m.user.username}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">
                  Tournaments: <span className="text-white font-bold">{team._count.registrations}</span>
                </span>
                <span className="text-neon-green font-bold">
                  Matches: {team._count.results}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

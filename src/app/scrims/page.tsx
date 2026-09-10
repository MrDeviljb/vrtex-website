"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Users, Clock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";

export default function ScrimsPage() {
  const [scrims, setScrims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScrims();
  }, []);

  const fetchScrims = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments?isScrim=true");
      const data = await res.json();
      if (data.success) {
        setScrims(data.tournaments || []);
      }
    } catch {
      setScrims([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <Flame className="w-3.5 h-3.5" /> DAILY TIER-1 PRACTICE LOBBIES
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
          BGMI COMPETITIVE SCRIMS
        </h1>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          Daily high-tempo squad practice. Test rotations, refine zone pushes, and evaluate substitute rosters against verified competitive teams.
        </p>
      </div>

      {/* Scrim Cards Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">Loading scrim schedules...</p>
        </div>
      ) : scrims.length === 0 ? (
        <div className="py-16 text-center bg-surface rounded-2xl border border-border">
          <Flame className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xl text-white">No Active Scrims Right Now</h3>
          <p className="text-xs text-gray-400 mt-1">Admin will post evening tier scrims shortly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scrims.map((scrim) => {
            const regCount = scrim._count?.registrations || 0;
            return (
              <div
                key={scrim.id}
                className="bg-surface border border-border hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-card-glow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/30 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> DAILY SCRIM
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neon-green/10 text-neon-green font-mono text-xs font-bold border border-neon-green/30">
                      FREE ENTRY
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-xl text-white mb-2">
                    {scrim.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-6 leading-relaxed">
                    {scrim.description}
                  </p>

                  {/* Spec Pills */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-light border border-border text-center text-xs mb-6">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">START TIME</span>
                      <span className="font-semibold text-white font-mono">
                        {new Date(scrim.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">MODE</span>
                      <span className="font-semibold text-white">{scrim.gameMode} ({scrim.perspective})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">SLOTS</span>
                      <span className="font-semibold text-neon-green font-mono">
                        {regCount} / {scrim.maxTeams}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/tournament/${scrim.slug}`}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>JOIN SCRIM</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

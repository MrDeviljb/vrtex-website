"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Flame, Medal, Shield, Loader2, Sparkles } from "lucide-react";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<"overall" | "weekly" | "monthly">("overall");

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedType]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=${selectedType}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch {
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/30 text-accent-gold text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <Trophy className="w-3.5 h-3.5" /> OFFICIAL BGMI ESPORTS STANDINGS
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
          GLOBAL SQUAD LEADERBOARD
        </h1>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          Rankings calculated automatically using standard competitive placement points and kill multipliers across verified tournament matches.
        </p>
      </div>

      {/* Sorting Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-surface p-1.5 rounded-xl border border-border flex items-center gap-2 text-xs">
          {(["overall", "weekly", "monthly"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-5 py-2 rounded-lg font-bold uppercase font-display tracking-wider transition ${
                selectedType === type
                  ? "bg-neon-green text-black shadow-neon-green"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {type === "overall" ? "Overall Standings" : `${type} Circuit`}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
          {/* Rank 2 */}
          <div className="p-6 rounded-2xl bg-surface border border-slate-500/40 text-center shadow-card-glow order-2 md:order-1">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-500/20 text-slate-300 flex items-center justify-center font-display font-extrabold text-xl mb-3">
              #2
            </div>
            <h3 className="font-display font-bold text-2xl text-white">{leaderboard[1].name}</h3>
            <span className="text-xs font-mono text-gray-400">TAG: [{leaderboard[1].tag}]</span>
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-gray-500 block">WWCD</span>
                <span className="font-bold text-white">{leaderboard[1].wwcd}</span>
              </div>
              <div>
                <span className="text-gray-500 block">TOTAL PTS</span>
                <span className="font-bold text-neon-green text-base">{leaderboard[1].totalPoints}</span>
              </div>
            </div>
          </div>

          {/* Rank 1 - Champion */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-surface-light via-surface to-background border-2 border-accent-gold text-center shadow-2xl relative order-1 md:order-2 -translate-y-2">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent-gold text-black font-extrabold text-xs tracking-wider uppercase font-mono shadow-md">
              👑 CURRENT #1 SQUAD
            </div>
            <div className="w-16 h-16 mx-auto rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center font-display font-extrabold text-3xl mb-3 mt-2 shadow-lg">
              #1
            </div>
            <h3 className="font-display font-extrabold text-3xl text-white">{leaderboard[0].name}</h3>
            <span className="text-xs font-mono text-neon-green">TAG: [{leaderboard[0].tag}]</span>
            <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <span className="text-gray-400 block">MATCHES</span>
                <span className="font-bold text-white">{leaderboard[0].matches}</span>
              </div>
              <div>
                <span className="text-gray-400 block">WWCD</span>
                <span className="font-bold text-accent-gold">{leaderboard[0].wwcd}</span>
              </div>
              <div>
                <span className="text-gray-400 block">TOTAL PTS</span>
                <span className="font-extrabold text-neon-green text-lg">{leaderboard[0].totalPoints}</span>
              </div>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="p-6 rounded-2xl bg-surface border border-amber-800/40 text-center shadow-card-glow order-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-800/20 text-amber-500 flex items-center justify-center font-display font-extrabold text-xl mb-3">
              #3
            </div>
            <h3 className="font-display font-bold text-2xl text-white">{leaderboard[2].name}</h3>
            <span className="text-xs font-mono text-gray-400">TAG: [{leaderboard[2].tag}]</span>
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-gray-500 block">WWCD</span>
                <span className="font-bold text-white">{leaderboard[2].wwcd}</span>
              </div>
              <div>
                <span className="text-gray-500 block">TOTAL PTS</span>
                <span className="font-bold text-neon-green text-base">{leaderboard[2].totalPoints}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-3" />
            <p className="text-xs font-mono text-gray-400">Calculating standings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            No match results recorded yet. Results will appear after official matches complete.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border text-gray-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Squad Name</th>
                  <th className="p-4 text-center">Matches</th>
                  <th className="p-4 text-center">WWCD</th>
                  <th className="p-4 text-center">Total Kills</th>
                  <th className="p-4 text-center">Placement PTS</th>
                  <th className="p-4 text-center">Kill PTS</th>
                  <th className="p-4 text-center">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {leaderboard.map((item) => (
                  <tr key={item.teamId} className="hover:bg-surface-light/40 transition">
                    <td className="p-4 font-mono font-bold">
                      <span className={`px-2.5 py-1 rounded text-xs ${
                        item.rank === 1
                          ? "bg-accent-gold/20 text-accent-gold border border-accent-gold/40"
                          : item.rank === 2
                          ? "bg-slate-400/20 text-slate-300"
                          : item.rank === 3
                          ? "bg-amber-800/20 text-amber-500"
                          : "text-gray-400"
                      }`}>
                        #{item.rank}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white font-display text-sm">
                      {item.name} <span className="text-[10px] text-gray-500 font-mono">[{item.tag}]</span>
                    </td>
                    <td className="p-4 text-center font-mono text-gray-300">{item.matches}</td>
                    <td className="p-4 text-center font-mono font-bold text-accent-gold">{item.wwcd}</td>
                    <td className="p-4 text-center font-mono text-gray-300">{item.kills}</td>
                    <td className="p-4 text-center font-mono text-gray-400">{item.placementPoints}</td>
                    <td className="p-4 text-center font-mono text-gray-400">{item.killPoints}</td>
                    <td className="p-4 text-center font-mono font-black text-neon-green text-sm">
                      {item.totalPoints}
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

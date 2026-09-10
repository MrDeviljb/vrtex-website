"use client";

import React, { useState, useEffect } from "react";
import TournamentCard from "@/components/TournamentCard";
import { Search, Trophy, Filter, Loader2, Sparkles } from "lucide-react";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedFee, setSelectedFee] = useState("ALL"); // ALL | FREE | PAID
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | TOURNAMENT | SCRIM

  const filterTabs = [
    { label: "All", value: "ALL" },
    { label: "Live", value: "LIVE" },
    { label: "Registration Open", value: "REGISTRATION_OPEN" },
    { label: "Upcoming", value: "UPCOMING" },
    { label: "Completed", value: "COMPLETED" },
  ];

  useEffect(() => {
    fetchTournaments();
  }, [selectedFilter, selectedFee, typeFilter]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      let url = `/api/tournaments?`;
      if (selectedFilter !== "ALL") url += `status=${selectedFilter}&`;
      if (selectedFee === "FREE") url += `fee=free&`;
      if (selectedFee === "PAID") url += `fee=paid&`;
      if (typeFilter === "SCRIM") url += `isScrim=true&`;
      if (typeFilter === "TOURNAMENT") url += `isScrim=false&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTournaments(data.tournaments || []);
      }
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    if (!searchTerm) return true;
    return (
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-neon-green mb-2">
          <Trophy className="w-4 h-4" /> OFFICIAL BGMI ESPORTS EVENTS
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
          BGMI TOURNAMENTS & SCRIMS
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Register your squad for official Tier-1 championships, weekly invitationals, and daily free practice matches.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-4 mb-8">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tournaments by name or map..."
              className="w-full bg-surface border border-border focus:border-neon-green rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition"
            />
          </div>

          {/* Type Select (Tournament vs Scrim) */}
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
                typeFilter === "ALL"
                  ? "bg-neon-green text-black border-neon-green"
                  : "bg-surface text-gray-300 border-border hover:bg-surface-light"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter("TOURNAMENT")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
                typeFilter === "TOURNAMENT"
                  ? "bg-neon-green text-black border-neon-green"
                  : "bg-surface text-gray-300 border-border hover:bg-surface-light"
              }`}
            >
              Tournaments
            </button>
            <button
              onClick={() => setTypeFilter("SCRIM")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
                typeFilter === "SCRIM"
                  ? "bg-neon-green text-black border-neon-green"
                  : "bg-surface text-gray-300 border-border hover:bg-surface-light"
              }`}
            >
              Scrims
            </button>
          </div>
        </div>

        {/* Status Filters & Fee Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedFilter(tab.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  selectedFilter === tab.value
                    ? "bg-surface-light text-neon-green border-neon-green/40 shadow-neon-green"
                    : "bg-surface text-gray-400 border-border hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Free vs Paid Toggle */}
          <div className="flex items-center gap-1.5 bg-surface p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setSelectedFee("ALL")}
              className={`px-3 py-1 rounded-md transition ${
                selectedFee === "ALL" ? "bg-surface-light text-white font-bold" : "text-gray-400"
              }`}
            >
              All Fees
            </button>
            <button
              onClick={() => setSelectedFee("FREE")}
              className={`px-3 py-1 rounded-md transition ${
                selectedFee === "FREE" ? "bg-neon-green/20 text-neon-green font-bold" : "text-gray-400"
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setSelectedFee("PAID")}
              className={`px-3 py-1 rounded-md transition ${
                selectedFee === "PAID" ? "bg-accent-gold/20 text-accent-gold font-bold" : "text-gray-400"
              }`}
            >
              Paid
            </button>
          </div>
        </div>
      </div>

      {/* Tournament Cards Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">Loading tournaments...</p>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="py-20 text-center bg-surface rounded-2xl border border-border p-8">
          <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xl text-white mb-1">No Tournaments Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try adjusting your search filters or check back later for new registrations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </div>
  );
}

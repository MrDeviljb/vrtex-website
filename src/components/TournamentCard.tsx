import React from "react";
import Link from "next/link";
import { Trophy, Users, MapPin, Clock, Calendar, ArrowRight, Shield } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

interface TournamentCardProps {
  tournament: {
    id: string;
    title: string;
    slug: string;
    bannerUrl?: string | null;
    gameMode: string;
    perspective: string;
    maxTeams: number;
    entryFee: number;
    prizePool: number;
    regEnd: string | Date;
    startDate: string | Date;
    status: string;
    isScrim?: boolean;
    _count?: {
      registrations: number;
      matches: number;
    };
  };
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  const registeredCount = tournament._count?.registrations || 0;
  const isFree = tournament.entryFee === 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-live animate-pulse flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>LIVE</span>;
      case "REGISTRATION_OPEN":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-open flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>REG OPEN</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-completed">COMPLETED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-upcoming">{status.replace("_", " ")}</span>;
    }
  };

  return (
    <div className="group relative bg-surface border border-border/80 hover:border-neon-green/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-neon-glow flex flex-col">
      {/* Banner / Header Image */}
      <div className="relative h-44 w-full overflow-hidden bg-surface-light">
        <img
          src={tournament.bannerUrl || "/bgmi_hero.jpg"}
          alt={tournament.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

        {/* Badges on Banner */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {getStatusBadge(tournament.status)}
          {tournament.isScrim && (
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-500/20 border border-purple-500/40 text-purple-300">
              SCRIM
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${isFree ? "bg-neon-green/20 text-neon-green border border-neon-green/40" : "bg-accent-gold/20 text-accent-gold border border-accent-gold/40"}`}>
            {isFree ? "FREE ENTRY" : `₹${tournament.entryFee} ENTRY`}
          </span>
        </div>

        {/* Prize Pool Display */}
        <div className="absolute bottom-3 left-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">PRIZE POOL</p>
          <p className="font-display font-black text-2xl text-white tracking-wide flex items-center gap-1">
            <span className="text-neon-green">₹</span>
            {tournament.prizePool.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-white group-hover:text-neon-green transition line-clamp-1 mb-3">
            {tournament.title}
          </h3>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-surface-light/60 rounded-xl border border-border/60 text-xs mb-4">
            <div>
              <span className="text-gray-400 text-[10px] block">MODE</span>
              <span className="font-semibold text-white">{tournament.gameMode} ({tournament.perspective})</span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] block">SLOTS</span>
              <span className="font-semibold text-white font-mono">
                {registeredCount} / {tournament.maxTeams}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] block">START TIME</span>
              <span className="font-semibold text-white font-mono">
                {new Date(tournament.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {/* Countdown Indicator */}
          {tournament.status === "REGISTRATION_OPEN" && (
            <div className="mb-4 text-xs flex items-center justify-between px-2 text-gray-400">
              <span>Registration Closes:</span>
              <CountdownTimer targetDate={tournament.regEnd} />
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Link
          href={`/tournament/${tournament.slug}`}
          className="w-full py-2.5 px-4 rounded-xl bg-surface-light group-hover:bg-neon-green border border-border group-hover:border-neon-green text-white group-hover:text-black font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span>VIEW TOURNAMENT</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

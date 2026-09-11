import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TournamentCard from "@/components/TournamentCard";
import CountdownTimer from "@/components/CountdownTimer";
import {
  Trophy,
  Flame,
  ShieldCheck,
  Zap,
  Users,
  Award,
  ChevronRight,
  Instagram,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch featured tournaments & scrims
  const [featuredTourney, liveTourneys, upcomingTourneys, activeScrims, recentResults] =
    await Promise.all([
      prisma.tournament.findFirst({
        where: { status: { in: ["LIVE", "REGISTRATION_OPEN"] }, isScrim: false },
        include: { _count: { select: { registrations: true, matches: true } } },
        orderBy: { prizePool: "desc" },
      }),
      prisma.tournament.findMany({
        where: { status: "LIVE", isScrim: false },
        include: { _count: { select: { registrations: true, matches: true } } },
        take: 3,
      }),
      prisma.tournament.findMany({
        where: { status: { in: ["UPCOMING", "REGISTRATION_OPEN"] }, isScrim: false },
        include: { _count: { select: { registrations: true, matches: true } } },
        orderBy: { startDate: "asc" },
        take: 6,
      }),
      prisma.tournament.findMany({
        where: { isScrim: true },
        include: { _count: { select: { registrations: true, matches: true } } },
        orderBy: { startDate: "asc" },
        take: 3,
      }),
      prisma.result.findMany({
        where: { placement: 1 },
        include: {
          team: true,
          match: { include: { tournament: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  // Aggregate stats
  const [totalTourneys, totalTeamsCount, totalPrizePool] = await Promise.all([
    prisma.tournament.count(),
    prisma.team.count(),
    prisma.tournament.aggregate({ _sum: { prizePool: true } }),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 border-b border-border/60">
        {/* Background Gradients & Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-green/10 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-light border border-neon-green/40 shadow-neon-green">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green">
                  BGMI SEASON 2026 OFFICIAL CIRCUIT
                </span>
              </div>

              <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05]">
                DOMINATE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-emerald-400 to-white neon-text-glow">BATTLEGROUND</span>
              </h1>

              <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
                Compete in BGMI tournaments and scrims. Build your squad, climb the leaderboard and win.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/tournaments"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-sm tracking-wider uppercase transition shadow-neon-green hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Browse Tournaments</span>
                </Link>
                <Link
                  href="/scrims"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface hover:bg-surface-light border border-border hover:border-neon-green text-white font-bold text-sm tracking-wider uppercase transition flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Join Scrims</span>
                </Link>
              </div>

              {/* Platform Metrics Bar */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/80 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                    ₹{(totalPrizePool._sum.prizePool || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] font-mono text-gray-400 uppercase">Prize Pool</p>
                </div>
                <div>
                  <p className="font-display font-extrabold text-2xl sm:text-3xl text-neon-green">
                    {totalTeamsCount}+
                  </p>
                  <p className="text-[11px] font-mono text-gray-400 uppercase">Registered Squads</p>
                </div>
                <div>
                  <p className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                    100%
                  </p>
                  <p className="text-[11px] font-mono text-gray-400 uppercase">Anti-Cheat Fair Play</p>
                </div>
              </div>
            </div>

            {/* Right Hero: Featured Live / Upcoming Card */}
            <div className="lg:col-span-5">
              {featuredTourney ? (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-neon-green/40 to-emerald-600/40 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
                  <div className="relative bg-surface border border-neon-green/40 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-neon-green/20 border border-neon-green/40 text-neon-green flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-neon-green" /> FEATURED CHAMPIONSHIP
                      </span>
                      <span className="font-mono text-xs text-gray-400">
                        {featuredTourney.gameMode} ({featuredTourney.perspective})
                      </span>
                    </div>

                    <div className="h-48 rounded-xl overflow-hidden mb-4 relative bg-surface-light">
                      <img
                        src={featuredTourney.bannerUrl || "/bgmi_hero.jpg"}
                        alt={featuredTourney.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">PRIZE POOL</span>
                        <span className="font-display font-black text-3xl text-white">
                          ₹{featuredTourney.prizePool.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-2xl text-white mb-2 line-clamp-1">
                      {featuredTourney.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                      {featuredTourney.description}
                    </p>

                    <div className="p-3 bg-surface-light rounded-xl border border-border flex items-center justify-between text-xs mb-4">
                      <div>
                        <span className="text-gray-400 text-[10px] block">SLOTS AVAILABLE</span>
                        <span className="font-bold text-white font-mono">
                          {featuredTourney._count.registrations} / {featuredTourney.maxTeams} Teams
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] block">STARTS IN</span>
                        <CountdownTimer targetDate={featuredTourney.startDate} />
                      </div>
                    </div>

                    <Link
                      href={`/tournament/${featuredTourney.slug}`}
                      className="w-full py-3 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-bold text-sm tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-neon-green"
                    >
                      <span>ENTER TOURNAMENT</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-surface border border-border text-center">
                  <Trophy className="w-12 h-12 text-neon-green mx-auto mb-3" />
                  <h3 className="font-display text-xl font-bold text-white mb-1">New Seasons Starting</h3>
                  <p className="text-xs text-gray-400 mb-4">Check upcoming tournament schedules below.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: LIVE SCRIMS & TOURNAMENTS */}
      <section className="py-16 bg-[#0a0d14] border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-orange-400 mb-1">
                <Flame className="w-4 h-4" /> DAILY PRACTICE
              </div>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
                LIVE COMPETITIVE SCRIMS
              </h2>
            </div>
            <Link
              href="/scrims"
              className="text-xs font-bold text-neon-green hover:underline flex items-center gap-1 uppercase tracking-wider font-mono"
            >
              <span>View All Scrims</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeScrims.map((scrim) => (
              <TournamentCard key={scrim.id} tournament={scrim} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: UPCOMING TOURNAMENTS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-neon-green mb-1">
                <Trophy className="w-4 h-4" /> OFFICIAL CASH PRIZES
              </div>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
                UPCOMING BGMI CHAMPIONSHIPS
              </h2>
            </div>
            <Link
              href="/tournaments"
              className="text-xs font-bold text-neon-green hover:underline flex items-center gap-1 uppercase tracking-wider font-mono"
            >
              <span>Explore All Tournaments</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingTourneys.map((tourney) => (
              <TournamentCard key={tourney.id} tournament={tourney} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="py-20 bg-surface/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green block mb-2">
            STEP-BY-STEP WORKFLOW
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-12">
            HOW TO COMPETE & WIN
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-border text-left relative overflow-hidden group hover:border-neon-green/40 transition">
              <span className="font-mono font-black text-4xl text-surface-light group-hover:text-neon-green/20 transition absolute top-4 right-4">
                01
              </span>
              <div className="w-12 h-12 rounded-xl bg-surface-light border border-border flex items-center justify-center text-neon-green mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-2">Create Account & Verify</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sign up and verify your in-game BGMI UID directly through our official ALUU name verification integration.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border text-left relative overflow-hidden group hover:border-neon-green/40 transition">
              <span className="font-mono font-black text-4xl text-surface-light group-hover:text-neon-green/20 transition absolute top-4 right-4">
                02
              </span>
              <div className="w-12 h-12 rounded-xl bg-surface-light border border-border flex items-center justify-center text-neon-green mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-2">Build Your Squad</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Create a squad, invite your 4 core teammates using unique team invite codes, and confirm your roster.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border text-left relative overflow-hidden group hover:border-neon-green/40 transition">
              <span className="font-mono font-black text-4xl text-surface-light group-hover:text-neon-green/20 transition absolute top-4 right-4">
                03
              </span>
              <div className="w-12 h-12 rounded-xl bg-surface-light border border-border flex items-center justify-center text-neon-green mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-2">Instant Room Access</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Room credentials unlock automatically on match day at the scheduled release time. Copy Room ID and password in 1-click.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border text-left relative overflow-hidden group hover:border-neon-green/40 transition">
              <span className="font-mono font-black text-4xl text-surface-light group-hover:text-neon-green/20 transition absolute top-4 right-4">
                04
              </span>
              <div className="w-12 h-12 rounded-xl bg-surface-light border border-border flex items-center justify-center text-neon-green mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-2">Climb & Cash Out</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Referees publish verified match results. Points update dynamically on the leaderboard with instant prize processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: RECENT WINNERS & PROOF */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold block mb-2">
              HALL OF FAME
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              RECENT TOURNAMENT WINNERS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentResults.map((res, i) => (
              <div
                key={res.id}
                className="p-5 rounded-2xl bg-surface border border-accent-gold/30 shadow-card-glow relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-0.5 rounded bg-accent-gold/20 text-accent-gold font-mono text-xs font-bold border border-accent-gold/40 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> #1 WWCD
                  </span>
                  <span className="font-mono text-xs text-neon-green font-bold">
                    {res.totalPoints} PTS
                  </span>
                </div>

                <div>
                  <h4 className="font-display font-bold text-xl text-white mb-1">
                    {res.team.name}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-1 mb-3">
                    {res.match.tournament.title}
                  </p>
                  <div className="text-[11px] font-mono text-gray-500">
                    Kills: <span className="text-white">{res.kills}</span> | Map:{" "}
                    <span className="text-white">{res.match.map}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: WHY PLAY WITH US */}
      <section className="py-20 bg-surface/40 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green">
                PLATFORM INTEGRITY
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight">
                BUILT FOR SERIOUS BGMI ESPORTS
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Vrtex Esports eliminates fake accounts, unfair emulator lobbies, delayed room distributions, and prize disputes with our real-time tournament infrastructure.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface border border-border">
                  <CheckCircle2 className="w-5 h-5 text-neon-green shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-display font-bold text-white text-sm">Server-Side BGMI UID Verification</h5>
                    <p className="text-xs text-gray-400">Direct integration with official player databases guarantees every participant is authenticated.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface border border-border">
                  <CheckCircle2 className="w-5 h-5 text-neon-green shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-display font-bold text-white text-sm">Time-Locked Automated Room Release</h5>
                    <p className="text-xs text-gray-400">Server time enforcement prevents room leaking to unapproved or disqualified users.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface border border-border">
                  <CheckCircle2 className="w-5 h-5 text-neon-green shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-display font-bold text-white text-sm">Automated Official Points Table</h5>
                    <p className="text-xs text-gray-400">Configurable placement and kill points according to official Krafton esports criteria.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-surface-light via-surface to-background border border-pink-500/30 shadow-2xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400">
                    <Instagram className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white">Join 15,000+ BGMI Players</h3>
                    <p className="text-xs text-gray-400">Follow for daily scrims, custom room ID/pass drops, highlight clips, and official tournament announcements.</p>
                  </div>
                </div>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white font-bold text-sm tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Instagram className="w-5 h-5" />
                  <span>Follow on Official Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Trophy, Shield, MessageSquare, Twitter, Youtube, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#05070a] border-t border-border mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-surface border border-neon-green/40 flex items-center justify-center">
                <span className="font-display font-extrabold text-xl text-neon-green">D</span>
              </div>
              <span className="font-display text-xl font-bold tracking-wider text-white">
                DevX <span className="text-neon-green text-xs font-mono">eSPORTS</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              India's premier competitive BGMI esports tournament and scrim platform. Battle against elite squads, climb global rankings, and win official cash prizes.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-light border border-border flex items-center justify-center text-gray-400 hover:text-white transition" title="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-light border border-border flex items-center justify-center text-gray-400 hover:text-white transition" title="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-light border border-border flex items-center justify-center text-gray-400 hover:text-white transition" title="Twitter / X">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white mb-4">Competitions</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/tournaments" className="text-gray-400 hover:text-neon-green transition">All Tournaments</Link></li>
              <li><Link href="/scrims" className="text-gray-400 hover:text-neon-green transition">Daily Practice Scrims</Link></li>
              <li><Link href="/leaderboard" className="text-gray-400 hover:text-neon-green transition">Official Leaderboard</Link></li>
              <li><Link href="/teams" className="text-gray-400 hover:text-neon-green transition">Top Squads & Rosters</Link></li>
              <li><Link href="/rules" className="text-gray-400 hover:text-neon-green transition">Rulebook & Anti-Cheat</Link></li>
            </ul>
          </div>

          {/* Platform & Account */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white mb-4">Player Portal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/profile" className="text-gray-400 hover:text-neon-green transition">Verify BGMI UID</Link></li>
              <li><Link href="/my-tournaments" className="text-gray-400 hover:text-neon-green transition">My Tournaments & Room Details</Link></li>
              <li><Link href="/my-team" className="text-gray-400 hover:text-neon-green transition">Manage Squad</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-neon-green transition">Help & FAQs</Link></li>
              <li><Link href="/support" className="text-gray-400 hover:text-neon-green transition">Disputes & Support Tickets</Link></li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white mb-4">Compliance</h4>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Every tournament enforces hardware-level device integrity checks, live ALUU BGMI name verification, and secure escrow payouts.
            </p>
            <div className="p-3 bg-surface rounded-lg border border-border text-[11px] text-gray-400">
              <span className="text-neon-green font-semibold">Fair Play Guarantee:</span> Strictly 0 emulator tolerance. Point calculation follows standard BGIS / PMGC points tables.
            </div>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="border-t border-border/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <p className="leading-relaxed text-center md:text-left">
            This platform is an independent esports tournament service and is not affiliated with or endorsed by KRAFTON or BGMI.
          </p>
          <div className="flex items-center gap-6 whitespace-nowrap">
            <span>© 2026 DevX eSports Platform. All Rights Reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };


"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I join a tournament?",
      a: "Create an account, verify your in-game BGMI UID on your profile, create or join a squad under 'My Team', navigate to the Tournaments page, and click 'Register Your Squad'. If the tournament has an entry fee, verify your order to confirm your slot.",
    },
    {
      q: "How do I create a team?",
      a: "Go to 'My Team' in your user menu. Click 'Create Team', enter your team name and tag. A unique squad invite code will be generated for you to share with your teammates so they can join your roster.",
    },
    {
      q: "How do I verify my BGMI UID?",
      a: "Go to 'My Profile'. In the BGMI User ID verification box, enter your numeric in-game player UID. Our backend securely checks the ALUU API to fetch your authentic in-game name and verify your account without exposing any credentials.",
    },
    {
      q: "When are room details released?",
      a: "Room details are released automatically at the scheduled room release time, usually 15 minutes before the match start time. The platform's server clock enforces release time automatically.",
    },
    {
      q: "Where do I find Room ID and password?",
      a: "Open your tournament's detail page or go to 'My Tournaments'. Under the 'Matches' tab, the Room Access box will unlock at release time, displaying your Room ID and Password with one-click copy buttons.",
    },
    {
      q: "How are points calculated?",
      a: "Points are calculated using the official 10-point BGIS point system (1st = 10 pts, 2nd = 6 pts, 3rd = 5 pts, 4th = 4 pts, etc.) plus 1 point per kill. Tournament administrators can also configure custom scoring rules per event.",
    },
    {
      q: "What happens if I disconnect?",
      a: "Per standard BGMI esports rules, individual device crashes or network disconnections are player responsibilities and matches cannot be paused or restarted. Reconnect to the game immediately if the app crashed.",
    },
    {
      q: "How are prizes distributed?",
      a: "Once tournament results are confirmed by referees, the prize status changes to Processing and is sent directly to the team captain via verified UPI or bank transfer. The payout transaction ID is recorded publicly on the tournament prize sheet.",
    },
    {
      q: "Can I change my team after registration?",
      a: "Squad rosters are locked once tournament registration closes. Before registration closes, the team captain can swap starters with registered substitutes.",
    },
    {
      q: "How do I contact support?",
      a: "Visit the 'Support & Disputes' page on the platform to open a support ticket. You can select your issue category (Payment, Registration, Room, Result) and our referee staff will assist you within minutes.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <HelpCircle className="w-3.5 h-3.5" /> QUESTIONS & ANSWERS
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
          FREQUENTLY ASKED QUESTIONS
        </h1>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          Everything you need to know about joining tournaments, room distribution, roster rules, and prize payouts.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-surface border border-border overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-surface-light/40 transition"
              >
                <span className="font-display font-bold text-base sm:text-lg text-white">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-neon-green shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-border/40">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still need help */}
      <div className="mt-12 p-8 rounded-3xl bg-surface-light border border-border text-center">
        <h3 className="font-display font-bold text-2xl text-white mb-2">Still Have Questions?</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
          Our match coordinators and referee staff are available 24/7 to resolve dispute tickets and queries.
        </p>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider shadow-neon-green"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Open Support Ticket</span>
        </Link>
      </div>
    </div>
  );
}

import React from "react";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, User, Trophy, Crosshair, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await prisma.user.findMany({
    where: {
      profile: {
        isVerified: true,
      },
    },
    include: {
      profile: true,
      teamMemberships: {
        include: { team: true },
      },
    },
    orderBy: {
      profile: { points: "desc" },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green block mb-1">
          VERIFIED ROSTER
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
          BGMI ESPORTS PLAYERS
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Every player listed has passed live server-side BGMI UID authentication.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((p) => {
          const team = p.teamMemberships[0]?.team;
          return (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-surface border border-border hover:border-neon-green/40 transition shadow-card-glow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-surface-light border border-neon-green/40 flex items-center justify-center text-neon-green font-bold text-lg">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neon-green/10 border border-neon-green/30 text-neon-green flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-white mb-0.5">
                  {p.profile?.bgmiUsername || p.username}
                </h3>
                <p className="text-xs font-mono text-gray-400 mb-2">
                  UID: <span className="text-white">{p.profile?.bgmiUid || "N/A"}</span>
                </p>

                {team ? (
                  <span className="inline-block px-2.5 py-1 rounded bg-surface-light text-neon-green text-xs font-mono border border-border mb-4">
                    Squad: {team.name} [{team.tag}]
                  </span>
                ) : (
                  <span className="inline-block px-2.5 py-1 rounded bg-surface-light text-gray-400 text-xs font-mono border border-border mb-4">
                    Free Agent
                  </span>
                )}
              </div>

              <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div>
                  <span className="text-gray-500 block text-[10px]">WINS</span>
                  <span className="font-bold text-white">{p.profile?.wins || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">KILLS</span>
                  <span className="font-bold text-white">{p.profile?.kills || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">POINTS</span>
                  <span className="font-bold text-neon-green">{p.profile?.points || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

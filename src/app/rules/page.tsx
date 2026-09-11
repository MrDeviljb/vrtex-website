import React from "react";
import { Shield, AlertTriangle, CheckCircle2, Award, Users, MonitorX } from "lucide-react";

export default function RulesPage() {
  const sections = [
    {
      title: "1. Anti-Cheat & Device Integrity",
      icon: Shield,
      rules: [
        "Use of any unauthorized third-party apps, plugins, modded APKs, script injectors, recoil macros, or memory modifiers will result in an immediate permanent ban across the entire Vrtex Esports network.",
        "Emulators (Bluestacks, LDPlayer, GameLoop, Gameloop, etc.) are strictly prohibited unless a tournament is explicitly marked as 'EMULATOR OPEN'.",
        "Hardware triggers, physical capacitive attachments, and rooted/jailbroken devices with bypassed integrity checks are barred from prize-bearing tournaments.",
      ],
    },
    {
      title: "2. Fair Play & Anti-Teaming Regulations",
      icon: AlertTriangle,
      rules: [
        "Collusion between separate squads (teaming, sharing safe zones, trading kill points, or agreeing not to engage) will result in immediate disqualification of both teams without refund.",
        "Stream sniping is forbidden. All live tournament streamers must maintain a mandatory 3 to 5-minute broadcast delay.",
        "Exploiting known in-game geometry glitches (e.g. going under textures or inside non-enterable rock meshes) will invalidate the match placement.",
      ],
    },
    {
      title: "3. Roster & Eligibility Requirements",
      icon: Users,
      rules: [
        "Every squad member must have their BGMI UID authenticated via our live backend checker before tournament registration closes.",
        "A player cannot register or play for multiple teams within the same tournament.",
        "Squad tournaments require at least 4 active registered players. Teams may register up to 2 substitutes prior to the registration lock.",
      ],
    },
    {
      title: "4. Room Release & Entry Procedure",
      icon: CheckCircle2,
      rules: [
        "Room ID and Password release automatically at the designated release time (typically 15 minutes before match start).",
        "All players must sit strictly in their assigned squad slot number as indicated on the tournament room sheet.",
        "Teams failing to enter the custom room within 10 minutes of release forfeit their slot. Empty slots are locked and will not be re-opened.",
      ],
    },
    {
      title: "5. Disconnection & Rematch Policy",
      icon: MonitorX,
      rules: [
        "Individual client network dropouts, device crashes, or ping spikes are player responsibilities; matches will NOT be restarted.",
        "A match will only be remade if more than 30% of the entire lobby disconnects simultaneously due to official Krafton game server failure before Zone Phase 1 closes.",
      ],
    },
    {
      title: "6. Results & Dispute Process",
      icon: Award,
      rules: [
        "Captains must submit an end-game screenshot showing squad placement and kill counts in the event of an automated scoring dispute.",
        "Disputes must be raised via the Support & Disputes Ticket portal within 30 minutes of match completion.",
        "Official cash prizes are processed within 24–48 hours to the captain's verified UPI or bank account upon referee sign-off.",
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <Shield className="w-3.5 h-3.5" /> OFFICIAL ESPORTS CODE OF CONDUCT
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
          COMPETITIVE RULEBOOK
        </h1>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          Standardized tournament regulations enforced by Vrtex Esports referees to guarantee 100% fair play, transparency, and integrity.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-surface border border-border shadow-card-glow"
            >
              <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                <div className="w-9 h-9 rounded-xl bg-surface-light border border-neon-green/30 flex items-center justify-center text-neon-green">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-white tracking-wide">
                  {sec.title}
                </h3>
              </div>

              <ul className="space-y-3">
                {sec.rules.map((rule, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green shrink-0 mt-2" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

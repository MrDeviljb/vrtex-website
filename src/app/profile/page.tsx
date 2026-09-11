"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Trophy,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Loader2,
  LogOut,
} from "lucide-react";
import BgmiUidVerifier from "@/components/BgmiUidVerifier";

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleUidVerified = async (player: { uid: string; username: string }) => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bgmiUid: player.uid }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess("BGMI account successfully linked & verified!");
        setTimeout(() => setSaveSuccess(""), 3000);
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Profile Bar */}
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-surface-light border-2 border-neon-green/50 flex items-center justify-center text-neon-green font-display font-black text-3xl shadow-neon-green">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-3xl text-white">
                  {currentUser.username}
                </h1>
                {currentUser.profile?.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-neon-green" />
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-light text-neon-green border border-neon-green/30">
                  {currentUser.role}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  Joined: {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => router.push("/my-team")}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-surface-light hover:bg-border border border-border text-xs font-semibold text-white transition flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4" /> My Team
            </button>
            <button
              onClick={() => router.push("/my-tournaments")}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-surface-light hover:bg-border border border-border text-xs font-semibold text-white transition flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4" /> My Tournaments
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-neon-green text-xs text-neon-green flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Main Grid: BGMI UID Verification & Player Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Official BGMI Verification & Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neon-green block mb-1">
                AUTHENTIC BGMI IDENTITY
              </span>
              <h3 className="font-display font-bold text-2xl text-white">
                BGMI UID Verification
              </h3>
              <p className="text-xs text-gray-400">
                Verifying your numeric UID retrieves your genuine player IGN directly from BGMI. Roster locks and room distributions require verified accounts.
              </p>
            </div>

            <BgmiUidVerifier
              initialUid={currentUser.profile?.bgmiUid}
              initialUsername={currentUser.profile?.bgmiUsername}
              onVerified={handleUidVerified}
            />
          </div>
        </div>

        {/* Right Column: Player Tournament Stats */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl bg-surface border border-border space-y-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neon-green block mb-1">
                COMPETITIVE RECORD
              </span>
              <h3 className="font-display font-bold text-2xl text-white">
                Tournament Statistics
              </h3>
              <p className="text-xs text-gray-400">
                Official career statistics accumulated across sanctioned Vrtex Esports tournaments.
              </p>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-surface-light border border-border text-center">
                <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
                  CHAMPION WINS
                </span>
                <span className="font-display font-black text-3xl text-accent-gold">
                  {currentUser.profile?.wins || 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-light border border-border text-center">
                <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
                  TOTAL KILLS
                </span>
                <span className="font-display font-black text-3xl text-white">
                  {currentUser.profile?.kills || 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-light border border-border text-center">
                <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
                  CAREER POINTS
                </span>
                <span className="font-display font-black text-3xl text-neon-green">
                  {currentUser.profile?.points || 0}
                </span>
              </div>
            </div>

            {/* Squad Affiliation */}
            <div className="p-4 rounded-2xl bg-surface-light border border-border">
              <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                CURRENT SQUAD AFFILIATION
              </span>
              {currentUser.captainTeams?.length > 0 ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-lg text-white">
                      {currentUser.captainTeams[0].name} [{currentUser.captainTeams[0].tag}]
                    </h4>
                    <span className="text-xs text-neon-green font-mono">Role: Team Captain 👑</span>
                  </div>
                  <button
                    onClick={() => router.push("/my-team")}
                    className="text-xs font-bold text-neon-green hover:underline"
                  >
                    Manage Squad →
                  </button>
                </div>
              ) : currentUser.teamMemberships?.length > 0 ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-lg text-white">
                      {currentUser.teamMemberships[0].team.name}
                    </h4>
                    <span className="text-xs text-gray-400 font-mono">
                      Role: {currentUser.teamMemberships[0].role}
                    </span>
                  </div>
                  <button
                    onClick={() => router.push("/my-team")}
                    className="text-xs font-bold text-neon-green hover:underline"
                  >
                    View Roster →
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-400 flex items-center justify-between">
                  <span>No squad joined yet.</span>
                  <button
                    onClick={() => router.push("/my-team")}
                    className="text-xs font-bold text-neon-green hover:underline"
                  >
                    Create or Join Squad →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

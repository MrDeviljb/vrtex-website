"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, Copy, Check, ShieldAlert, RefreshCw, EyeOff } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

interface RoomAccessBoxProps {
  matchId: string;
  matchNumber: number;
  initialReleaseTime?: string | Date | null;
  isUserRegistered: boolean;
}

export default function RoomAccessBox({
  matchId,
  matchNumber,
  initialReleaseTime,
  isUserRegistered,
}: RoomAccessBoxProps) {
  const [loading, setLoading] = useState(false);
  const [roomData, setRoomData] = useState<{
    roomId?: string;
    roomPassword?: string;
    releaseTime?: string;
    locked: boolean;
    message?: string;
    isAdmin?: boolean;
  } | null>(null);

  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const fetchRoomStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/room`);
      const data = await res.json();
      setRoomData({
        roomId: data.room?.roomId,
        roomPassword: data.room?.roomPassword,
        releaseTime: data.room?.releaseTime || data.releaseTime || (initialReleaseTime as string),
        locked: data.locked ?? !data.success,
        message: data.message,
        isAdmin: data.isAdmin,
      });
    } catch {
      setRoomData({
        locked: true,
        message: "Failed to connect to room server.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomStatus();
  }, [matchId]);

  const copyToClipboard = (text: string, type: "id" | "pass") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  // State: UNREGISTERED USER
  if (!isUserRegistered && !roomData?.isAdmin) {
    return (
      <div className="p-5 rounded-2xl bg-surface-light border border-border text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface border border-border flex items-center justify-center text-gray-400 mb-3">
          <Lock className="w-5 h-5" />
        </div>
        <h4 className="font-display font-bold text-white text-base mb-1">
          🔒 ROOM DETAILS LOCKED
        </h4>
        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
          Room credentials are only visible to approved registered team captains and squad members.
        </p>
      </div>
    );
  }

  // State: LOCKED (Before release time or hidden)
  if (roomData?.locked) {
    return (
      <div className="p-6 rounded-2xl bg-surface border border-amber-500/30 shadow-card-glow text-center relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> ROOM LOCKED
          </span>
          <button
            onClick={fetchRoomStatus}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="py-3">
          <p className="font-display font-bold text-lg text-white mb-2">
            Match #{matchNumber} Room Details
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {roomData.message || "Room credentials will release automatically prior to match start."}
          </p>

          {roomData.releaseTime && (
            <div className="inline-block px-4 py-2 rounded-xl bg-surface-light border border-border">
              <span className="text-[11px] text-gray-400 block mb-1">Room Releases in:</span>
              <CountdownTimer
                targetDate={roomData.releaseTime}
                onExpire={fetchRoomStatus}
                className="text-base text-neon-green"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // State: UNLOCKED & AVAILABLE (After release time)
  if (roomData && !roomData.locked && roomData.roomId) {
    return (
      <div className="p-6 rounded-2xl bg-surface border-2 border-neon-green shadow-neon-glow relative overflow-hidden">
        {/* Glow Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-mono font-bold text-neon-green px-3 py-1 rounded bg-neon-green/15 border border-neon-green/30 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <Unlock className="w-3.5 h-3.5 text-neon-green" /> 🟢 ROOM AVAILABLE
          </span>
          <button
            onClick={fetchRoomStatus}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Room ID Card */}
          <div className="p-4 rounded-xl bg-surface-light border border-border/80 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-mono tracking-widest block mb-1">
                ROOM ID
              </span>
              <span className="font-mono text-2xl font-extrabold text-white tracking-wider block">
                {roomData.roomId}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(roomData.roomId!, "id")}
              className="mt-3 w-full py-2 px-3 rounded-lg bg-neon-green/10 hover:bg-neon-green text-neon-green hover:text-black font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-neon-green/30"
            >
              {copiedId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedId ? "COPIED!" : "COPY ROOM ID"}</span>
            </button>
          </div>

          {/* Room Password Card */}
          <div className="p-4 rounded-xl bg-surface-light border border-border/80 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-mono tracking-widest block mb-1">
                PASSWORD
              </span>
              <span className="font-mono text-2xl font-extrabold text-neon-green tracking-wider block">
                {roomData.roomPassword}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(roomData.roomPassword!, "pass")}
              className="mt-3 w-full py-2 px-3 rounded-lg bg-surface hover:bg-border text-gray-200 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-border"
            >
              {copiedPass ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPass ? "COPIED!" : "COPY PASSWORD"}</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          ⚠️ Join your assigned team slot immediately in BGMI. Do not share room credentials with non-registered players.
        </p>
      </div>
    );
  }

  return null;
}

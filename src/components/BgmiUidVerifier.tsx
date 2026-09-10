"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, UserCheck } from "lucide-react";

interface BgmiUidVerifierProps {
  initialUid?: string | null;
  initialUsername?: string | null;
  onVerified?: (player: { uid: string; username: string }) => void;
}

export default function BgmiUidVerifier({
  initialUid,
  initialUsername,
  onVerified,
}: BgmiUidVerifierProps) {
  const [uidInput, setUidInput] = useState(initialUid || "");
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">(
    initialUid && initialUsername ? "SUCCESS" : "IDLE"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [verifiedPlayer, setVerifiedPlayer] = useState<{
    uid: string;
    username: string;
  } | null>(
    initialUid && initialUsername
      ? { uid: initialUid, username: initialUsername }
      : null
  );
  const [isChangingUid, setIsChangingUid] = useState(false);

  // Debounce ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.trim();
    // Allow digits only
    const digitsVal = rawVal.replace(/\D/g, "");
    setUidInput(digitsVal);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!digitsVal) {
      setStatus("IDLE");
      setErrorMessage("");
      setVerifiedPlayer(null);
      return;
    }

    // Set UI to LOADING state
    setStatus("LOADING");
    setErrorMessage("");

    // Debounce between 500-700ms (we use 600ms)
    debounceTimerRef.current = setTimeout(() => {
      verifyUid(digitsVal);
    }, 600);
  };

  const verifyUid = async (uidToVerify: string) => {
    try {
      // Calls our backend endpoint ONLY
      const res = await fetch(`/api/player?uid=${encodeURIComponent(uidToVerify)}`);
      const data = await res.json();

      if (res.ok && data.success && data.player) {
        setStatus("SUCCESS");
        setVerifiedPlayer(data.player);
        setErrorMessage("");
        if (onVerified) {
          onVerified(data.player);
        }
      } else {
        setStatus("ERROR");
        setVerifiedPlayer(null);
        setErrorMessage(data.message || "BGMI player not found.");
      }
    } catch (err) {
      setStatus("ERROR");
      setVerifiedPlayer(null);
      setErrorMessage("Unable to verify BGMI account. Please try again.");
    }
  };

  // If already verified and not currently in edit mode, display exact Player Profile Card
  if (status === "SUCCESS" && verifiedPlayer && !isChangingUid) {
    return (
      <div className="w-full max-w-md mx-auto bg-surface border border-border/80 rounded-2xl p-6 shadow-card-glow relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-neon-green/10 rounded-full blur-2xl pointer-events-none" />

        {/* Player Avatar */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-surface-light border-2 border-neon-green flex items-center justify-center text-neon-green mb-3 shadow-neon-green">
            <UserCheck className="w-10 h-10" />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-neon-green bg-neon-green/10 px-3 py-1 rounded-full border border-neon-green/30 uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4 text-neon-green" />
            <span>VERIFIED PLAYER</span>
          </div>

          <h3 className="font-display font-black text-2xl text-white tracking-wide">
            {verifiedPlayer.username}
          </h3>
          <p className="text-xs font-mono text-gray-400 mt-0.5">
            BGMI UID: <span className="text-white font-semibold">{verifiedPlayer.uid}</span>
          </p>
        </div>

        {/* 2x2 Information Grid: Only display legitimate data; 'Not available' for unreturned fields */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="bg-surface-light p-3 rounded-xl border border-border">
            <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">
              Account Status
            </span>
            <span className="text-xs font-bold text-neon-green flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>

          <div className="bg-surface-light p-3 rounded-xl border border-border">
            <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">
              Username
            </span>
            <span className="text-xs font-bold text-white truncate block mt-1">
              {verifiedPlayer.username}
            </span>
          </div>

          <div className="bg-surface-light p-3 rounded-xl border border-border">
            <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">
              Account Age
            </span>
            <span className="text-xs text-gray-400 block mt-1">Not available</span>
          </div>

          <div className="bg-surface-light p-3 rounded-xl border border-border">
            <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">
              Last Login
            </span>
            <span className="text-xs text-gray-400 block mt-1">Not available</span>
          </div>
        </div>

        {/* Change BGMI UID Button */}
        <button
          type="button"
          onClick={() => setIsChangingUid(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-surface-light hover:bg-border border border-border text-xs font-semibold text-gray-300 hover:text-white transition flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>CHANGE BGMI UID</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-2xl p-6 shadow-card-glow">
      <div className="text-left mb-4">
        <label className="block font-display text-sm font-bold uppercase tracking-wider text-gray-200 mb-1">
          {isChangingUid ? "Change BGMI User ID" : "Add BGMI User ID"}
        </label>
        <p className="text-xs text-gray-400">
          Enter your 10-digit in-game player UID. Your in-game name will be verified automatically via official BGMI servers.
        </p>
      </div>

      <div className="relative mb-3">
        <input
          type="text"
          value={uidInput}
          onChange={handleInputChange}
          placeholder="e.g. 55622232685"
          maxLength={15}
          className="w-full bg-surface-light border border-border focus:border-neon-green rounded-xl px-4 py-3 text-white font-mono text-sm tracking-wider outline-none transition pr-12"
        />
        <div className="absolute right-3.5 top-3.5">
          {status === "LOADING" && (
            <Loader2 className="w-5 h-5 text-neon-green animate-spin" />
          )}
          {status === "SUCCESS" && (
            <CheckCircle2 className="w-5 h-5 text-neon-green" />
          )}
          {status === "ERROR" && (
            <AlertCircle className="w-5 h-5 text-accent-red" />
          )}
        </div>
      </div>

      {/* Dynamic Status Display */}
      {status === "IDLE" && (
        <div className="text-xs text-gray-500 py-1 flex items-center gap-1.5">
          <span>Ready for BGMI UID verification.</span>
        </div>
      )}

      {status === "LOADING" && (
        <div className="p-3 rounded-xl bg-surface-light/80 border border-neon-green/30 text-xs text-neon-green flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying BGMI account...</span>
        </div>
      )}

      {status === "ERROR" && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-accent-red/40 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent-red shrink-0" />
          <span>{errorMessage || "BGMI player not found."}</span>
        </div>
      )}

      {isChangingUid && (
        <button
          type="button"
          onClick={() => {
            setIsChangingUid(false);
            if (verifiedPlayer) setStatus("SUCCESS");
          }}
          className="mt-3 text-xs text-gray-400 hover:text-white underline block text-center w-full"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

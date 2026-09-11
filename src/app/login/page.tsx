"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/profile");
        router.refresh();
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-surface-light border border-neon-green/40 flex items-center justify-center text-neon-green mx-auto mb-3 shadow-neon-green">
            <span className="font-display font-extrabold text-2xl">V</span>
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-wide">
            WELCOME BACK
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Sign in to access your squad tournaments and room details.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-accent-red/40 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-red shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="player@vrtexesports.com"
                className="w-full bg-surface-light border border-border focus:border-neon-green rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-gray-300 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[11px] text-gray-400 hover:text-neon-green cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-light border border-border focus:border-neon-green rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-sm uppercase tracking-wider transition shadow-neon-green disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIGN IN"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-neon-green font-bold hover:underline">
            Register squad account
          </Link>
        </p>
      </div>
    </div>
  );
}

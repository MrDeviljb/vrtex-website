"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import BgmiUidVerifier from "@/components/BgmiUidVerifier";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifiedBgmi, setVerifiedBgmi] = useState<{ uid: string; username: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          bgmiUid: verifiedBgmi?.uid || null,
          bgmiUsername: verifiedBgmi?.username || null,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/profile");
        router.refresh();
      } else {
        setError(data.message || "Registration failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-surface border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-surface-light border border-neon-green/40 flex items-center justify-center text-neon-green mx-auto mb-3 shadow-neon-green">
            <span className="font-display font-extrabold text-2xl">V</span>
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-wide">
            CREATE ESPORTS ACCOUNT
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Join thousands of competitive BGMI players and tournament squads.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-accent-red/40 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-red shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ApexStriker"
                className="w-full bg-surface-light border border-border focus:border-neon-green rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="striker@gmail.com"
                className="w-full bg-surface-light border border-border focus:border-neon-green rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5 uppercase tracking-wider">
              Password (Min 6 Characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-light border border-border focus:border-neon-green rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          {/* Optional BGMI UID Verification right at signup */}
          <div className="pt-2">
            <span className="text-xs font-mono text-gray-400 block mb-2">
              (OPTIONAL) VERIFY BGMI UID NOW:
            </span>
            <BgmiUidVerifier
              onVerified={(p) => setVerifiedBgmi(p)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-neon-green hover:bg-neon-emerald text-black font-extrabold text-sm uppercase tracking-wider transition shadow-neon-green disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Already registered?{" "}
          <Link href="/login" className="text-neon-green font-bold hover:underline">
            Log in to your account
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function SlotListPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSlotList();
  }, [slug]);

  async function fetchSlotList() {
    try {
      setLoading(true);
      const res = await fetch(`/api/tournaments/${slug}/slots`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to load slot list.");
      }
    } catch (err) {
      setError("Network error loading slot list.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070A10] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push(`/tournament/${slug}`)}
            className="flex items-center text-gray-400 hover:text-cyan-400 text-sm font-medium transition"
          >
            ← Back to Tournament Overview
          </button>
          <span className="text-xs font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full">
            OFFICIAL SCRIM SLOT LIST
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400 text-sm font-mono">Loading Slot Allocations...</p>
          </div>
        ) : error || !data ? (
          <div className="bg-red-950/40 border border-red-500/40 p-6 rounded-2xl text-center">
            <p className="text-red-400 font-semibold mb-2">Slot List Unavailable</p>
            <p className="text-gray-300 text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header Box Styled like BGMI Scrim Slot List */}
            <div className="bg-gradient-to-r from-[#121929] via-[#0E1524] to-[#121929] border border-cyan-500/30 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest block mb-2 font-bold">
                {data.sessionHeader}
              </span>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase mb-2">
                SLOTLIST OF {data.tournamentTitle}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-800 text-sm font-mono">
                <div className="bg-black/60 border border-cyan-500/30 px-4 py-2 rounded-xl">
                  <span className="text-gray-400">Total Slots: </span>
                  <span className="text-cyan-400 font-bold">
                    {data.occupiedSlots}/{data.totalSlots}
                  </span>
                </div>
                <div className="bg-black/60 border border-cyan-500/30 px-4 py-2 rounded-xl">
                  <span className="text-gray-400">Date Of Slotlist: </span>
                  <span className="text-amber-400 font-bold">{data.dateOfSlotlist}</span>
                </div>
              </div>
            </div>

            {/* Grid of Numbered Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.slots.map((slot: any) => (
                <div
                  key={slot.slotNumber}
                  className={`p-4 rounded-xl border transition flex items-center justify-between ${
                    slot.isApproved
                      ? "bg-[#0E1626] border-cyan-500/40 shadow-lg shadow-cyan-950/20"
                      : slot.isOccupied
                      ? "bg-[#141824] border-amber-500/30"
                      : "bg-[#0A0D14] border-gray-800/80 opacity-70"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-base font-black text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                      {slot.slotLabel}
                    </span>
                    <div>
                      <p className={`font-bold text-sm ${slot.isOccupied ? "text-white" : "text-gray-500 font-mono text-xs"}`}>
                        {slot.isApproved && "🔒 "}
                        {slot.teamName}
                      </p>
                      {slot.teamTag && (
                        <p className="text-[11px] font-mono text-cyan-400/80">[{slot.teamTag}]</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        slot.isApproved
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : slot.displayStatus === "PAYMENT PENDING"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : slot.displayStatus === "UNDER REVIEW"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {slot.displayStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

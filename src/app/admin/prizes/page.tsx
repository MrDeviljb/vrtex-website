"use client";

import React, { useState, useEffect } from "react";
import { Award, CheckCircle2, Clock, AlertTriangle, Shield, Loader2 } from "lucide-react";

export default function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrize, setSelectedPrize] = useState<any>(null);

  // Payout Form State
  const [status, setStatus] = useState("PAID");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prizes");
      const data = await res.json();
      if (data.success) {
        setPrizes(data.prizes || []);
      }
    } catch {
      setPrizes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayout = (prize: any) => {
    setSelectedPrize(prize);
    setStatus(prize.status || "PAID");
    setTransactionId(prize.transactionId || "");
    setNotes(prize.notes || "");
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrize) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prizeId: selectedPrize.id,
          status,
          transactionId,
          notes,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback("Prize payout status updated successfully.");
        setTimeout(() => setFeedback(""), 3000);
        setSelectedPrize(null);
        fetchPrizes();
      } else {
        alert(data.message || "Failed to update prize.");
      }
    } catch {
      alert("Network error updating prize.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent-gold block mb-1">
          FINANCIAL ESCROW & PAYOUTS
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          PRIZE MANAGEMENT & DISBURSEMENTS
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Record verified UPI/IMPS transaction IDs and mark official payouts after tournament results confirmation.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-neon-green text-xs text-neon-green flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Prize Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent-gold animate-spin mb-3" />
            <p className="text-xs font-mono text-gray-400">Loading prize allocations...</p>
          </div>
        ) : prizes.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">No prize distributions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border text-gray-400 font-mono uppercase">
                <tr>
                  <th className="p-4">Tournament</th>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">TxID / Reference</th>
                  <th className="p-4">Disbursed At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {prizes.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-light/40 transition">
                    <td className="p-4 font-bold text-white font-display text-sm">
                      {p.tournament?.title}
                    </td>
                    <td className="p-4 font-mono font-bold text-accent-gold">
                      #{p.rank} Place
                    </td>
                    <td className="p-4 font-mono font-black text-neon-green text-sm">
                      ₹{p.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          p.status === "PAID"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : p.status === "PROCESSING"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : p.status === "FAILED"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-gray-300">
                      {p.transactionId || <span className="text-gray-500">—</span>}
                    </td>
                    <td className="p-4 font-mono text-gray-400">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "Pending"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenPayout(p)}
                        className="px-3 py-1.5 rounded-lg bg-surface-light hover:bg-border text-accent-gold hover:text-white font-mono text-[11px] font-bold border border-border transition"
                      >
                        Update Payout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE PAYOUT MODAL */}
      {selectedPrize && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-display font-bold text-xl text-white mb-1">
              Disburse Rank #{selectedPrize.rank} Prize
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Tournament: {selectedPrize.tournament?.title} (₹{selectedPrize.amount.toLocaleString()})
            </p>

            <form onSubmit={handleSavePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">PAYOUT STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PAID">PAID</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  BANK / UPI TRANSACTION ID
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI-928472910482"
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-neon-green"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">NOTES</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Transferred to captain GPay verified account"
                  className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-white outline-none focus:border-neon-green"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedPrize(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Record Disbursement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

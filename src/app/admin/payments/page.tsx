"use client";

import { useEffect, useState } from "react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [viewingPayment, setViewingPayment] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payments");
      const json = await res.json();
      if (json.success) {
        setPayments(json.payments);
      } else {
        setError(json.message || "Failed to load payments.");
      }
    } catch (err) {
      setError("Network error fetching payment records.");
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (payment: any) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/approve`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(`✓ Payment APPROVED for Team "${payment.team.name}"!`);
        setSelectedPayment(null);
        await fetchPayments();
      } else {
        alert(json.message || "Failed to approve payment.");
      }
    } catch (err) {
      alert("Error approving payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/payments/${selectedPayment.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(`Payment REJECTED for Team "${selectedPayment.team.name}".`);
        setSelectedPayment(null);
        setIsRejecting(false);
        setRejectionReason("");
        await fetchPayments();
      } else {
        alert(json.message || "Failed to reject payment.");
      }
    } catch (err) {
      alert("Error rejecting payment.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">
            Payment Approvals
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Manual verification of UPI payments, UTR numbers, and registration screenshots.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3.5 py-1.5 rounded-lg text-xs font-mono transition"
        >
          🔄 Refresh
        </button>
      </div>

      {actionMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-xl text-emerald-300 text-sm font-medium">
          {actionMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-sm">
          Loading payment audit records...
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-500/40 p-4 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-[#121827] border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
          No payment records submitted yet.
        </div>
      ) : (
        <div className="bg-[#121827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B0E17] text-gray-400 uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Tournament</th>
                  <th className="p-4">Team</th>
                  <th className="p-4">Captain</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">UTR Number</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Reviewed By</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-cyan-950/20 transition">
                    <td className="p-4 text-cyan-400 font-bold">{p.id.slice(0, 8)}...</td>
                    <td className="p-4 text-white font-sans font-semibold">{p.tournament.title}</td>
                    <td className="p-4 text-cyan-300 font-sans">{p.team.name}</td>
                    <td className="p-4 text-gray-300">
                      {p.team.captain.profile?.bgmiUsername || p.team.captain.username}
                      <span className="block text-[10px] text-gray-500">
                        UID: {p.team.captain.profile?.bgmiUid || "N/A"}
                      </span>
                    </td>
                    <td className="p-4 text-amber-400 font-bold text-sm">₹{p.amount}</td>
                    <td className="p-4 text-white font-bold tracking-wider">{p.utrNumber || "N/A"}</td>
                    <td className="p-4 text-gray-400">
                      {new Date(p.submittedAt).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          p.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : p.status === "UNDER_REVIEW"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                            : "bg-red-500/20 text-red-400 border border-red-500/40"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{p.reviewedBy || "—"}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setViewingPayment(p)}
                        className="bg-gray-800 hover:bg-gray-700 text-cyan-400 px-2.5 py-1 rounded text-[11px] font-bold"
                      >
                        VIEW
                      </button>
                      {p.status !== "APPROVED" && (
                        <button
                          onClick={() => {
                            setSelectedPayment(p);
                            setIsRejecting(false);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-black px-2.5 py-1 rounded text-[11px] font-bold"
                        >
                          APPROVE
                        </button>
                      )}
                      {p.status !== "REJECTED" && (
                        <button
                          onClick={() => {
                            setSelectedPayment(p);
                            setIsRejecting(true);
                          }}
                          className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded text-[11px] font-bold"
                        >
                          REJECT
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Screenshot Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Payment Details & Proof</h3>
              <button onClick={() => setViewingPayment(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono text-gray-300">
              <p><span className="text-gray-500">Tournament:</span> {viewingPayment.tournament.title}</p>
              <p><span className="text-gray-500">Team:</span> {viewingPayment.team.name}</p>
              <p><span className="text-gray-500">Amount:</span> ₹{viewingPayment.amount}</p>
              <p><span className="text-gray-500">UTR:</span> {viewingPayment.utrNumber || "N/A"}</p>
            </div>
            {viewingPayment.screenshot ? (
              <div className="bg-black p-2 rounded-xl border border-gray-800">
                <img src={viewingPayment.screenshot} alt="Payment Proof" className="max-h-80 mx-auto object-contain rounded" />
              </div>
            ) : (
              <p className="text-gray-500 text-xs italic text-center py-4">No screenshot uploaded.</p>
            )}
            <button
              onClick={() => setViewingPayment(null)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-xl text-xs font-bold font-mono"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Confirmation & Rejection Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-3">
              {isRejecting ? "Reject Payment Request" : "Confirm Payment Approval"}
            </h3>

            <div className="text-xs font-mono text-gray-300 space-y-1 bg-black/50 p-3 rounded-xl">
              <p>Team: <span className="text-cyan-400 font-bold">{selectedPayment.team.name}</span></p>
              <p>Tournament: {selectedPayment.tournament.title}</p>
              <p>Amount: ₹{selectedPayment.amount}</p>
              <p>UTR: <span className="text-amber-400 font-bold">{selectedPayment.utrNumber}</span></p>
            </div>

            {isRejecting ? (
              <form onSubmit={handleReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-300 uppercase mb-2">
                    Rejection Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Invalid UTR number / Payment screenshot not matching amount."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-black/60 border border-gray-700 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-red-400"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment(null)}
                    className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-xs font-bold"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase"
                  >
                    {actionLoading ? "REJECTING..." : "CONFIRM REJECTION"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-emerald-300 font-mono">
                  Approving this payment will mark the payment as APPROVED and confirm the team's tournament registration.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-xs font-bold"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPayment)}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold py-2.5 rounded-xl text-xs uppercase"
                  >
                    {actionLoading ? "APPROVING..." : "CONFIRM APPROVAL"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

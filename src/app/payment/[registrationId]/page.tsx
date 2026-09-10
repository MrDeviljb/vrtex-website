"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const registrationId = params.registrationId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPaymentDetails();
  }, [registrationId]);

  async function fetchPaymentDetails() {
    try {
      setLoading(true);
      const res = await fetch(`/api/payments/${registrationId}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        if (json.data.payment) {
          setUtrNumber(json.data.payment.utrNumber || "");
          setScreenshot(json.data.payment.screenshot || "");
        }
      } else {
        setError(json.message || "Failed to load payment details.");
      }
    } catch (err) {
      setError("Network error loading payment details.");
    } finally {
      setLoading(false);
    }
  }

  const handleCopyUpi = () => {
    if (data?.upiId) {
      navigator.clipboard.writeText(data.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setError("Please enter a valid 12-digit UTR / Payment reference number.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          utrNumber: utrNumber.trim(),
          screenshot,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(json.message);
        await fetchPaymentDetails();
      } else {
        setError(json.message || "Failed to submit payment.");
      }
    } catch (err) {
      setError("An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-400 hover:text-cyan-400 text-sm font-medium transition"
          >
            ← Back to Tournament
          </button>
          <span className="text-xs uppercase tracking-widest bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full font-mono">
            SECURE ESPORTS PAYMENT
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400 text-sm font-mono">Generating Payment Request...</p>
          </div>
        ) : error && !data ? (
          <div className="bg-red-950/40 border border-red-500/40 p-6 rounded-2xl text-center">
            <p className="text-red-400 font-semibold mb-2">Payment Verification Error</p>
            <p className="text-gray-300 text-sm">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Summary Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gradient-to-b from-[#121827] to-[#0D121F] border border-cyan-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>

                <div className="border-b border-gray-800 pb-4 mb-4">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    Entry Fee Summary
                  </span>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    {data.tournamentName}
                  </h1>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-gray-800/60">
                    <span className="text-gray-400">Team Name</span>
                    <span className="font-bold text-white">{data.teamName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-800/60">
                    <span className="text-gray-400">Team Captain</span>
                    <span className="font-semibold text-cyan-300">{data.captainName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-800/60">
                    <span className="text-gray-400">Captain BGMI UID</span>
                    <span className="font-mono text-cyan-400 font-medium">{data.bgmiUid}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-800/60">
                    <span className="text-gray-400">Assigned Slot</span>
                    <span className="font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                      {data.assignedSlot}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 pt-3">
                    <span className="text-gray-300 font-semibold">Total Entry Fee</span>
                    <span className="text-3xl font-black text-amber-400 font-mono">
                      ₹{data.registrationFee}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase font-mono">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${
                      data.payment?.status === "APPROVED" || data.registrationStatus === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : data.payment?.status === "UNDER_REVIEW" || data.registrationStatus === "UNDER_REVIEW"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                        : data.payment?.status === "REJECTED"
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    }`}
                  >
                    {data.payment?.status || data.registrationStatus || "PAYMENT PENDING"}
                  </span>
                </div>
              </div>

              {/* UPI ID Section */}
              <div className="bg-[#121827] border border-gray-800 rounded-2xl p-5">
                <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                  Official Merchant UPI ID
                </p>
                <div className="bg-black/60 border border-gray-700/80 rounded-xl p-3 flex items-center justify-between font-mono">
                  <span className="text-cyan-300 font-bold text-base">{data.upiId}</span>
                  <button
                    onClick={handleCopyUpi}
                    className="bg-cyan-600 hover:bg-cyan-500 text-black px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition"
                  >
                    {copied ? "✓ COPIED" : "COPY UPI ID"}
                  </button>
                </div>
                <a
                  href={data.upiUrl}
                  className="mt-3 block w-full text-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-emerald-900/30"
                >
                  ⚡ OPEN UPI APP
                </a>
              </div>
            </div>

            {/* Right Column: Dynamic QR & Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Dynamic QR Display */}
              <div className="bg-[#121827] border border-cyan-500/30 rounded-2xl p-6 text-center space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Scan Dynamic QR Code to Pay <span className="text-amber-400 font-mono">₹{data.registrationFee}</span>
                </h3>

                <div className="inline-block p-4 bg-white rounded-2xl shadow-2xl border-4 border-cyan-500/40">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.upiUrl)}`}
                    alt={`UPI QR Code for ₹${data.registrationFee}`}
                    className="w-52 h-52 mx-auto rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  Scan using GPay, PhonePe, Paytm or BHIM UPI
                </p>
              </div>

              {/* Payment Verification Form */}
              <div className="bg-[#121827] border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-3">
                  Submit Payment Verification
                </h3>

                {error && (
                  <div className="bg-red-950/60 border border-red-500/50 p-3.5 rounded-xl text-red-300 text-xs font-medium">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-950/60 border border-emerald-500/50 p-3.5 rounded-xl text-emerald-300 text-xs font-medium">
                    ✓ {success}
                  </div>
                )}

                {data.payment?.rejectionReason && (
                  <div className="bg-red-950/60 border border-red-500/60 p-4 rounded-xl space-y-1">
                    <p className="text-red-400 font-bold text-xs uppercase tracking-wider">Previous Payment Rejected</p>
                    <p className="text-red-200 text-sm">Reason: {data.payment.rejectionReason}</p>
                    <p className="text-gray-400 text-xs pt-1">Please upload a valid payment proof with a correct UTR number.</p>
                  </div>
                )}

                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider mb-2">
                      Payment Reference / UTR Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 425619283741"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full bg-black/60 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition"
                    />
                    <p className="text-[11px] text-gray-500 mt-1 font-mono">
                      Must be the 12-digit transaction UTR / Ref ID from your payment app.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider mb-2">
                      Upload Payment Screenshot (Optional but Recommended)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-black hover:file:bg-cyan-500 cursor-pointer"
                    />
                    {screenshot && (
                      <div className="mt-3 p-2 bg-black/50 border border-gray-800 rounded-xl">
                        <p className="text-[11px] text-cyan-400 mb-1 font-mono">Screenshot Preview:</p>
                        <img src={screenshot} alt="Payment Screenshot" className="max-h-40 rounded-lg mx-auto object-contain" />
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl text-amber-200/90 text-xs leading-relaxed font-mono">
                    🛡️ Payment will be manually verified by an authorized admin or moderator before your registration is approved.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black py-3.5 rounded-xl text-base uppercase tracking-wider transition shadow-lg shadow-cyan-900/40 disabled:opacity-50"
                  >
                    {submitting ? "SUBMITTING VERIFICATION..." : "SUBMIT PAYMENT"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

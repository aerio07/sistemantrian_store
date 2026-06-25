import { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function Index({ token, queue: initialQueue }) {
    const [queueData, setQueueData] = useState({
        queue_number: initialQueue.queue_number,
        status: initialQueue.status,
        position: 0,
        waiting_ahead: 0,
    });
    const [dots, setDots] = useState("");
    const intervalRef = useRef(null);

    // Polling for status updates
    useEffect(() => {
        const poll = async () => {
            try {
                const response = await axios.get(
                    `/api/queue/status/${token}`
                );
                const data = response.data;
                setQueueData(data);

                // Redirect based on status
                if (data.status === "called" || data.status === "waiting_payment") {
                    // Small delay for animation
                    setTimeout(() => {
                        window.location.href = `/payment/${token}`;
                    }, 1500);
                } else if (data.status === "paid") {
                    // Already paid, go to payment loading
                    window.location.href = `/payment/${token}`;
                } else if (data.status === "ready_pickup" || data.status === "completed") {
                    // Ready for pickup or completed
                    window.location.href = `/pickup/${token}`;
                } else if (data.status === "cancelled" || data.status === "expired") {
                    // Queue was skipped
                    clearInterval(intervalRef.current);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        poll(); // initial fetch
        intervalRef.current = setInterval(poll, 3000);

        return () => clearInterval(intervalRef.current);
    }, [token]);

    // Animated dots
    useEffect(() => {
        const dotsInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 500);
        return () => clearInterval(dotsInterval);
    }, []);

    const isCalled = queueData.status === "called";
    const isCancelled = queueData.status === "cancelled" || queueData.status === "expired";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                {/* Main Card */}
                <div
                    className={`glass rounded-3xl p-8 ${
                        isCalled
                            ? "border-emerald-500/50 shadow-2xl shadow-emerald-500/20"
                            : isCancelled
                            ? "border-red-500/50 shadow-2xl shadow-red-500/20"
                            : "border-indigo-500/20"
                    } transition-all duration-500`}
                >
                    {/* Status Icon */}
                    <div className="mb-6">
                        {isCalled ? (
                            <div className="animate-number-pop">
                                <span className="text-6xl">📢</span>
                            </div>
                        ) : isCancelled ? (
                            <span className="text-6xl">❌</span>
                        ) : (
                            <div className="animate-pulse-ring inline-block">
                                <span className="text-6xl">⏳</span>
                            </div>
                        )}
                    </div>

                    {/* Queue Number */}
                    <div className="mb-6">
                        <p className="text-indigo-300 text-sm font-medium uppercase tracking-wider mb-2">
                            Nomor Antrian Kamu
                        </p>
                        <div
                            className={`text-7xl font-black tracking-tight ${
                                isCalled
                                    ? "text-emerald-400 animate-number-pop"
                                    : isCancelled
                                    ? "text-red-400"
                                    : "text-white"
                            }`}
                        >
                            {queueData.queue_number}
                        </div>
                    </div>

                    {/* Status Message */}
                    {isCalled ? (
                        <div className="animate-slide-up">
                            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 mb-4">
                                <p className="text-emerald-400 font-bold text-lg">
                                    🎉 Kamu Dipanggil!
                                </p>
                                <p className="text-emerald-300/70 text-sm mt-1">
                                    Mengalihkan ke pembayaran...
                                </p>
                            </div>
                        </div>
                    ) : isCancelled ? (
                        <div className="animate-slide-up">
                            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-4">
                                <p className="text-red-400 font-bold text-lg">
                                    Antrian Dibatalkan
                                </p>
                                <p className="text-red-300/70 text-sm mt-1">
                                    Silakan buat pesanan baru
                                </p>
                            </div>
                            <a
                                href="/shop"
                                className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                            >
                                🛒 Kembali ke Toko
                            </a>
                        </div>
                    ) : (
                        <>
                            {/* Position Info */}
                            {queueData.position > 0 && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                                    <p className="text-white/60 text-sm">
                                        Posisi Antrian
                                    </p>
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                        <span className="text-3xl font-bold text-amber-400">
                                            #{queueData.position}
                                        </span>
                                        {queueData.waiting_ahead > 0 && (
                                            <span className="text-white/40 text-sm">
                                                ({queueData.waiting_ahead}{" "}
                                                orang di depanmu)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <p className="text-indigo-300/70 text-sm">
                                Menunggu dipanggil oleh kasir{dots}
                            </p>
                        </>
                    )}
                </div>

                {/* Info */}
                {!isCalled && !isCancelled && (
                    <div className="mt-6 text-white/30 text-xs">
                        <p>
                            Halaman ini akan otomatis update. Jangan tutup
                            browser.
                        </p>
                        <p className="mt-1">
                            Simpan link ini untuk kembali:{" "}
                            <span className="text-indigo-400 font-mono text-[10px] break-all">
                                /waiting/{token}
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
import { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function Index({ token, queue: initialQueue, order: initialOrder }) {
    const [status, setStatus] = useState(initialQueue.status);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
    const [order, setOrder] = useState(initialOrder);
    const [dots, setDots] = useState("");
    const intervalRef = useRef(null);
    const timerRef = useRef(null);

    // Polling for status updates
    useEffect(() => {
        const poll = async () => {
            try {
                const response = await axios.get(`/api/queue/status/${token}`);
                const data = response.data;
                setStatus(data.status);

                if (data.order) {
                    setOrder((prev) => ({ ...prev, ...data.order }));

                    // Calculate remaining time from deadline
                    if (data.order.payment_deadline) {
                        const deadline = new Date(data.order.payment_deadline).getTime();
                        const now = Date.now();
                        const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
                        setTimeLeft(remaining);
                    }
                }

                // Redirect on ready_pickup
                if (data.status === "ready_pickup") {
                    setTimeout(() => {
                        window.location.href = `/pickup/${token}`;
                    }, 1000);
                }

                // Cancelled/expired
                if (data.status === "cancelled" || data.status === "expired") {
                    clearInterval(intervalRef.current);
                    clearInterval(timerRef.current);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        poll();
        intervalRef.current = setInterval(poll, 3000);
        return () => clearInterval(intervalRef.current);
    }, [token]);

    // Countdown timer
    useEffect(() => {
        if (paymentMethod && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timerRef.current);
        }
    }, [paymentMethod]);

    // Animated dots for loading
    useEffect(() => {
        const dotsInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 500);
        return () => clearInterval(dotsInterval);
    }, []);

    const selectPayment = async (method) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const response = await axios.post(`/payment/${token}/select`, {
                payment_method: method,
            });
            setPaymentMethod(method);

            if (response.data.payment_deadline) {
                const deadline = new Date(response.data.payment_deadline).getTime();
                const now = Date.now();
                setTimeLeft(Math.max(0, Math.floor((deadline - now) / 1000)));
            }
        } catch (error) {
            console.error("Payment selection failed:", error);
            alert("Gagal memilih metode bayar. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const isTimedOut = timeLeft === 0 && paymentMethod;
    const isPaid = status === "paid";
    const isReadyPickup = status === "ready_pickup";
    const isCancelled = status === "cancelled" || status === "expired";

    // === PAID STATE: Waiting for cashier validation ===
    if (isPaid || isReadyPickup) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="glass rounded-3xl p-8 border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
                        {isReadyPickup ? (
                            <>
                                <span className="text-6xl block mb-4 animate-number-pop">✅</span>
                                <h2 className="text-2xl font-bold text-emerald-400 mb-2">
                                    Pembayaran Terverifikasi!
                                </h2>
                                <p className="text-emerald-300/70 text-sm">
                                    Mengalihkan ke pickup...
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="animate-pulse-ring inline-block mb-4">
                                    <span className="text-6xl">⏳</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Menunggu Validasi
                                </h2>
                                <p className="text-indigo-300/70 text-sm">
                                    Kasir sedang memverifikasi pembayaran kamu{dots}
                                </p>

                                <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-white/50 text-xs">Total Pembayaran</p>
                                    <p className="text-2xl font-bold text-amber-400 mt-1">
                                        Rp {formatPrice(order?.total_amount || 0)}
                                    </p>
                                    <p className="text-white/40 text-xs mt-2 capitalize">
                                        Metode: {order?.payment_method || paymentMethod || "-"}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // === CANCELLED / TIMED OUT ===
    if (isCancelled || isTimedOut) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="glass rounded-3xl p-8 border-red-500/30">
                        <span className="text-6xl block mb-4">⏰</span>
                        <h2 className="text-2xl font-bold text-red-400 mb-2">
                            {isTimedOut ? "Waktu Habis" : "Antrian Dibatalkan"}
                        </h2>
                        <p className="text-red-300/70 text-sm mb-6">
                            {isTimedOut
                                ? "Waktu pembayaran telah habis"
                                : "Antrian kamu telah dibatalkan oleh kasir"}
                        </p>
                        <a
                            href="/shop"
                            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                        >
                            🛒 Kembali ke Toko
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // === PAYMENT SELECTION ===
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-6">
                    <span className="text-5xl block mb-3">💳</span>
                    <h1 className="text-2xl font-bold text-white">
                        Pilih Pembayaran
                    </h1>
                    <p className="text-indigo-300/70 text-sm mt-1">
                        Nomor Antrian:{" "}
                        <span className="text-white font-bold">
                            {initialQueue.queue_number}
                        </span>
                    </p>
                </div>

                {/* Order Summary */}
                <div className="glass rounded-2xl p-5 mb-5">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                        Total Pembayaran
                    </p>
                    <p className="text-3xl font-bold text-white">
                        Rp {formatPrice(order?.total_amount || 0)}
                    </p>
                </div>

                {/* Timer (shown after selecting method) */}
                {paymentMethod && timeLeft > 0 && (
                    <div
                        className={`glass rounded-2xl p-4 mb-5 text-center animate-slide-up ${
                            timeLeft <= 60
                                ? "border-red-500/50"
                                : "border-amber-500/30"
                        }`}
                    >
                        <p className="text-white/50 text-xs mb-1">
                            Waktu Tersisa
                        </p>
                        <p
                            className={`text-4xl font-mono font-bold animate-countdown ${
                                timeLeft <= 60
                                    ? "text-red-400"
                                    : "text-amber-400"
                            }`}
                        >
                            {formatTime(timeLeft)}
                        </p>
                    </div>
                )}

                {/* Payment not yet selected */}
                {!paymentMethod ? (
                    <div className="space-y-3 animate-slide-up">
                        {/* Cash Option */}
                        <button
                            onClick={() => selectPayment("cash")}
                            disabled={isSubmitting}
                            className="w-full glass hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-5 text-left transition-all duration-300 group hover:scale-[1.02] active:scale-95"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                    💵
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">
                                        Cash
                                    </h3>
                                    <p className="text-white/50 text-sm">
                                        Bayar tunai di kasir
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* QRIS Option */}
                        <button
                            onClick={() => selectPayment("qris")}
                            disabled={isSubmitting}
                            className="w-full glass hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-2xl p-5 text-left transition-all duration-300 group hover:scale-[1.02] active:scale-95"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                    📱
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">
                                        QRIS
                                    </h3>
                                    <p className="text-white/50 text-sm">
                                        Scan QR untuk bayar
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                ) : (
                    /* Payment method selected — show instructions */
                    <div className="animate-slide-up">
                        <div className="glass rounded-2xl p-6 text-center">
                            {paymentMethod === "cash" ? (
                                <>
                                    <span className="text-5xl block mb-3">
                                        💵
                                    </span>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        Pembayaran Cash
                                    </h3>
                                    <p className="text-white/60 text-sm">
                                        Silakan serahkan uang sebesar{" "}
                                        <span className="text-amber-400 font-bold">
                                            Rp{" "}
                                            {formatPrice(
                                                order?.total_amount || 0
                                            )}
                                        </span>{" "}
                                        ke kasir.
                                    </p>
                                    <p className="text-white/40 text-xs mt-3">
                                        Menunggu kasir memverifikasi{dots}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <span className="text-5xl block mb-3">
                                        📱
                                    </span>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        Pembayaran QRIS
                                    </h3>
                                    {/* QRIS placeholder — will be replaced with Midtrans */}
                                    <div className="bg-white rounded-xl p-4 inline-block my-3">
                                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                                            <div className="text-center">
                                                <span className="text-4xl block mb-2">
                                                    📷
                                                </span>
                                                <p className="text-gray-500 text-xs">
                                                    QR Code
                                                </p>
                                                <p className="text-gray-400 text-[10px]">
                                                    (Midtrans integration soon)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-white/40 text-xs">
                                        Menunggu kasir memverifikasi{dots}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

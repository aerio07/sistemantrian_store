import { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function Index({ token, queue: initialQueue, order }) {
    const [status, setStatus] = useState(initialQueue.status);
    const [dots, setDots] = useState("");
    const intervalRef = useRef(null);

    // Polling for status
    useEffect(() => {
        const poll = async () => {
            try {
                const response = await axios.get(`/api/queue/status/${token}`);
                setStatus(response.data.status);

                if (response.data.status === "completed") {
                    clearInterval(intervalRef.current);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

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

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const isCompleted = status === "completed";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <div
                    className={`glass rounded-3xl p-8 transition-all duration-500 ${
                        isCompleted
                            ? "border-emerald-500/50 shadow-2xl shadow-emerald-500/20"
                            : "border-amber-500/30 shadow-2xl shadow-amber-500/10"
                    }`}
                >
                    {isCompleted ? (
                        /* === COMPLETED === */
                        <div className="animate-slide-up">
                            <span className="text-7xl block mb-4 animate-number-pop">
                                🎉
                            </span>
                            <h1 className="text-3xl font-bold text-emerald-400 mb-2">
                                Selesai!
                            </h1>
                            <p className="text-emerald-300/70 text-sm mb-6">
                                Terima kasih telah berbelanja
                            </p>

                            {/* Order Summary */}
                            {order && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left">
                                    <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
                                        Ringkasan Pesanan
                                    </p>
                                    {order.items &&
                                        order.items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between py-1.5 border-b border-white/5 last:border-0"
                                            >
                                                <span className="text-white/80 text-sm">
                                                    {item.product?.name ||
                                                        "Produk"}{" "}
                                                    × {item.quantity}
                                                </span>
                                                <span className="text-white/60 text-sm">
                                                    Rp{" "}
                                                    {formatPrice(item.subtotal)}
                                                </span>
                                            </div>
                                        ))}
                                    <div className="flex justify-between pt-3 mt-2 border-t border-white/10">
                                        <span className="text-white font-semibold text-sm">
                                            Total
                                        </span>
                                        <span className="text-amber-400 font-bold">
                                            Rp{" "}
                                            {formatPrice(order.total_amount)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <a
                                href="/shop"
                                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
                            >
                                🛍️ Belanja Lagi
                            </a>
                        </div>
                    ) : (
                        /* === READY FOR PICKUP === */
                        <div>
                            <div className="animate-pulse-ring inline-block mb-4">
                                <span className="text-6xl">📦</span>
                            </div>

                            <h1 className="text-2xl font-bold text-white mb-2">
                                Ambil Pesanan
                            </h1>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
                                <p className="text-amber-400 font-bold text-lg">
                                    Nomor: {initialQueue.queue_number}
                                </p>
                                <p className="text-amber-300/70 text-sm mt-1">
                                    Silakan ambil pesanan kamu di kasir
                                </p>
                            </div>

                            {/* Items list */}
                            {order && order.items && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                                    <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                                        Pesanan Kamu
                                    </p>
                                    {order.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between py-1.5"
                                        >
                                            <span className="text-white/80 text-sm">
                                                {item.product?.name ||
                                                    "Produk"}{" "}
                                                × {item.quantity}
                                            </span>
                                            <span className="text-white/60 text-sm">
                                                Rp{" "}
                                                {formatPrice(item.subtotal)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-white/30 text-xs mt-4">
                                Menunggu konfirmasi pickup dari kasir{dots}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

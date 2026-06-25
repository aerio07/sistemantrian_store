import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function DisplayQueue() {
    const [serving, setServing] = useState([]);
    const [waiting, setWaiting] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const intervalRef = useRef(null);

    // Fetch display data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("/api/display");
                setServing(response.data.serving);
                setWaiting(response.data.waiting);
            } catch (error) {
                console.error("Display fetch error:", error);
            }
        };

        fetchData();
        intervalRef.current = setInterval(fetchData, 3000);
        return () => clearInterval(intervalRef.current);
    }, []);

    // Clock
    useEffect(() => {
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(clockInterval);
    }, []);

    const getStatusLabel = (status) => {
        const labels = {
            called: "DIPANGGIL",
            waiting_payment: "PROSES BAYAR",
            paid: "SUDAH BAYAR",
            ready_pickup: "SIAP AMBIL",
        };
        return labels[status] || status.toUpperCase();
    };

    const getStatusBg = (status) => {
        const colors = {
            called: "from-blue-600 to-blue-700",
            waiting_payment: "from-amber-600 to-amber-700",
            paid: "from-emerald-600 to-emerald-700",
            ready_pickup: "from-purple-600 to-purple-700",
        };
        return colors[status] || "from-gray-600 to-gray-700";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        📋 ANTRIAN
                    </h1>
                    <p className="text-indigo-300 text-lg mt-1">
                        Toko Antrian — Sistem Antrian Digital
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-5xl font-mono font-bold text-white">
                        {currentTime.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </p>
                    <p className="text-indigo-300 text-sm mt-1">
                        {currentTime.toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
                {/* === Currently Serving (2/3) === */}
                <div className="lg:col-span-2">
                    <div className="glass rounded-3xl p-6 h-full">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                            SEDANG DILAYANI
                        </h2>

                        {serving.length === 0 ? (
                            <div className="flex items-center justify-center h-[80%]">
                                <div className="text-center">
                                    <span className="text-8xl block mb-4 opacity-30">
                                        📭
                                    </span>
                                    <p className="text-white/30 text-xl">
                                        Tidak ada antrian aktif
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {serving.map((q) => (
                                    <div
                                        key={q.id}
                                        className={`bg-gradient-to-br ${getStatusBg(
                                            q.status
                                        )} rounded-2xl p-6 shadow-xl animate-slide-up`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
                                                {getStatusLabel(q.status)}
                                            </span>
                                            {q.cashier && (
                                                <span className="text-white/60 text-xs">
                                                    Kasir:{" "}
                                                    {q.cashier.name || "—"}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-7xl font-black text-white text-center py-4 animate-number-pop">
                                            {q.queue_number}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* === Waiting List (1/3) === */}
                <div>
                    <div className="glass rounded-3xl p-6 h-full">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            ⏳ MENUNGGU
                            {waiting.length > 0 && (
                                <span className="bg-amber-500/20 text-amber-400 text-sm px-3 py-0.5 rounded-full">
                                    {waiting.length}
                                </span>
                            )}
                        </h2>

                        {waiting.length === 0 ? (
                            <div className="flex items-center justify-center h-[80%]">
                                <p className="text-white/30 text-sm">
                                    Tidak ada yang menunggu
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
                                {waiting.map((q, idx) => (
                                    <div
                                        key={q.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                            idx === 0
                                                ? "bg-amber-500/10 border-amber-500/30"
                                                : "bg-white/5 border-white/10"
                                        }`}
                                    >
                                        <span
                                            className={`text-sm font-bold min-w-[28px] text-center ${
                                                idx === 0
                                                    ? "text-amber-400"
                                                    : "text-white/30"
                                            }`}
                                        >
                                            {idx + 1}
                                        </span>
                                        <span
                                            className={`font-bold text-lg ${
                                                idx === 0
                                                    ? "text-amber-400"
                                                    : "text-white/70"
                                            }`}
                                        >
                                            {q.queue_number}
                                        </span>
                                        {idx === 0 && (
                                            <span className="ml-auto text-amber-400 text-xs animate-pulse">
                                                Selanjutnya →
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function CashierPanel() {
    const [activeQueue, setActiveQueue] = useState(null);
    const [waitingQueues, setWaitingQueues] = useState([]);
    const [stats, setStats] = useState({ waiting: 0, completed: 0, cancelled: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const intervalRef = useRef(null);

    // Fetch cashier data
    const fetchData = async () => {
        try {
            const response = await axios.get("/cashier/api/queues");
            const data = response.data;

            setActiveQueue(data.active_queue);
            setWaitingQueues(
                data.queues.filter((q) => q.status === "waiting")
            );
            setStats(data.stats);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    useEffect(() => {
        fetchData();
        intervalRef.current = setInterval(fetchData, 3000);
        return () => clearInterval(intervalRef.current);
    }, []);

    // Actions
    const callNext = async () => {
        if (isLoading || activeQueue) return;
        setIsLoading(true);
        try {
            const response = await axios.post("/cashier/queue/call-next");
            setActiveQueue(response.data);
            await fetchData();
        } catch (error) {
            if (error.response?.status === 404) {
                alert("Tidak ada antrian yang menunggu.");
            } else if (error.response?.status === 400) {
                alert(error.response.data.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const confirmPayment = async () => {
        if (isLoading || !activeQueue) return;
        setIsLoading(true);
        try {
            const response = await axios.post(
                `/cashier/queue/${activeQueue.id}/confirm-payment`
            );
            setActiveQueue(response.data);
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Gagal konfirmasi bayar");
        } finally {
            setIsLoading(false);
        }
    };

    const sendReceipt = async () => {
        if (isLoading || !activeQueue) return;
        setIsLoading(true);
        try {
            const response = await axios.post(
                `/cashier/queue/${activeQueue.id}/send-receipt`
            );
            setActiveQueue(response.data);
            setShowReceipt(false);
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Gagal kirim struk");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmPickup = async () => {
        if (isLoading || !activeQueue) return;
        setIsLoading(true);
        try {
            await axios.post(`/cashier/queue/${activeQueue.id}/pickup`);
            setActiveQueue(null);
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Gagal konfirmasi pickup");
        } finally {
            setIsLoading(false);
        }
    };

    const skipQueue = async () => {
        if (isLoading || !activeQueue) return;
        if (!confirm("Yakin ingin skip antrian ini?")) return;
        setIsLoading(true);
        try {
            await axios.post(`/cashier/queue/${activeQueue.id}/skip`);
            setActiveQueue(null);
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Gagal skip");
        } finally {
            setIsLoading(false);
        }
    };

    const printReceipt = () => {
        window.print();
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const getStatusLabel = (status) => {
        const labels = {
            waiting: "Menunggu",
            called: "Dipanggil",
            waiting_payment: "Menunggu Bayar",
            paid: "Sudah Bayar",
            ready_pickup: "Siap Ambil",
            completed: "Selesai",
            cancelled: "Dibatalkan",
            expired: "Expired",
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            waiting: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            called: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            waiting_payment: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            ready_pickup: "bg-purple-500/20 text-purple-400 border-purple-500/30",
            completed: "bg-green-500/20 text-green-400 border-green-500/30",
            cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
        };
        return colors[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
    };

    // Step indicator for active queue
    const getStep = () => {
        if (!activeQueue) return 0;
        const steps = {
            called: 1,
            waiting_payment: 2,
            paid: 3,
            ready_pickup: 4,
        };
        return steps[activeQueue.status] || 0;
    };

    const currentStep = getStep();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            {/* Header */}
            <header className="glass border-b border-white/10 no-print">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            🖥️ Panel Kasir
                        </h1>
                        <p className="text-indigo-300 text-sm">
                            Kelola antrian pelanggan
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-amber-400">
                                {stats.waiting}
                            </p>
                            <p className="text-white/40 text-xs">Menunggu</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-400">
                                {stats.completed}
                            </p>
                            <p className="text-white/40 text-xs">Selesai</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white/60">
                                {stats.total}
                            </p>
                            <p className="text-white/40 text-xs">Total</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* === Main Panel (2/3) === */}
                    <div className="lg:col-span-2 no-print">
                        {!activeQueue ? (
                            /* === IDLE: No active queue === */
                            <div className="glass rounded-3xl p-12 text-center">
                                <span className="text-7xl block mb-6">☕</span>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Kasir Tersedia
                                </h2>
                                <p className="text-white/50 mb-8">
                                    {stats.waiting > 0
                                        ? `${stats.waiting} pelanggan menunggu`
                                        : "Tidak ada antrian saat ini"}
                                </p>

                                <button
                                    onClick={callNext}
                                    disabled={isLoading || stats.waiting === 0}
                                    className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg ${
                                        isLoading || stats.waiting === 0
                                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white hover:scale-105 active:scale-95 shadow-emerald-500/30"
                                    }`}
                                >
                                    {isLoading
                                        ? "⏳ Memanggil..."
                                        : "📢 Panggil Berikutnya"}
                                </button>
                            </div>
                        ) : (
                            /* === ACTIVE QUEUE === */
                            <div className="glass rounded-3xl p-6">
                                {/* Queue Number + Status */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-white/50 text-xs uppercase tracking-wider">
                                            Sedang Melayani
                                        </p>
                                        <h2 className="text-5xl font-black text-white mt-1">
                                            {activeQueue.queue_number}
                                        </h2>
                                    </div>
                                    <span
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold border ${getStatusColor(
                                            activeQueue.status
                                        )}`}
                                    >
                                        {getStatusLabel(activeQueue.status)}
                                    </span>
                                </div>

                                {/* Step Progress */}
                                <div className="flex items-center gap-1 mb-6">
                                    {[
                                        "Dipanggil",
                                        "Menunggu Bayar",
                                        "Sudah Bayar",
                                        "Siap Ambil",
                                    ].map((label, idx) => (
                                        <div key={idx} className="flex-1">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                                    idx + 1 <= currentStep
                                                        ? "bg-indigo-500"
                                                        : "bg-white/10"
                                                }`}
                                            />
                                            <p
                                                className={`text-[10px] mt-1 text-center ${
                                                    idx + 1 <= currentStep
                                                        ? "text-indigo-300"
                                                        : "text-white/20"
                                                }`}
                                            >
                                                {label}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Details */}
                                {activeQueue.order && (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                                        <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
                                            Detail Pesanan
                                        </p>
                                        {activeQueue.order.items?.map(
                                            (item, idx) => (
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
                                                        {formatPrice(
                                                            item.subtotal
                                                        )}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                        <div className="flex justify-between pt-3 mt-2 border-t border-white/10">
                                            <span className="text-white font-semibold">
                                                Total
                                            </span>
                                            <span className="text-amber-400 font-bold text-lg">
                                                Rp{" "}
                                                {formatPrice(
                                                    activeQueue.order
                                                        .total_amount
                                                )}
                                            </span>
                                        </div>
                                        {activeQueue.order.payment_method && (
                                            <div className="mt-2 pt-2 border-t border-white/5">
                                                <span className="text-white/40 text-xs">
                                                    Metode:{" "}
                                                </span>
                                                <span className="text-white/70 text-xs uppercase font-semibold">
                                                    {
                                                        activeQueue.order
                                                            .payment_method
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons based on status */}
                                <div className="space-y-3">
                                    {/* Step 1: Called → Wait for user to select payment OR skip */}
                                    {activeQueue.status === "called" && (
                                        <div className="space-y-3">
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                                                <p className="text-blue-300 text-sm">
                                                    ⏳ Menunggu pelanggan
                                                    memilih metode pembayaran...
                                                </p>
                                            </div>
                                            <button
                                                onClick={skipQueue}
                                                disabled={isLoading}
                                                className="w-full py-3 rounded-xl font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all"
                                            >
                                                ⏭️ Skip Antrian
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 2: Waiting Payment → Confirm payment OR skip */}
                                    {activeQueue.status ===
                                        "waiting_payment" && (
                                        <div className="space-y-3">
                                            <button
                                                onClick={confirmPayment}
                                                disabled={isLoading}
                                                className="w-full py-3.5 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/30"
                                            >
                                                {isLoading
                                                    ? "⏳ Memproses..."
                                                    : "✅ Konfirmasi Bayar"}
                                            </button>
                                            <button
                                                onClick={skipQueue}
                                                disabled={isLoading}
                                                className="w-full py-3 rounded-xl font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all"
                                            >
                                                ⏭️ Skip Antrian
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 3: Paid → Print receipt + Send */}
                                    {activeQueue.status === "paid" && (
                                        <div className="space-y-3">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                                                <p className="text-emerald-400 font-semibold">
                                                    ✅ Pembayaran Berhasil
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() =>
                                                        setShowReceipt(true)
                                                    }
                                                    className="py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all"
                                                >
                                                    🧾 Cetak Struk
                                                </button>
                                                <button
                                                    onClick={sendReceipt}
                                                    disabled={isLoading}
                                                    className="py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/30"
                                                >
                                                    {isLoading
                                                        ? "⏳..."
                                                        : "📤 Kirim"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 4: Ready Pickup → Confirm pickup */}
                                    {activeQueue.status === "ready_pickup" && (
                                        <div className="space-y-3">
                                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                                                <p className="text-purple-400 font-semibold">
                                                    📦 Menunggu pelanggan
                                                    mengambil pesanan...
                                                </p>
                                            </div>
                                            <button
                                                onClick={confirmPickup}
                                                disabled={isLoading}
                                                className="w-full py-3.5 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/30"
                                            >
                                                {isLoading
                                                    ? "⏳..."
                                                    : "✅ Pickup Selesai"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* === Sidebar: Waiting Queue List (1/3) === */}
                    <div className="no-print">
                        <div className="glass rounded-3xl p-5">
                            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                📋 Daftar Antrian
                                {stats.waiting > 0 && (
                                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                                        {stats.waiting}
                                    </span>
                                )}
                            </h3>

                            {waitingQueues.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="text-3xl block mb-2 opacity-50">
                                        📭
                                    </span>
                                    <p className="text-white/30 text-sm">
                                        Tidak ada antrian
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {waitingQueues.map((q, idx) => (
                                        <div
                                            key={q.id}
                                            className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between animate-slide-up"
                                            style={{
                                                animationDelay: `${
                                                    idx * 50
                                                }ms`,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-amber-400 font-mono font-bold text-sm">
                                                    #{idx + 1}
                                                </span>
                                                <span className="text-white font-semibold">
                                                    {q.queue_number}
                                                </span>
                                            </div>
                                            <span className="text-white/30 text-xs">
                                                {new Date(
                                                    q.created_at
                                                ).toLocaleTimeString("id-ID", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* === Receipt Modal (for printing) === */}
            {showReceipt && activeQueue?.order && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm no-print"
                        onClick={() => setShowReceipt(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                            {/* Receipt Content */}
                            <div className="receipt-print p-6">
                                <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        🏪 Toko Antrian
                                    </h2>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Struk Pembayaran
                                    </p>
                                </div>

                                <div className="space-y-1 text-sm text-gray-700 mb-4">
                                    <div className="flex justify-between">
                                        <span>No. Antrian:</span>
                                        <span className="font-bold">
                                            {activeQueue.queue_number}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tanggal:</span>
                                        <span>
                                            {new Date().toLocaleDateString(
                                                "id-ID"
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Waktu:</span>
                                        <span>
                                            {new Date().toLocaleTimeString(
                                                "id-ID"
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Metode:</span>
                                        <span className="uppercase">
                                            {activeQueue.order
                                                .payment_method || "Cash"}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-dashed border-gray-300 pt-3 mb-3">
                                    {activeQueue.order.items?.map(
                                        (item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between py-1 text-sm text-gray-700"
                                            >
                                                <span>
                                                    {item.product?.name}{" "}
                                                    ×{item.quantity}
                                                </span>
                                                <span>
                                                    Rp{" "}
                                                    {formatPrice(
                                                        item.subtotal
                                                    )}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>

                                <div className="border-t border-dashed border-gray-300 pt-3">
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>
                                            Rp{" "}
                                            {formatPrice(
                                                activeQueue.order.total_amount
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300">
                                    <p className="text-gray-400 text-xs">
                                        Terima kasih telah berbelanja!
                                    </p>
                                </div>
                            </div>

                            {/* Print Actions */}
                            <div className="p-4 border-t border-gray-100 flex gap-2 no-print">
                                <button
                                    onClick={() => setShowReceipt(false)}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={printReceipt}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                                >
                                    🖨️ Print
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
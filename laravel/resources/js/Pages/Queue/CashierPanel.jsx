import { useState } from "react";
import axios from "axios";

export default function CashierPanel() {
    const [currentQueue, setCurrentQueue] = useState(null);

    const callNext = async () => {
        if (currentQueue) return; // lock kasir

        const response = await axios.post("/queue/call-next");
        setCurrentQueue(response.data);
    };

    const startProcess = async () => {
        const response = await axios.post(`/queue/start/${currentQueue.id}`);
        setCurrentQueue(response.data);
    };

    const completeQueue = async () => {
        const response = await axios.post(`/queue/complete/${currentQueue.id}`);

        setCurrentQueue(null); // kasir free lagi
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Panel Kasir</h1>

            {/* Status kasir */}
            <div className="mt-4 mb-4">
                {currentQueue ? (
                    <div className="text-red-500 font-bold">
                        Kasir sedang digunakan
                    </div>
                ) : (
                    <div className="text-green-500 font-bold">
                        Kasir tersedia
                    </div>
                )}
            </div>

            <button
                onClick={callNext}
                disabled={!!currentQueue}
                className={`px-4 py-2 rounded mt-4 text-white ${
                    currentQueue
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-500"
                }`}
            >
                Panggil Berikutnya
            </button>

            {currentQueue && (
                <div className="mt-6 border p-4 rounded">
                    <h2 className="text-xl font-bold">
                        {currentQueue.queue_number}
                    </h2>

                    <p>Status: {currentQueue.status}</p>

                    {currentQueue.status === "called" && (
                        <button
                            onClick={startProcess}
                            className="bg-yellow-500 text-white px-4 py-2 rounded mt-2 mr-2"
                        >
                            Mulai Proses
                        </button>
                    )}

                    {currentQueue.status === "processing" && (
                        <button
                            onClick={completeQueue}
                            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                        >
                            Selesai
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
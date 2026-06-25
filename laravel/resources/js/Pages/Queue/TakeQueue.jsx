import { useState } from "react";
import axios from "axios";

export default function TakeQueue() {
    const [customerName, setCustomerName] = useState("");
    const [queue, setQueue] = useState(null);

    const handleTakeQueue = async () => {
        const response = await axios.post("/queue/take", {
            customer_name: customerName
        });

        setQueue(response.data.data);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Ambil Antrian</h1>

            <input
                type="text"
                placeholder="Nama"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border p-2 rounded"
            />

            <button
                onClick={handleTakeQueue}
                className="bg-blue-500 text-white px-4 py-2 ml-2 rounded"
            >
                Ambil
            </button>

            {queue && (
                <div className="mt-4">
                    <h2>Nomor Antrian:</h2>
                    <p className="text-3xl font-bold">{queue.queue_number}</p>
                </div>
            )}
        </div>
    );
}
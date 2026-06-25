import { useEffect, useState } from "react";

export default function Index() {
    const [queueNumber, setQueueNumber] = useState("");

    useEffect(() => {
        const savedQueue = localStorage.getItem("queue_number");
        setQueueNumber(savedQueue);
    }, []);

    return (
        <div className="p-6 text-center">
            <h1 className="text-3xl font-bold mb-4">
                Nomor Antrian Kamu
            </h1>

            <div className="text-6xl font-bold text-blue-600">
                {queueNumber}
            </div>

            <p className="mt-4">
                Menunggu dipanggil oleh kasir...
            </p>
        </div>
    );
}
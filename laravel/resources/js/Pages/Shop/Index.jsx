import { useState } from "react";
import axios from "axios";

export default function Index({ products }) {
    const [cart, setCart] = useState([]);

    const addToCart = (product) => {
        setCart([...cart, product]);
    };

    const checkout = async () => {
        console.log("CHECKOUT CLICKED");

        const response = await axios.post("/checkout", {
            cart,
        });

       localStorage.setItem(
    "queue_number",
    response.data.queue.queue_number
);

window.location.href = `/waiting/${response.data.order.id}`;
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Etalase Produk</h1>

            <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="border p-4 rounded">
                        <h2 className="font-bold">{product.name}</h2>
                        <p>{product.description}</p>
                        <p>Rp {product.price}</p>

                        <button
                            onClick={() => addToCart(product)}
                            className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
                        >
                            Tambah
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold">Cart</h2>

                {cart.length === 0 ? (
                    <p>Belum ada item</p>
                ) : (
                    cart.map((item, index) => (
                        <div key={index}>
                            {item.name} - Rp {item.price}
                        </div>
                    ))
                )}

                {cart.length > 0 && (
                    <button
                        onClick={checkout}
                        className="bg-green-500 text-white px-4 py-2 mt-4 rounded"
                    >
                        Bayar
                    </button>
                )}
            </div>
        </div>
    );
}
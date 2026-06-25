import { useState } from "react";
import axios from "axios";

export default function Index({ products }) {
    const [cart, setCart] = useState([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showCart, setShowCart] = useState(false);

    const addToCart = (product) => {
        const existing = cart.find((item) => item.id === product.id);
        if (existing) {
            setCart(
                cart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCart(
            cart
                .map((item) =>
                    item.id === productId
                        ? { ...item, quantity: item.quantity + delta }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const totalAmount = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const checkout = async () => {
        if (isCheckingOut || cart.length === 0) return;
        setIsCheckingOut(true);

        try {
            const response = await axios.post("/checkout", {
                cart: cart.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                })),
            });

            window.location.href = `/waiting/${response.data.token}`;
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Gagal checkout. Silakan coba lagi.");
            setIsCheckingOut(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            🛍️ Toko Antrian
                        </h1>
                        <p className="text-indigo-300 text-sm">
                            Pilih produk, bayar, dan ambil!
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCart(!showCart)}
                        className="relative bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
                    >
                        🛒 Keranjang
                        {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-number-pop">
                                {totalItems}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product, index) => (
                        <div
                            key={product.id}
                            className="group bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Product Image */}
                            <div className="aspect-square bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                {product.image ? (
                                    <img
                                        src={`/storage/${product.image}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-5xl opacity-60">
                                        📦
                                    </span>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-white text-sm truncate">
                                    {product.name}
                                </h3>
                                {product.description && (
                                    <p className="text-indigo-300/70 text-xs mt-1 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-amber-400 font-bold text-sm">
                                        Rp {formatPrice(product.price)}
                                    </span>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        + Tambah
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {products.length === 0 && (
                    <div className="text-center py-20">
                        <span className="text-6xl mb-4 block">🏪</span>
                        <p className="text-white/60 text-lg">
                            Belum ada produk tersedia
                        </p>
                    </div>
                )}
            </div>

            {/* Cart Overlay */}
            {showCart && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowCart(false)}
                />
            )}

            {/* Cart Sidebar */}
            <div
                className={`fixed right-0 top-0 h-full w-full sm:w-96 z-50 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 transform transition-transform duration-300 ease-out ${
                    showCart ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Cart Header */}
                    <div className="p-5 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">
                            🛒 Keranjang
                        </h2>
                        <button
                            onClick={() => setShowCart(false)}
                            className="text-white/60 hover:text-white text-2xl transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {cart.length === 0 ? (
                            <div className="text-center py-10">
                                <span className="text-5xl mb-3 block">
                                    🛒
                                </span>
                                <p className="text-white/40">
                                    Keranjang masih kosong
                                </p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 animate-slide-up"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="text-white font-medium text-sm">
                                                {item.name}
                                            </h4>
                                            <p className="text-amber-400 text-xs mt-1">
                                                Rp{" "}
                                                {formatPrice(item.price)} × {item.quantity}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                removeFromCart(item.id)
                                            }
                                            className="text-red-400 hover:text-red-300 text-sm ml-2 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        -1
                                                    )
                                                }
                                                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors"
                                            >
                                                −
                                            </button>
                                            <span className="text-white font-semibold text-sm min-w-[20px] text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    updateQuantity(item.id, 1)
                                                }
                                                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="text-white font-bold text-sm">
                                            Rp{" "}
                                            {formatPrice(
                                                item.price * item.quantity
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Footer */}
                    {cart.length > 0 && (
                        <div className="p-5 border-t border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-white/70 font-medium">
                                    Total
                                </span>
                                <span className="text-2xl font-bold text-white">
                                    Rp {formatPrice(totalAmount)}
                                </span>
                            </div>
                            <button
                                onClick={checkout}
                                disabled={isCheckingOut}
                                className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${
                                    isCheckingOut
                                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white hover:scale-[1.02] active:scale-95 shadow-emerald-500/30"
                                }`}
                            >
                                {isCheckingOut ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg
                                            className="animate-spin h-5 w-5"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Memproses...
                                    </span>
                                ) : (
                                    `🛒 Beli — Rp ${formatPrice(totalAmount)}`
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
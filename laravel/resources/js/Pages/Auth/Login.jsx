import { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status, cashiers = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const [selectedCashier, setSelectedCashier] = useState(null);

    // Auto-select cashier if email is already present in form data (e.g. after validation redirect)
    useEffect(() => {
        if (data.email && cashiers.length > 0) {
            const cashier = cashiers.find(c => c.email === data.email);
            if (cashier) {
                setSelectedCashier(cashier);
            }
        }
    }, [data.email, cashiers]);

    const handleSelectCashier = (cashier) => {
        setSelectedCashier(cashier);
        setData('email', cashier.email);
        reset('password');
    };

    const handleBack = () => {
        setSelectedCashier(null);
        setData('email', '');
        reset('password');
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // Helper to get initials for avatar
    const getInitials = (name) => {
        return name
            ? name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
            : 'K';
    };

    // Gradients for avatars to make them colorful
    const avatarGradients = [
        'from-purple-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-pink-500 to-rose-600',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            <Head title="Log in Kasir" />

            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <span className="text-6xl block mb-4 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">🏪</span>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                        Sistem Antrian Kasir
                    </h1>
                    <p className="text-indigo-300/70 text-sm mt-1">
                        Pilih profil kasir Anda untuk masuk ke panel
                    </p>
                </div>

                {status && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center max-w-md mx-auto">
                        {status}
                    </div>
                )}

                {/* Main Content Card */}
                <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden animate-slide-up">
                    {/* Decorative lights */}
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    {!selectedCashier ? (
                        /* ================= SELECT CASHIER SCREEN ================= */
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-white mb-6 text-center md:text-left border-b border-white/5 pb-4">
                                Masuk Sebagai
                            </h2>

                            {cashiers.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-white/40">Tidak ada data kasir. Silakan jalankan seeder terlebih dahulu.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {cashiers.map((cashier, index) => {
                                        const gradient = avatarGradients[index % avatarGradients.length];
                                        return (
                                            <button
                                                key={cashier.id}
                                                onClick={() => handleSelectCashier(cashier)}
                                                className="group glass hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 hover:shadow-indigo-500/10 p-6 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:scale-105 active:scale-95"
                                            >
                                                {/* Avatar */}
                                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-extrabold text-xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    {getInitials(cashier.name)}
                                                </div>

                                                {/* Cashier Name */}
                                                <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors duration-200">
                                                    {cashier.name}
                                                </h3>

                                                {/* Cashier Email */}
                                                <p className="text-white/40 text-xs mt-1">
                                                    {cashier.email}
                                                </p>

                                                {/* Action indicator */}
                                                <span className="mt-4 px-4 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white text-xs font-semibold tracking-wider uppercase transition-all duration-300">
                                                    Pilih Profil
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ================= ENTER PASSWORD SCREEN ================= */
                        <div className="max-w-md mx-auto relative z-10">
                            {/* Back button */}
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors mb-6 group"
                            >
                                <span className="text-lg group-hover:-translate-x-1 transition-transform duration-200">←</span>
                                Kembali ke daftar kasir
                            </button>

                            <div className="flex flex-col items-center text-center mb-8">
                                {/* Selected Cashier Info */}
                                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${avatarGradients[cashiers.indexOf(selectedCashier) % avatarGradients.length] || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-extrabold text-3xl mb-4 shadow-xl border border-white/10`}>
                                    {getInitials(selectedCashier.name)}
                                </div>
                                <h2 className="text-2xl font-extrabold text-white">
                                    {selectedCashier.name}
                                </h2>
                                <p className="text-white/40 text-sm mt-1">
                                    {selectedCashier.email}
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
                                        Password Akses
                                    </label>

                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className={`w-full px-4 py-3 bg-white/5 border ${
                                            errors.password || errors.email ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-indigo-500'
                                        } rounded-xl text-white placeholder-white/20 focus:ring-0 focus:outline-none transition-colors duration-200 text-center font-semibold tracking-widest text-lg`}
                                        placeholder="••••••••"
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoFocus
                                        required
                                    />

                                    {/* Handle validation errors */}
                                    {(errors.password || errors.email) && (
                                        <p className="text-rose-400 text-xs font-semibold mt-2 text-center animate-fade-in">
                                            {errors.password || errors.email}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-lg shadow-indigo-500/20"
                                >
                                    {processing ? '⏳ Memproses...' : '🔐 Masuk Dashboard'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

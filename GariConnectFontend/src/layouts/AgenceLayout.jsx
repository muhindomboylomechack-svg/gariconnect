import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSun, FaMoon, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const AgenceLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // ✅ Initialisation cohérente du thème (identique aux autres Layouts)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const handleLogout = () => {
        if(window.confirm("⚠️ GariConnect : Voulez-vous vraiment quitter l'espace agence ?")) {
            logout();
            navigate('/login');
        }
    };

    const navLinks = [
        { to: "/agence", label: "Vue d'ensemble", icon: "📊" },
        { to: "/agence/performance", label: "Intelligence", icon: "🧠" },
        { to: "/agence/flotte", label: "Ma Flotte", icon: "🚌" },
        { to: "/agence/trajets", label: "Gestion Trajets", icon: "🛣️" },
        { to: "/agence/reservations", label: "Réservations", icon: "🎟️" },
        { to: "/agence/courriers", label: "Gestion Courriers", icon: "📦" },
        { to: "/agence/paiements", label: "Paiements", icon: "💳" },
        { to: "/agence/finances", label: "Livre de Caisse", icon: "👛" },
        { to: "/agence/chauffeurs", label: "Chauffeurs", icon: "👨‍✈️" },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-600 dark:text-white border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <h1 className="text-xl font-bold tracking-tight text-center text-slate-800 dark:text-white">
                    Gari<span className="text-blue-600 dark:text-blue-400">Connect</span>
                </h1>
                <div className="mt-2 text-center">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded">
                        Partenaire Agence
                    </span>
                </div>
            </div>

            <nav className="mt-6 px-4 space-y-1 flex-1 overflow-y-auto no-scrollbar">
                {navLinks.map((link) => {
                    const isActive = location.pathname === link.to;
                    return (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                                isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white'
                            }`}
                        >
                            <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {link.icon}
                            </span>
                            <span className="font-medium text-sm">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-600 hover:text-white text-slate-500 dark:text-slate-400 py-3 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-rose-500"
                >
                    <FaSignOutAlt /> <span className="font-semibold text-sm">Quitter</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
            
            {/* SIDEBAR DESKTOP */}
            <aside className="hidden lg:flex lg:w-64 flex-shrink-0 z-20">
                <SidebarContent />
            </aside>

            {/* SIDEBAR MOBILE AVEC ANIMATION */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                            onClick={() => setIsMobileMenuOpen(false)} 
                        />
                        <motion.aside 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute left-0 top-0 w-72 h-full shadow-2xl"
                        >
                            <SidebarContent />
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="absolute top-4 -right-12 w-10 h-10 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-full flex items-center justify-center shadow-xl"
                            >
                                <FaTimes />
                            </button>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            {/* ZONE PRINCIPALE */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-10 flex-shrink-0 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                            <FaBars />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Tableau de bord</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white italic">Espace Agence</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 lg:gap-6">
                        <button
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-xl transition-all duration-300 border border-transparent ${
                                isDarkMode ? 'bg-slate-800 text-yellow-400 hover:border-slate-700' : 'bg-slate-100 text-slate-600 hover:border-slate-200'
                            }`}
                        >
                            {isDarkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
                        </button>

                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex flex-col text-right">
                                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">Gestionnaire</span>
                                <span className="text-[10px] text-green-500 font-bold uppercase flex items-center justify-end gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Beni, RDC
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-400 flex items-center justify-center text-white font-black shadow-lg">
                                AG
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 lg:p-8 no-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default AgenceLayout;
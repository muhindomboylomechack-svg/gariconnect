import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
    FaUserCircle, FaHistory, FaChartLine, FaSignOutAlt, 
    FaHome, FaBars, FaTimes, FaSun, FaMoon, FaBell, FaSync, FaCheckDouble,
    FaMapMarkerAlt // <-- NOUVEL IMPORT POUR L'ICÔNE VIP
} from 'react-icons/fa';
import { GiSteeringWheel } from 'react-icons/gi'; 
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api'; 

const ChauffeurLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // États de l'interface
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // États pour les notifications
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Gestion du thème
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

    // ==========================================
    // LOGIQUE DES NOTIFICATIONS
    // ==========================================
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/mes-notifications');
            if (res.status === 200) {
                setNotifications(res.data);
            }
        } catch (err) {
            console.error("Erreur de chargement des notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Vérification automatique toutes les 30 secondes
        const intervalId = setInterval(fetchNotifications, 30000);
        return () => clearInterval(intervalId);
    }, []);

    const unreadCount = notifications.filter(n => !n.lue).length;

    const marquerCommeLue = async (notifId) => {
        try {
            await api.put(`/notifications/${notifId}/lire`);
            setNotifications(notifications.map(n => n.id === notifId ? { ...n, lue: true } : n));
        } catch (error) {
            console.error("Erreur marquage notification:", error);
        }
    };

    // ==========================================
    // LOGIQUE DE RAFRAÎCHISSEMENT GLOBAL
    // ==========================================
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchNotifications();
        
        // Déclenche les événements pour que les pages (Historique, Dashboard) se rafraîchissent
        window.dispatchEvent(new Event('actualiserHistorique'));
        window.dispatchEvent(new Event('refreshChauffeurData')); 
        
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleLogout = () => {
        if(window.confirm("⚠️ GariConnect : Voulez-vous vraiment fermer votre session de conduite ?")) {
            logout();
            navigate('/login');
        }
    };

    // ==========================================
    // 🚀 MENU DE NAVIGATION MIS À JOUR
    // ==========================================
    const menuItems = [
        { path: '/chauffeur', label: 'Tableau de bord', icon: <FaHome /> },
        { path: '/chauffeur/historique', label: 'Mes Courses', icon: <FaHistory /> },
        { path: '/chauffeur/vip', label: 'Ramassages VIP', icon: <FaMapMarkerAlt /> }, // <-- LE NOUVEAU BOUTON VIP EST ICI
        { path: '/chauffeur/performance', label: 'Performance', icon: <FaChartLine /> },
        { path: '/chauffeur/profil', label: 'Mon Profil', icon: <FaUserCircle /> },
    ];

    // Fonction de rendu des boutons pour l'utiliser dans le header Mobile et Desktop
    const renderActionButtons = () => (
        <div className="flex items-center gap-2">
            {/* Bouton Refresh */}
            <motion.button 
                onClick={handleRefresh}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative z-50"
            >
                <FaSync className={`${isRefreshing ? 'animate-spin' : ''}`} size={14} />
            </motion.button>

            {/* Bouton Cloche Notification */}
            <motion.button 
                onClick={() => setShowNotifications(!showNotifications)}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 flex items-center justify-center rounded-xl relative bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 z-50"
            >
                <FaBell size={15} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white font-bold rounded-full text-[9px] border-2 border-white dark:border-slate-900 shadow-md">
                        {unreadCount}
                    </span>
                )}
            </motion.button>

            {/* Bouton Mode Sombre / Clair */}
            <motion.button 
                onClick={toggleTheme} 
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 z-50"
            >
                {isDarkMode ? <FaSun size={15} /> : <FaMoon size={15} />}
            </motion.button>
        </div>
    );

    return (
        <div className="min-h-screen font-sans flex transition-colors duration-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative">
            
            {/* PANNEAU DES NOTIFICATIONS (OVERLAY GLOBAL) */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-20 right-4 lg:right-10 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[100] overflow-hidden"
                    >
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">Notifications</h3>
                            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
                            {notifications.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 font-medium py-8">Aucune notification.</p>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => marquerCommeLue(notif.id)}
                                        className={`p-3 mb-2 rounded-2xl cursor-pointer transition-all border ${
                                            notif.lue 
                                            ? 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50' 
                                            : 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 shadow-sm'
                                        }`}
                                    >
                                        <p className={`text-xs ${notif.lue ? 'text-slate-500 dark:text-slate-400' : 'text-indigo-900 dark:text-indigo-300 font-bold'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">
                                                {notif.date ? new Date(notif.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Récemment'}
                                            </span>
                                            {notif.lue && <FaCheckDouble className="text-emerald-500" size={10} />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR (Desktop) */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 lg:translate-x-0 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-none`}>
                
                <div className="flex flex-col h-full p-6">
                    {/* Logo */}
                    <div className="flex items-center justify-between mb-10 px-2">
                        <div className="flex items-center gap-3">
                            <motion.div 
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.5 }}
                                className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20"
                            >
                                <GiSteeringWheel className="text-white text-2xl" />
                            </motion.div>
                            <span className="text-xl font-black tracking-tighter uppercase">
                                Gari<span className="text-indigo-500">Driver</span>
                            </span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500">
                            <FaTimes />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className="block"
                            >
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                                        location.pathname === item.path 
                                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/20' 
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
                                    }`}
                                >
                                    {item.icon} {item.label}
                                </motion.div>
                            </Link>
                        ))}
                    </nav>

                    {/* Footer Sidebar */}
                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                            <FaSignOutAlt /> Déconnexion
                        </motion.button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* Header Global / Topbar (Desktop) */}
                <header className="hidden lg:flex h-20 items-center justify-between px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xs font-black uppercase tracking-widest text-slate-400">Espace Conduite</h1>
                        <span className="text-slate-300 dark:text-slate-700">/</span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                            {menuItems.find(item => item.path === location.pathname)?.label || "Tableau de Bord"}
                        </span>
                    </div>
                    {/* Boutons générés via la fonction */}
                    {renderActionButtons()}
                </header>

                {/* Header (Mobile) */}
                <header className="lg:hidden h-16 flex items-center justify-between px-6 sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <FaBars size={18} />
                    </button>
                    
                    <span className="font-black tracking-tighter uppercase text-lg">
                        Gari<span className="text-indigo-500">Driver</span>
                    </span>

                    {renderActionButtons()}
                </header>

                {/* Contenu de la page */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-10 pb-28 lg:pb-10 no-scrollbar">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-5xl mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </main>

                {/* BOTTOM NAVIGATION (Mobile) */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 backdrop-blur-xl border-t flex items-center justify-around px-4 z-40 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`relative flex flex-col items-center gap-1 p-2 transition-all ${
                                location.pathname === item.path ? 'text-indigo-500' : 'text-slate-500'
                            }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
                            {location.pathname === item.path && (
                                <motion.div 
                                    layoutId="bottomNavDot"
                                    className="w-1 h-1 bg-indigo-500 rounded-full mt-1"
                                />
                            )}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Overlay Mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChauffeurLayout;
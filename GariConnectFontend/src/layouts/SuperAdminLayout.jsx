import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaChartLine, FaUsers, FaSignOutAlt, 
  FaPercentage, FaWallet, FaBars, FaTimes,
  FaMoon, FaSun 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const SuperAdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Initialisation du thème (Identique à AgenceLayout pour la cohérence)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Par défaut sombre pour l'admin
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
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    if(window.confirm("⚠️ GariConnect Admin : Confirmez-vous la déconnexion ?")) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const navLinks = [
    { to: "/admin/dashboard", label: "Vue d'ensemble", icon: <FaChartLine />, section: "Principal" },
    { to: "/admin/utilisateurs", label: "Utilisateurs", icon: <FaUsers />, section: "Principal" },
    { to: "/admin/commissions", label: "Taux Commissions", icon: <FaPercentage />, section: "Contrats & Revenus" },
    { to: "/admin/finances", label: "Trésorerie Globale", icon: <FaWallet />, section: "Contrats & Revenus" },
  ];

  const activeClass = (path) => 
    location.pathname === path 
      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
      : "hover:bg-slate-800 text-slate-400 dark:hover:bg-slate-800/40";

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300 overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col p-6 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:relative lg:translate-x-0 border-r border-slate-800
      `}>
        {/* LOGO */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-black tracking-tighter">
            GARI<span className="text-blue-500">CONNECT</span>
          </h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">
            Administration Centrale
          </p>
        </div>

        {/* NAVIGATION DYNAMIQUE */}
        <nav className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
          <div>
            <p className="text-[10px] font-black text-slate-600 uppercase px-4 mb-4 tracking-widest">Navigation</p>
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  onClick={closeSidebar} 
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all font-bold group ${activeClass(link.to)}`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="text-sm">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* LOGOUT */}
        <button 
          onClick={handleLogout}
          className="mt-6 flex items-center gap-4 p-4 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-bold group"
        >
          <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-inner">
            <FaSignOutAlt />
          </div>
          <span className="text-sm">Déconnexion</span>
        </button>
      </aside>

      {/* --- MOBILE OVERLAY --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER BAR */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-30 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <button 
            className="lg:hidden p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white rounded-xl active:scale-95 transition-all"
            onClick={() => setIsSidebarOpen(true)}
          >
            <FaBars size={18} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {/* THEME TOGGLE */}
            <button 
              onClick={toggleTheme}
              className={`flex items-center gap-3 p-1.5 rounded-full border transition-all ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-yellow-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm">
                {isDarkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
              </div>
              <span className="hidden md:inline pr-3 text-[10px] font-black uppercase tracking-tighter">
                {isDarkMode ? 'Clair' : 'Sombre'}
              </span>
            </button>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>

            {/* ADMIN PROFILE */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:text-right sm:block">
                <p className="text-[10px] font-black text-blue-500 uppercase leading-none mb-1">Super Admin</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">GariConnect HQ</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center font-black text-white shadow-lg ring-2 ring-white dark:ring-slate-900">
                HQ
              </div>
            </div>
          </div>
        </header>

        {/* MAIN VIEW */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-950">
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

export default SuperAdminLayout;
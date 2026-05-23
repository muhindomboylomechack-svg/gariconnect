import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaHome, FaTicketAlt, FaBox, FaHistory, 
  FaUser, FaSignOutAlt, FaBars, FaTimes 
} from 'react-icons/fa';

// ✅ CHEMIN CONSERVÉ EXPRESSEMENT
import NotificationBell from '../../component/NotificationBell';

const NavItem = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold text-sm ${
    active 
    ? 'bg-indigo-600 text-white shadow-md' 
    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800'
  }`}>
    {icon} <span>{label}</span>
  </Link>
);

const Navbar = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinks = [
    { to: "/client/dashboard", icon: <FaHome />, label: t('back', "Tableau de bord") },
    { to: "/client/tickets", icon: <FaTicketAlt />, label: t('checkout.your_seat', "Mes Billets") },
    { to: "/client/colis", icon: <FaBox />, label: t('nav.parcels', "Colis") },
    { to: "/client/historique", icon: <FaHistory />, label: t('eval_post_trip', "Historique") }
  ];

  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-slate-900 z-50 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300 overflow-visible shadow-sm">
      <div className="container mx-auto px-4 lg:px-6 h-20 flex justify-between items-center overflow-visible">
        
        {/* LOGO */}
        <Link to="/client/dashboard" className="flex flex-col z-50 select-none">
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">GariConnect</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest">{t('nav.passenger_space', "Espace Voyageur")}</span>
        </Link>

        {/* Liens de navigation principaux (Desktop) */}
        <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl transition-colors">
          {navLinks.map(link => (
            <NavItem 
              key={link.to} 
              to={link.to} 
              icon={link.icon} 
              label={link.label} 
              active={location.pathname === link.to} 
            />
          ))}
        </div>

        {/* Bloc d'actions à droite (Cloche, Profil, Menu burger) */}
        <div className="flex items-center gap-2 sm:gap-4 z-50 relative overflow-visible">
          
          {/* Cloche autonome */}
          <NotificationBell />
          
          {/* Menu Profil (Desktop) */}
          <div className="hidden lg:block relative" ref={profileMenuRef}>
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 bg-indigo-50 dark:bg-slate-800 p-1 pr-5 rounded-full border border-indigo-100 dark:border-slate-700 transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                <FaUser size={14} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 leading-none">{t('profile', "Profil")}</p>
                <p className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-tighter">{t('verified', "Vérifié")}</p>
              </div>
            </button>

            {/* Menu Déroulant Profil (Desktop) */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-4 border-b border-slate-50 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('settings', "Paramètres")}</p>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <Link to="/client/profil" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <FaUser className="text-indigo-500 dark:text-indigo-400" /> {t('profile', "Profil")}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl w-full text-left transition-colors">
                    <FaSignOutAlt /> {t('logout', "Déconnexion")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bouton Menu Mobile (Burger) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full lg:hidden hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
          </button>
        </div>
      </div>

      {/* ✅ MENU MOBILE : POUSSE DYNAMIQUEMENT LES BOUTONS VERS LE BAS SANS ERREUR */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bottom-0 bg-white dark:bg-slate-950 z-40 p-4 sm:p-6 flex flex-col border-t border-slate-100 dark:border-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
          
          {/* Conteneur des liens du haut : 'flex-grow' prend l'espace disponible pour pousser le bas */}
          <div className="flex flex-col gap-3 mt-2 flex-grow justify-start">
            {navLinks.map(link => (
              <Link 
                key={link.to} 
                to={link.to} 
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                  location.pathname === link.to 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                <span className={location.pathname === link.to ? "text-white" : "text-indigo-500 dark:text-indigo-400"}>
                  {link.icon}
                </span> 
                {link.label}
              </Link>
            ))}
          </div>

          {/* Section Inférieure : Boutons ancrés solidement au bas de l'écran mobile */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 mb-2 flex flex-col gap-2">
            <Link 
              to="/client/profil"
              className="flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            >
              <FaUser className="text-indigo-500 dark:text-indigo-400" />
              {t('profile', "Mon Profil")}
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full text-left"
            >
              <FaSignOutAlt />
              {t('logout', "Déconnexion")}
            </button>
          </div>

        </div>
      )}
    </nav>
  );
};

export default Navbar;
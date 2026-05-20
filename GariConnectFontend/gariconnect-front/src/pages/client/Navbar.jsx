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
    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'
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
    { to: "/client/dashboard", icon: <FaHome />, label: t('back') },
    { to: "/client/tickets", icon: <FaTicketAlt />, label: t('checkout.your_seat') },
    { to: "/client/colis", icon: <FaBox />, label: "Colis" },
    { to: "/client/historique", icon: <FaHistory />, label: t('eval_post_trip') }
  ];

  return (
    // ✅ 'overflow-visible' : Garantit que la cloche, le menu déroulant et le profil ne seront jamais coupés par la barre de navigation
    <nav className="fixed top-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-50 border-b border-slate-100 dark:border-slate-800 transition-colors overflow-visible">
      <div className="container mx-auto px-4 lg:px-6 h-20 flex justify-between items-center overflow-visible">
        
        <Link to="/client/dashboard" className="flex flex-col z-50">
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">GariConnect</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Espace Voyageur</span>
        </Link>

        {/* Liens de navigation principaux (Desktop) */}
        <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
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

        {/* ✅ 'relative' et 'overflow-visible' : Permet au sous-composant cloche d'ouvrir son menu déroulant de manière absolue sans être tronqué */}
        <div className="flex items-center gap-3 lg:gap-4 z-50 relative overflow-visible">
          
          {/* ✅ Intégration de la cloche de notifications autonome */}
          <NotificationBell />
          
          {/* Menu Profil (Desktop) */}
          <div className="hidden lg:block relative" ref={profileMenuRef}>
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 bg-indigo-50 dark:bg-slate-800 p-1 pr-5 rounded-full border border-indigo-100 dark:border-slate-700 transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                <FaUser size={14} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white leading-none">{t('profile')}</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">{t('verified')}</p>
              </div>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-50 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings')}</p>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <Link to="/client/profil" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl">
                    <FaUser className="text-indigo-500" /> {t('profile')}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl w-full text-left">
                    <FaSignOutAlt /> Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full lg:hidden"
          >
            {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>

      {/* Menu Latéral / Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-20 bg-white dark:bg-slate-950 z-40 p-6 flex flex-col border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-2 flex-1 mt-4">
            {navLinks.map(link => (
              <Link 
                key={link.to} 
                to={link.to} 
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider ${
                  location.pathname === link.to 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
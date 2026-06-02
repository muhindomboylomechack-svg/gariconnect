import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AgencyAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Gestion de la déconnexion
  const handleLogout = () => {
    if (logout) {
      logout();
    }
    navigate('/login');
  };

  // Liens de navigation pour l'administrateur d'agence
  const menuItems = [
    {
      name: 'Tableau de Bord',
      path: '/admin-agence/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    // Vous pourrez facilement ajouter de futurs liens ici (Ex: Gestion de l'équipe, Rapports...)
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased overflow-hidden">
      
      {/* =========================================================================
          1. SIDEBAR (VERSION DESKTOP)
         ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-slate-200 border-r border-slate-800 shrink-0">
        {/* Logo / Identité */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-lg text-white font-black tracking-wider text-xs">GC</span>
            <span className="font-bold text-lg tracking-tight text-white">GariConnect <span className="text-xs text-indigo-400 font-medium">Admin</span></span>
          </div>
        </div>

        {/* Liens de navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Pied de la Sidebar (Bouton Déconnexion) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. SQUELETTE DE DROITE (HEADER + ZONE DE CONTENU)
         ========================================================================= */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        
        {/* BARRE SUPÉRIEURE (HEADER) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          {/* Bouton Menu Mobile (Burger) */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Titre contextuel ou Fil d'Ariane */}
          <div className="hidden sm:block text-sm font-medium text-slate-500">
            Espace Gestion d'Agence &bull; <span className="text-slate-800 font-semibold">Mode Administrateur</span>
          </div>

          {/* Profil utilisateur connecté */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.nom || 'Admin Agence'}</p>
              <p className="text-xs text-slate-400">{user?.email || 'admin@agence.com'}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {user?.nom ? user.nom.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        {/* ZONE DU CONTENU DYNAMIQUE (OUTLET) */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* C'est ici que React Router chargera les pages enfants (ex: AgencyAdminDashboard) */}
            <Outlet />
          </div>
        </main>
      </div>

      {/* =========================================================================
          3. SIDEBAR RESPONSIVE (VERSION MOBILE EN BANDEAU OVERLAY)
         ========================================================================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Arrière-plan flou et sombre */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Contenu du tiroir de navigation */}
          <div className="relative flex flex-col w-full max-w-xs bg-slate-950 text-slate-200 p-4 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Bouton de fermeture */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="font-bold text-lg text-white">Menu</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-slate-400 bg-slate-900 rounded-lg hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Liens de navigation mobile */}
            <nav className="flex-1 py-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Bouton de déconnexion mobile */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AgencyAdminLayout;
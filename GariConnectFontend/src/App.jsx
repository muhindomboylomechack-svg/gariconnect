import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FaBan, FaHeadset, FaSignOutAlt } from 'react-icons/fa'; // 🟢 AJOUT : Icônes pour l'écran de blocage

// ==========================================
// 0. CONFIGURATION DU THEME CONTEXT
// ==========================================
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// ==========================================
// 1. CONTEXTE & PROTECTION DES ROUTES
// ==========================================
import ProtectedRoute from './component/ProtectedRoute'; 
import { useAuth } from './context/AuthContext';

// ==========================================
// 2. LAYOUTS EN VUE DE STRUCTURE
// ==========================================
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AgencyAdminLayout from './layouts/AgencyAdminLayout'; 
import AgenceLayout from './layouts/AgenceLayout';
import ChauffeurLayout from './layouts/ChauffeurLayout';
import ClientLayout from './layouts/ClientLayout'; 

// ==========================================
// 3. PAGES : Authentification
// ==========================================
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChangePasswordObligatoire from './pages/auth/ChangePasswordObligatoire';

// ==========================================
// 4. PAGES : Espace Super Admin
// ==========================================
import DashboardAdmin from './pages/superadmin/DashboardAdmin';
import GestionUtilisateurs from './pages/superadmin/GestionUtilisateurs';
import GestionCommissions from './pages/superadmin/GestionCommissions';
import DashboardFinancierAdmin from './pages/superadmin/DashboardFinancierAdmin';
import SystemSettings from './pages/superadmin/SystemSettings'; // 🚀 AJOUT : Import de la page de paramétrage SaaS

// ==========================================
// 5. PAGES : Espace Admin d'Agence & Gestionnaire
// ==========================================
import AgencyAdminDashboard from './pages/admin/AgencyAdminDashboard'; 
import AgencyAdminProfile from './pages/admin/AgencyAdminProfile'; 
import DashboardAgence from './pages/agence/DashboardAgence';
import GestionFlotte from './pages/agence/GestionFlotte';
import Trajets from './pages/agence/Trajets';
import GestionReservations from './pages/agence/GestionReservations';
import GestionPaiements from './pages/agence/GestionPaiements';
import GestionChauffeurs from './pages/agence/GestionChauffeurs';
import CourriersPage from './pages/agence/CourriersPage';
import GestionFinance from './pages/agence/GestionFinance';
import DashboardPerformance from './pages/agence/DashboardPerformance';
import InterfaceCotationAgent from './pages/agence/InterfaceCotationAgent'; 
import RegulationAgence from './pages/agence/RegulationAgence'; 

// ==========================================
// 6. PAGES : Espace Chauffeur & Client
// ==========================================
import ChauffeurDashboard from './pages/chauffeur/ChauffeurDashboard'; 
import HistoriqueCourses from './pages/chauffeur/HistoriqueCourses'; 
import PerformanceHistory from './pages/chauffeur/PerformanceHistory'; 
import ChauffeurProfil from './pages/chauffeur/ChauffeurProfil'; 
import RamassageVipChauffeur from './pages/chauffeur/RamassageVipChauffeur';
import CourseActuelle from './pages/chauffeur/CourseActuelle'; 
import ListeRamassage from './pages/chauffeur/ListeRamassage'; 

import HomeClient from "./pages/client/Home";
import MesTickets from "./pages/client/MesTickets"; 
import History from "./pages/client/History";
import ReservationPage from "./pages/client/ReservationPage";
import Profil from "./pages/client/Profil"; 
import CheckoutPage from "./pages/client/CheckoutPage"; 
import FormulaireEvaluation from "./pages/client/FormulaireEvaluation";
import ReservationRecuperationPage from "./pages/client/RecuperationReservationPage";
import PagePaiementReservation from "./pages/client/PagePaiementReservation"; 

// 🚀 AJOUT DE L'IMPORT POUR LE HUB COLIS / COURRIER DU CLIENT
import ClientCourrierHub from "./pages/client/ClientCourrierHub"; 

// ==========================================
// 🟢 7. COMPOSANTS DE SÉCURITÉ POUR COMPTES BLOQUÉS
// ==========================================
const EcranBloque = () => {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="absolute w-96 h-96 bg-rose-600/10 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse"></div>

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
          <FaBan size={36} className="animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">
            Accès Interdit / Compte Bloqué
          </h2>
          <p className="text-slate-400 text-xs font-medium leading-relaxed">
            Votre compte a été suspendu par le <span className="text-blue-400 font-bold">Super Admin</span> de la plateforme GariConnect.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl text-left text-xs text-slate-400 space-y-2">
          <p className="flex items-start gap-2">
            <span className="text-rose-500 font-bold">•</span>
            <span>Vous avez été bloqué par le superadmin, prière de le contacter.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-rose-500 font-bold">•</span>
            <span>Toutes vos actions et accès aux espaces de l'application sont immédiatement suspendus.</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <a 
            href="mailto:support@gariconnect.com" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg"
          >
            <FaHeadset size={12} /> Contacter le Super Admin
          </a>
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider border border-slate-800 transition-all"
          >
            <FaSignOutAlt size={12} /> Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};

const BlockGuard = ({ children }) => {
  const { user } = useAuth();
  if (user && (user.statut === 'INACTIF' || user.statut === 'BLOQUE')) {
    return <Navigate to="/compte-bloque" replace />;
  }
  return children;
};

// ==========================================
// 8. REDIRECTION RACINE DE SESSION
// ==========================================
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse">Chargement de votre session...</div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;

  // 🟢 AJOUT : Vérification du blocage dès la racine
  if (user.statut === 'INACTIF' || user.statut === 'BLOQUE') {
    return <Navigate to="/compte-bloque" replace />;
  }
  
  if (user.mustChangePassword) {
    return <Navigate to="/change-password-obligatoire" replace />;
  }
  
  const cleanRole = user.role.replace('ROLE_', '');

  const routesParRole = { 
    SUPER_ADMIN: '/admin',
    AGENCY_ADMIN: '/admin-agence',
    AGENCY_MANAGER: '/agence',
    CHAUFFEUR: '/chauffeur',
    CLIENT: '/client',
    USER: '/client' 
  };
  
  const path = routesParRole[cleanRole] || '/';
  return <Navigate to={path} replace />;
};

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router>
        <Routes>
          {/* --- AUTHENTIFICATION & RACINE --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/change-password-obligatoire" element={<ChangePasswordObligatoire />} />
          <Route path="/compte-bloque" element={<EcranBloque />} /> {/* 🟢 AJOUT : Route dédiée à l'affichage du blocage */}

          {/* --- ESPACE 1 : SUPER ADMIN --- */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><BlockGuard><SuperAdminLayout /></BlockGuard></ProtectedRoute>}>
            <Route index element={<DashboardAdmin />} />
            <Route path="utilisateurs" element={<GestionUtilisateurs />} />
            <Route path="commissions" element={<GestionCommissions />} />
            <Route path="finances" element={<DashboardFinancierAdmin />} />
            <Route path="settings" element={<SystemSettings />} /> {/* 🚀 AJOUT : Nouvelle route pour le paramétrage SaaS */}
          </Route>

          {/* --- ESPACE 2 : AGENCY ADMIN --- */}
          <Route path="/admin-agence" element={<ProtectedRoute allowedRoles={['AGENCY_ADMIN']}><BlockGuard><AgencyAdminLayout /></BlockGuard></ProtectedRoute>}>
            <Route index element={<AgencyAdminDashboard />} />
            <Route path="dashboard" element={<AgencyAdminDashboard />} />
            <Route path="profile" element={<AgencyAdminProfile />} />
          </Route>

          {/* --- ESPACE 3 : AGENCY MANAGER & ADMIN --- */}
          <Route path="/agence" element={<ProtectedRoute allowedRoles={['AGENCY_MANAGER', 'AGENCY_ADMIN']}><BlockGuard><AgenceLayout /></BlockGuard></ProtectedRoute>}>
            <Route index element={<DashboardAgence />} />
            <Route path="flotte" element={<GestionFlotte />} />
            <Route path="trajets" element={<Trajets />} />
            <Route path="reservations" element={<GestionReservations />} />
            <Route path="ramassages-vip" element={<InterfaceCotationAgent />} />
            <Route path="regulation" element={<RegulationAgence />} />
            <Route path="paiements" element={<GestionPaiements />} />
            <Route path="chauffeurs" element={<GestionChauffeurs />} />
            <Route path="courriers" element={<CourriersPage />} />
            <Route path="cotation-colis" element={<InterfaceCotationAgent />} />
            <Route path="finances" element={<GestionFinance />} />
            <Route path="performance" element={<DashboardPerformance />} />
          </Route>

          {/* --- ESPACE 4 : CHAUFFEUR --- */}
          <Route path="/chauffeur" element={<ProtectedRoute allowedRoles={['CHAUFFEUR']}><BlockGuard><ChauffeurLayout /></BlockGuard></ProtectedRoute>}>
            <Route index element={<ChauffeurDashboard />} />
            <Route path="historique" element={<HistoriqueCourses />} />
            <Route path="vip" element={<RamassageVipChauffeur />} />
            <Route path="vip/:trajetId" element={<RamassageVipChauffeur />} />
            <Route path="course-actuelle" element={<CourseActuelle />} />
            <Route path="liste-ramassage" element={<ListeRamassage />} />
            <Route path="liste-ramassage/:arretId" element={<ListeRamassage />} />
            <Route path="performance" element={<PerformanceHistory />} />
            <Route path="profil" element={<ChauffeurProfil />} />
          </Route>

          {/* --- ESPACE 5 : CLIENT --- */}
          <Route path="/client" element={<ProtectedRoute allowedRoles={['CLIENT', 'USER']}><BlockGuard><ClientLayout /></BlockGuard></ProtectedRoute>}>
            <Route index element={<HomeClient />} />
            <Route path="tickets" element={<MesTickets />} />
            <Route path="historique" element={<History />} />
            <Route path="profil" element={<Profil />} />
            <Route path="reservation/:id" element={<ReservationPage />} />
            <Route path="evaluer/:id" element={<FormulaireEvaluation />} />
            <Route path="paiement-reservation/:reservationId" element={<PagePaiementReservation />} />
            <Route path="reservation-normale/:id" element={<CheckoutPage />} />
            <Route path="reservation-recuperation/:id" element={<ReservationRecuperationPage />} />
            <Route path="finaliser-reservation/:id" element={<CheckoutPage />} />
            
            <Route path="colis" element={<ClientCourrierHub />} />
            <Route path="courriers" element={<ClientCourrierHub />} />
          </Route>

          {/* --- ROUTE DE SECOURS --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
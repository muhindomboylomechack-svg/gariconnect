import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
// (Ajustez le chemin d'importation si nécessaire selon l'emplacement exact de votre fichier)
import ClientCourrierHub from "./pages/client/ClientCourrierHub"; 

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
  // 🟢 Initialisation du thème depuis le localStorage ou les préférences du système
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // 🟢 Application de la classe 'dark' sur l'élément racine HTML pour Tailwind CSS
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fonction utilitaire pour changer de mode
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

          {/* --- ESPACE 1 : SUPER ADMIN --- */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardAdmin />} />
            <Route path="utilisateurs" element={<GestionUtilisateurs />} />
            <Route path="commissions" element={<GestionCommissions />} />
            <Route path="finances" element={<DashboardFinancierAdmin />} />
          </Route>

          {/* --- ESPACE 2 : AGENCY ADMIN --- */}
          <Route path="/admin-agence" element={<ProtectedRoute allowedRoles={['AGENCY_ADMIN']}><AgencyAdminLayout /></ProtectedRoute>}>
            <Route index element={<AgencyAdminDashboard />} />
            <Route path="dashboard" element={<AgencyAdminDashboard />} />
            <Route path="profile" element={<AgencyAdminProfile />} />
          </Route>

          {/* --- ESPACE 3 : AGENCY MANAGER & ADMIN --- */}
          <Route path="/agence" element={<ProtectedRoute allowedRoles={['AGENCY_MANAGER', 'AGENCY_ADMIN']}><AgenceLayout /></ProtectedRoute>}>
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
          <Route path="/chauffeur" element={<ProtectedRoute allowedRoles={['CHAUFFEUR']}><ChauffeurLayout /></ProtectedRoute>}>
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
          <Route path="/client" element={<ProtectedRoute allowedRoles={['CLIENT', 'USER']}><ClientLayout /></ProtectedRoute>}>
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
            
            {/* 🚀 DEUX ROUTES AJOUTÉES ICI POUR LE BOUTON COLIS DU CLIENT */}
            {/* Permet de supporter les deux chemins possibles configurés sur le bouton */}
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
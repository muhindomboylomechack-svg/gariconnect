import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
// 🚏 NOUVEL IMPORT : RÉGULATION DES ARRÊTS DE BUS
import RegulationAgence from './pages/agence/RegulationAgence'; 

// ==========================================
// 6. PAGES : Espace Chauffeur & Client
// ==========================================
import ChauffeurDashboard from './pages/chauffeur/ChauffeurDashboard'; 
import HistoriqueCourses from './pages/chauffeur/HistoriqueCourses'; 
import PerformanceHistory from './pages/chauffeur/PerformanceHistory'; 
import ChauffeurProfil from './pages/chauffeur/ChauffeurProfil'; 
import RamassageVipChauffeur from './pages/chauffeur/RamassageVipChauffeur';

// 📱 NOUVEAUX IMPORTS : INTERFACE CHAUFFEUR MOBILE FIRST
import CourseActuelle from './pages/chauffeur/CourseActuelle'; // Écran 1 : Prochain arrêt & infos passagers
import ListeRamassage from './pages/chauffeur/ListeRamassage'; // Écran 2 : Pick-up list avec bouton Embarquer / QR Code

import HomeClient from "./pages/client/Home";
import MesTickets from "./pages/client/MesTickets"; 
import History from "./pages/client/History";
import ReservationPage from "./pages/client/ReservationPage";
import Profil from "./pages/client/Profil"; 
import CheckoutPage from "./pages/client/CheckoutPage"; 
import FormulaireEvaluation from "./pages/client/FormulaireEvaluation";
import ReservationRecuperationPage from "./pages/client/RecuperationReservationPage";

// Nouvelle page de paiement dynamique (VIP/Normal) après validation/cotation
import PagePaiementReservation from "./pages/client/PagePaiementReservation"; 

/**
 * COMPOSANT DE REDIRECTION INTELLIGENT
 * Analyse le rôle de l'utilisateur après connexion et le dirige vers le bon espace.
 */
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
  
  // Sécurité : Nettoyage du préfixe "ROLE_" si le backend l'ajoute automatiquement
  const cleanRole = user.role.replace('ROLE_', '');

  // Mapping strict des rôles vers les chemins applicatifs
  const routesParRole = { 
    SUPER_ADMIN: '/admin',
    AGENCY_ADMIN: '/admin-agence',
    AGENCY_MANAGER: '/agence',
    CHAUFFEUR: '/chauffeur',
    CLIENT: '/client',
    USER: '/client' 
  };
  
  const path = routesParRole[cleanRole] || '/';
  console.log(`Utilisateur avec le rôle [${cleanRole}] redirigé vers : ${path}`);
  
  return <Navigate to={path} replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- AUTHENTIFICATION & RACINE --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<HomeRedirect />} />

        {/* --- ESPACE 1 : SUPER ADMIN --- */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminLayout /></ProtectedRoute>}>
          <Route index element={<DashboardAdmin />} />
          <Route path="utilisateurs" element={<GestionUtilisateurs />} />
          <Route path="commissions" element={<GestionCommissions />} />
          <Route path="finances" element={<DashboardFinancierAdmin />} />
        </Route>

        {/* --- ESPACE 2 : AGENCY ADMIN (Propriétaire de l'agence) --- */}
        <Route path="/admin-agence" element={<ProtectedRoute allowedRoles={['AGENCY_ADMIN']}><AgencyAdminLayout /></ProtectedRoute>}>
          <Route index element={<AgencyAdminDashboard />} />
          <Route path="dashboard" element={<AgencyAdminDashboard />} />
          <Route path="profile" element={<AgencyAdminProfile />} />
        </Route>

        {/* --- ESPACE 3 : AGENCY MANAGER & ADMIN (Opérations de l'agence) --- */}
        <Route path="/agence" element={<ProtectedRoute allowedRoles={['AGENCY_MANAGER', 'AGENCY_ADMIN']}><AgenceLayout /></ProtectedRoute>}>
          <Route index element={<DashboardAgence />} />
          <Route path="flotte" element={<GestionFlotte />} />
          <Route path="trajets" element={<Trajets />} />
          <Route path="reservations" element={<GestionReservations />} />
          <Route path="ramassages-vip" element={<InterfaceCotationAgent />} />
          
          {/* 🚀 NOUVELLE ROUTE ROUTER CONNECTÉE AU BOUTON GESTION DES ARRÊTS */}
          <Route path="regulation" element={<RegulationAgence />} />

          <Route path="paiements" element={<GestionPaiements />} />
          <Route path="chauffeurs" element={<GestionChauffeurs />} />
          <Route path="courriers" element={<CourriersPage />} />
          <Route path="finances" element={<GestionFinance />} />
          <Route path="performance" element={<DashboardPerformance />} />
        </Route>

        {/* --- ESPACE 4 : CHAUFFEUR --- */}
        <Route path="/chauffeur" element={<ProtectedRoute allowedRoles={['CHAUFFEUR']}><ChauffeurLayout /></ProtectedRoute>}>
          <Route index element={<ChauffeurDashboard />} />
          <Route path="historique" element={<HistoriqueCourses />} />
          
          {/* NOUVELLES ROUTES VIP POUR LE CHAUFFEUR */}
          <Route path="vip" element={<RamassageVipChauffeur />} />
          <Route path="vip/:trajetId" element={<RamassageVipChauffeur />} />
          
          {/* 📱 NOUVELLES ROUTES : L'INTERFACE CHAUFFEUR MOBILE FIRST */}
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
          
          {/* ⚡ LOGIQUE DE PAIEMENT UNIFIÉE DEJA PRESENTE ET FONCTIONNELLE */}
          <Route path="paiement-reservation/:reservationId" element={<PagePaiementReservation />} />
          
          {/* Étape intermédiare - Flux A : Réservation classique */}
          <Route path="reservation-normale/:id" element={<CheckoutPage />} />
          
          {/* Étape intermédiare - Flux B : Demande de récupération / Ramassage à domicile */}
          <Route path="reservation-recuperation/:id" element={<ReservationRecuperationPage />} />

          {/* Fallback de compatibilité descendante */}
          <Route path="finaliser-reservation/:id" element={<CheckoutPage />} />
        </Route>

        {/* --- ROUTE DE SECOURS (404 / FALLBACK) --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
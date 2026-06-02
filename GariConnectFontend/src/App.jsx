import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 1. CONTEXTE & PROTECTION
import ProtectedRoute from './component/ProtectedRoute'; 
import { useAuth } from './context/AuthContext';

// 2. LAYOUTS
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AgencyAdminLayout from './layouts/AgencyAdminLayout'; 
import AgenceLayout from './layouts/AgenceLayout';
import ChauffeurLayout from './layouts/ChauffeurLayout';
import ClientLayout from './layouts/ClientLayout'; 

// 3. PAGES (Authentification)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// 4. PAGES (Super Admin)
import DashboardAdmin from './pages/superadmin/DashboardAdmin';
import GestionUtilisateurs from './pages/superadmin/GestionUtilisateurs';
import GestionCommissions from './pages/superadmin/GestionCommissions';
import DashboardFinancierAdmin from './pages/superadmin/DashboardFinancierAdmin';

// 5. PAGES (Admin d'Agence & Opérations)
import AgencyAdminDashboard from './pages/admin/AgencyAdminDashboard'; 
import DashboardAgence from './pages/agence/DashboardAgence';
import GestionFlotte from './pages/agence/GestionFlotte';
import Trajets from './pages/agence/Trajets';
import GestionReservations from './pages/agence/GestionReservations';
import GestionPaiements from './pages/agence/GestionPaiements';
import GestionChauffeurs from './pages/agence/GestionChauffeurs';
import CourriersPage from './pages/agence/CourriersPage';
import GestionFinance from './pages/agence/GestionFinance';
import DashboardPerformance from './pages/agence/DashboardPerformance';

// 6. PAGES (Chauffeur & Client)
import ChauffeurDashboard from './pages/chauffeur/ChauffeurDashboard'; 
import HistoriqueCourses from './pages/chauffeur/HistoriqueCourses'; 
import PerformanceHistory from './pages/chauffeur/PerformanceHistory'; 
import ChauffeurProfil from './pages/chauffeur/ChauffeurProfil'; 
import HomeClient from "./pages/client/Home";
import MesTickets from "./pages/client/MesTickets"; 
import History from "./pages/client/History";
import ReservationPage from "./pages/client/ReservationPage";
import Profil from "./pages/client/Profil"; 
import CheckoutPage from "./pages/client/CheckoutPage"; 
import FormulaireEvaluation from "./pages/client/FormulaireEvaluation";

/**
 * COMPOSANT DE REDIRECTION INTELLIGENT
 * Analyse le rôle de l'utilisateur et le dirige vers le bon espace.
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
  
  // Sécurité : on nettoie le préfixe "ROLE_" si le backend l'ajoute automatiquement
  const cleanRole = user.role.replace('ROLE_', '');

  // MAPPING DES NOUVEAUX RÔLES
  const routesParRole = { 
    SUPER_ADMIN: '/admin',
    AGENCY_ADMIN: '/admin-agence',    // Remplacé ADMIN par AGENCY_ADMIN
    AGENCY_MANAGER: '/agence',        // Remplacé AGENCE par AGENCY_MANAGER
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
        {/* --- AUTHENTIFICATION --- */}
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
        {/* MISE À JOUR DU ROLE ICI ! */}
        <Route path="/admin-agence" element={<ProtectedRoute allowedRoles={['AGENCY_ADMIN']}><AgencyAdminLayout /></ProtectedRoute>}>
          <Route index element={<AgencyAdminDashboard />} />
          <Route path="dashboard" element={<AgencyAdminDashboard />} />
        </Route>

        {/* --- ESPACE 3 : AGENCY MANAGER (Opérations de l'agence) --- */}
        {/* MISE À JOUR DU ROLE ICI ! On peut aussi autoriser l'Admin à voir les opérations s'il le souhaite */}
        <Route path="/agence" element={<ProtectedRoute allowedRoles={['AGENCY_MANAGER', 'AGENCY_ADMIN']}><AgenceLayout /></ProtectedRoute>}>
          <Route index element={<DashboardAgence />} />
          <Route path="flotte" element={<GestionFlotte />} />
          <Route path="trajets" element={<Trajets />} />
          <Route path="reservations" element={<GestionReservations />} />
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
          <Route path="performance" element={<PerformanceHistory />} />
          <Route path="profil" element={<ChauffeurProfil />} />
        </Route>

        {/* --- ESPACE 5 : CLIENT --- */}
        <Route path="/client" element={<ProtectedRoute allowedRoles={['CLIENT', 'USER']}><ClientLayout /></ProtectedRoute>}>
          <Route index element={<HomeClient />} />
          <Route path="tickets" element={<MesTickets />} />
          <Route path="historique" element={<History />} />
          <Route path="reservation/:id" element={<ReservationPage />} />
          <Route path="finaliser-reservation/:id" element={<CheckoutPage />} />
          <Route path="profil" element={<Profil />} />
          <Route path="evaluer/:id" element={<FormulaireEvaluation />} />
        </Route>

        {/* --- ROUTE FALLBACK (404) --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
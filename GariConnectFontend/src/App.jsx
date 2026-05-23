import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ==========================================
// 1. CONTEXTE ET SÉCURITÉ
// ==========================================
import ProtectedRoute from './component/ProtectedRoute'; 
import { useAuth } from './context/AuthContext';

// ==========================================
// 2. LAYOUTS (Mises en page)
// ==========================================
import AdminLayout from './layouts/AdminLayout';
import AgenceLayout from './layouts/AgenceLayout';
import ClientLayout from './layouts/ClientLayout'; 
import ChauffeurLayout from './layouts/ChauffeurLayout';

// ==========================================
// 3. PAGES
// ==========================================
// --- Authentification ---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// --- Admin ---
import DashboardAdmin from './pages/admin/DashboardAdmin';
import GestionUtilisateurs from './pages/admin/GestionUtilisateurs';
import GestionCommissions from './pages/admin/GestionCommissions';
import DashboardFinancierAdmin from './pages/admin/DashboardFinancierAdmin';

// --- Agence ---
import DashboardAgence from './pages/agence/DashboardAgence';
import GestionFlotte from './pages/agence/GestionFlotte';
import Trajets from './pages/agence/Trajets';
import GestionReservations from './pages/agence/GestionReservations';
import GestionPaiements from './pages/agence/GestionPaiements';
import GestionChauffeurs from './pages/agence/GestionChauffeurs';
import CourriersPage from './pages/agence/CourriersPage';
import GestionFinance from './pages/agence/GestionFinance';
import DashboardPerformance from './pages/agence/DashboardPerformance';

// --- Chauffeur ---
import ChauffeurDashboard from './pages/chauffeur/ChauffeurDashboard'; 
import HistoriqueCourses from './pages/chauffeur/HistoriqueCourses'; 
import PerformanceHistory from './pages/chauffeur/PerformanceHistory'; 
import ChauffeurProfil from './pages/chauffeur/ChauffeurProfil'; 
//import ScannerTicket from './pages/chauffeur/ScannerTicket';


// --- Client ---
import HomeClient from "./pages/client/Home";
import MesTickets from "./pages/client/MesTickets"; 
import History from "./pages/client/History";
import ReservationPage from "./pages/client/ReservationPage";
import Profil from "./pages/client/Profil"; 
import CheckoutPage from "./pages/client/CheckoutPage"; 
import FormulaireEvaluation from "./pages/client/FormulaireEvaluation";

// ==========================================
// 4. COMPOSANTS UTILITAIRES
// ==========================================
// Note : Toujours déclarer ce composant AVANT de l'utiliser dans App()
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen bg-[#0F172A] text-white flex items-center justify-center">
        Chargement...
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  const routes = { 
    ADMIN: '/admin', 
    AGENCE: '/agence', 
    CHAUFFEUR: '/chauffeur', 
    CLIENT: '/client/dashboard', 
    USER: '/client/dashboard' 
  };
  
  return <Navigate to={routes[user.role] || '/login'} replace />;
};


// ==========================================
// 5. APPLICATION PRINCIPALE ET ROUTES
// ==========================================
function App() {
  return (
    <Router>
      <Routes>
        {/* --- ROUTES PUBLIQUES --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Route par défaut (Redirige selon le rôle) */}
        <Route path="/" element={<HomeRedirect />} />

        {/* --- ESPACE ADMIN --- */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<DashboardAdmin />} />
          <Route path="dashboard" element={<DashboardAdmin />} />
          <Route path="utilisateurs" element={<GestionUtilisateurs />} />
          <Route path="commissions" element={<GestionCommissions />} />
          <Route path="finances" element={<DashboardFinancierAdmin />} />
        </Route>

        {/* --- ESPACE AGENCE --- */}
        <Route path="/agence" element={<ProtectedRoute allowedRoles={['AGENCE']}><AgenceLayout /></ProtectedRoute>}>
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

        {/* --- ESPACE CHAUFFEUR --- */}
        <Route path="/chauffeur" element={<ProtectedRoute allowedRoles={['CHAUFFEUR']}><ChauffeurLayout /></ProtectedRoute>}>
          <Route index element={<ChauffeurDashboard />} />
          <Route path="historique" element={<HistoriqueCourses />} />
          <Route path="performance" element={<PerformanceHistory />} />
          <Route path="profil" element={<ChauffeurProfil />} />
        </Route>

        {/* --- ESPACE CLIENT --- */}
        <Route path="/client" element={<ProtectedRoute allowedRoles={['CLIENT', 'USER']}><ClientLayout /></ProtectedRoute>}>
          <Route index element={<HomeClient />} />
          <Route path="dashboard" element={<HomeClient />} />
          <Route path="tickets" element={<MesTickets />} />
          <Route path="colis" element={<History />} /> 
          <Route path="historique" element={<History />} />
          <Route path="reservation/:id" element={<ReservationPage />} />
          <Route path="finaliser-reservation/:id" element={<CheckoutPage />} />
          <Route path="profil" element={<Profil />} />
          <Route path="evaluer/:id" element={<FormulaireEvaluation />} />
        </Route>

        {/* --- SÉCURITÉ --- */}
        {/* Si l'utilisateur tape une URL qui n'existe pas, il est renvoyé à la racine */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
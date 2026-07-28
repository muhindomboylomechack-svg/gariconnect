import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FaBan, FaWhatsapp, FaEnvelope, FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';

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
import SystemSettings from './pages/superadmin/SystemSettings';

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

import ClientCourrierHub from "./pages/client/ClientCourrierHub"; 

// ==========================================
// 7. COMPOSANTS DE BLOCAGE DE SÉCURITÉ
// ==========================================
const EcranBloque = ({ user: propUser }) => {
  const { user: authUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Priorité aux données passées par la page Login via location.state
  const user = location.state?.user || propUser || authUser;

  console.log("Utilisateur connecté dans EcranBloque :", user);

  // --- CONFIGURATION PAR DÉFAUT (SUPER ADMIN) ---
  const defaultPhone = "243993726409";
  const defaultEmail = "support@gariconnect.com";

  // Normalisation du rôle
  const role = user?.role?.replace('ROLE_', '');
  const isAgencyStaff = role === 'CHAUFFEUR' || role === 'AGENCY_MANAGER' || role === 'AGENCY_ADMIN';

  // Extraction dynamique selon l'entité
  let rawPhone = defaultPhone;
  let targetEmail = defaultEmail;

  if (isAgencyStaff) {
    rawPhone = user?.agenceTelephone 
            || user?.agenceEmployeur?.telephone 
            || user?.agence?.telephone 
            || defaultPhone;

    targetEmail = user?.agenceEmail 
               || user?.agenceEmployeur?.email 
               || user?.agence?.email 
               || defaultEmail;
  }

  const formattedPhone = String(rawPhone).replace(/[^0-9]/g, '');
  const adminTitle = isAgencyStaff ? "l'Administrateur de votre Agence" : "le Super Admin";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-4 text-red-500">
          <FaBan size={48} />
        </div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Compte Suspendu</h2>
        <p className="text-gray-600 mb-6">
          Votre compte est actuellement restreint. Veuillez contacter {adminTitle} pour régulariser votre situation.
        </p>

        <div className="space-y-4">
          {/* Bouton WhatsApp */}
          <a
            href={`https://wa.me/${formattedPhone}?text=Bonjour,%20mon%20compte%20${encodeURIComponent(user?.email || '')}%20est%20bloqué.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            <FaWhatsapp size={20} /> Contacter via WhatsApp ({rawPhone})
          </a>

          {/* Bouton Email */}
          <a
            href={`mailto:${targetEmail}?subject=Demande%20de%20déblocage%20de%20compte&body=Bonjour,%20mon%20compte%20(${user?.email})%20a%20été%20suspendu.`}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            <FaEnvelope size={18} /> Envoyer un Email ({targetEmail})
          </a>

          {/* Bouton Retour à la connexion */}
          <button
            onClick={() => {
              if (logout) logout();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-bold pt-2 transition cursor-pointer"
          >
            <FaArrowLeft size={14} /> Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};

// Guard qui vérifie le statut du compte sur toutes les routes protégées
const BlockGuard = ({ children }) => {
  const { user } = useAuth();

  if (user?.statut === 'INACTIF' || user?.statut === 'BLOQUE') {
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
          <Route path="/compte-bloque" element={<EcranBloque />} />

          {/* --- ESPACE 1 : SUPER ADMIN --- */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><BlockGuard><SuperAdminLayout /></BlockGuard></ProtectedRoute>}>
            <Route index element={<DashboardAdmin />} />
            <Route path="utilisateurs" element={<GestionUtilisateurs />} />
            <Route path="commissions" element={<GestionCommissions />} />
            <Route path="finances" element={<DashboardFinancierAdmin />} />
            <Route path="settings" element={<SystemSettings />} />
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
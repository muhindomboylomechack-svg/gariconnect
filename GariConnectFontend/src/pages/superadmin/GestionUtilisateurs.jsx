import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaTimes, FaUserAlt, FaSearch, FaTrash, FaSync, 
  FaCheckCircle, FaBuilding, FaChartLine, FaWallet, 
  FaUsers, FaTicketAlt, FaCreditCard, FaCheck, FaBan 
} from 'react-icons/fa';
import api from '../../services/api'; 

// Importation du hook de thème global
import { useTheme } from '../../App';

const GestionUtilisateurs = () => {
  // Récupération du thème actuel
  const { theme: currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';

  // Navigation par onglets
  const [activeTab, setActiveTab] = useState('dashboard'); 
  
  // États pour les données de l'API
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [financeStats, setFinanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("TOUS");
  
  // Accès générés et formulaires
  const [generatedCode, setGeneratedCode] = useState(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '', 
    role: 'CLIENT',
    typeOffre: 'COMMISSION_10'
  });

  // Chargement centralisé des données
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const financeRes = await api.get('/admin/finances/stats');
      setFinanceStats(financeRes.data);
      
      const usersRes = await api.get('/users');
      setUsers(usersRes.data || []);
      
      if (Array.isArray(usersRes.data)) {
        const listAgences = usersRes.data.filter(u => u.role === 'AGENCY_ADMIN');
        setAgencies(listAgences);
      }
    } catch (err) {
      console.error("Erreur lors de la synchronisation :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Soumission du formulaire de création d'agence / utilisateur
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/create', formData);
      if (res.data && res.data.codeAcces) {
        setGeneratedCode(res.data.codeAcces);
      }
      fetchAllData();
    } catch (err) {
      console.error("Erreur de création :", err);
    }
  };

  // ACTION CORRIGÉE : Valider un utilisateur ou un chauffeur
  const handleValidateUser = async (userId) => {
    try {
      // Correspond à @PutMapping("/valider-chauffeur/{id}") du backend
      await api.put(`/users/valider-chauffeur/${userId}`);
      fetchAllData(); 
    } catch (err) {
      console.error("Erreur lors de la validation :", err);
    }
  };

  // ACTION CORRIGÉE : Basculer entre Bloquer (INACTIF) et Débloquer (ACTIF)
  const handleToggleBlockUser = async (user) => {
    try {
      if (user.statut === 'ACTIF') {
        // Correspond à @PutMapping("/{id}/bloquer") du backend
        await api.put(`/users/${user.id}/bloquer`);
      } else {
        // Si l'utilisateur est INACTIF, on le réactive via valider-chauffeur
        await api.put(`/users/valider-chauffeur/${user.id}`);
      }
      fetchAllData(); 
    } catch (err) {
      System.err.println("Erreur lors du changement de statut :" + err);
    }
  };

  // Suppression définitive d'un compte
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      try {
        // Correspond à @DeleteMapping("/{id}") du backend
        await api.delete(`/users/${userId}`);
        fetchAllData();
      } catch (err) {
        console.error("Erreur lors de la suppression :", err);
      }
    }
  };

  // Thèmes dynamiques 
  const themeStyles = {
    bg: isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800',
    card: isDarkMode ? 'bg-slate-800/50 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm',
    cardHeader: isDarkMode ? 'bg-slate-800/10 border-slate-800' : 'bg-slate-100/50 border-slate-200',
    input: isDarkMode ? 'bg-slate-800/50 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900',
    navBar: isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-200/60 border-slate-300',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    title: isDarkMode ? 'text-white' : 'text-slate-900',
    trHover: isDarkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-100',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    tableHeader: isDarkMode ? 'bg-slate-800/10 text-slate-400' : 'bg-slate-100 text-slate-500'
  };

  return (
    <div className={`min-h-screen p-6 font-sans transition-colors duration-300 ${themeStyles.bg}`}>
      
      {/* HEADER DE LA PAGE */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-wider uppercase ${themeStyles.title}`}>
            GariConnect <span className="text-blue-500">Super Admin Portal</span>
          </h1>
          <p className={`${themeStyles.textMuted} text-xs font-medium`}>
            Supervision globale, contrôle des flux financiers et gestion multi-tenant en temps réel.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button 
            onClick={() => { setGeneratedCode(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[1.2rem] font-black text-xs uppercase tracking-wider transition-all shadow-lg"
          >
            <FaPlus size={12} /> Ajouter une Agence / Admin
          </button>
        </div>
      </div>

      {/* BARRE DE NAVIGATION PAR ONGLETS */}
      <div className={`flex flex-wrap gap-2 mb-8 p-1.5 rounded-[1.4rem] border max-w-3xl ${themeStyles.navBar}`}>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[1.1rem] font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : `${themeStyles.textMuted} hover:text-blue-500`}`}
        >
          <FaChartLine size={12} /> Finances & KPIs
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[1.1rem] font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : `${themeStyles.textMuted} hover:text-blue-500`}`}
        >
          <FaUsers size={12} /> Utilisateurs
        </button>
        <button 
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[1.1rem] font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'tenants' ? 'bg-blue-600 text-white shadow-md' : `${themeStyles.textMuted} hover:text-blue-500`}`}
        >
          <FaBuilding size={12} /> Agences Partenaires
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FaSync className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <>
          {/* 1. ONGLET : DASHBOARD & FINANCES */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. VOLUME D'AFFAIRES EN CDF */}
                <div className={`border p-5 rounded-[1.5rem] relative overflow-hidden ${themeStyles.card}`}>
                  <div className="absolute right-4 top-4 p-3 bg-blue-500/10 text-blue-500 rounded-xl"><FaWallet size={18} /></div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${themeStyles.textMuted}`}>Volume d'Affaires</p>
                  <h3 className={`text-2xl font-black ${themeStyles.title}`}>
                    {financeStats?.volumeAffairesTotal ? Number(financeStats.volumeAffairesTotal).toLocaleString('fr-FR') : '0'} CDF
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-bold mt-2">Flux total transité</p>
                </div>

                {/* 2. REVENUS NET EN CDF */}
                <div className={`border p-5 rounded-[1.5rem] relative overflow-hidden ${themeStyles.card}`}>
                  <div className="absolute right-4 top-4 p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><FaChartLine size={18} /></div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${themeStyles.textMuted}`}>Revenus Net</p>
                  <h3 className="text-2xl font-black text-emerald-500">
                    {financeStats?.revenusGariConnectNet ? Number(financeStats.revenusGariConnectNet).toLocaleString('fr-FR') : '0'} CDF
                  </h3>
                  <p className={`${themeStyles.textMuted} text-[10px] font-bold mt-2`}>Commissions perçues</p>
                </div>

                {/* 3. COMPTES UTILISATEURS */}
                <div className={`border p-5 rounded-[1.5rem] relative overflow-hidden ${themeStyles.card}`}>
                  <div className="absolute right-4 top-4 p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><FaUsers size={18} /></div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${themeStyles.textMuted}`}>Comptes Utilisateurs</p>
                  <h3 className={`text-2xl font-black ${themeStyles.title}`}>{financeStats?.totalUsers || 0}</h3>
                  <p className={`${themeStyles.textMuted} text-[10px] font-bold mt-2`}>Inscriptions globales</p>
                </div>

                {/* 4. BILLETS CONFIRMÉS EN DIRECT DES VRAIES DONNÉES */}
                <div className={`border p-5 rounded-[1.5rem] relative overflow-hidden ${themeStyles.card}`}>
                  <div className="absolute right-4 top-4 p-3 bg-amber-500/10 text-amber-500 rounded-xl"><FaTicketAlt size={18} /></div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${themeStyles.textMuted}`}>Billets Confirmés</p>
                  <h3 className={`text-2xl font-black ${themeStyles.title}`}>
                    {financeStats?.billetsConfirmes !== undefined ? Number(financeStats.billetsConfirmes).toLocaleString('fr-FR') : '0'}
                  </h3>
                  <p className={`${themeStyles.textMuted} text-[10px] font-bold mt-2`}>Réservations payées</p>
                </div>

              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`border p-6 rounded-[1.8rem] ${themeStyles.card}`}>
                  <h4 className={`text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2 ${themeStyles.title}`}>
                    <FaChartLine className="text-blue-500" /> Évolution des Commissions
                  </h4>
                  <div className="space-y-3 h-52 overflow-y-auto pr-2">
                    {financeStats?.chartData?.map((item, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-xl border ${themeStyles.card}`}>
                        <span className="text-xs font-medium">{item.date}</span>
                        <span className="text-xs font-black text-emerald-500">+{item.revenus ? Number(item.revenus).toLocaleString('fr-FR') : '0'} CDF</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`border p-6 rounded-[1.8rem] ${themeStyles.card}`}>
                  <h4 className={`text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2 ${themeStyles.title}`}>
                    <FaCreditCard className="text-purple-500" /> Canaux de Paiement
                  </h4>
                  <div className="space-y-4">
                    {financeStats?.paymentMethodsData?.map((method, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>{method.name}</span>
                          <span className="text-blue-500">{method.value} tx</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full" style={{ width: `${Math.min(method.value * 5, 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ONGLET : GESTION DES UTILISATEURS */}
          {activeTab === 'users' && (
            <div className={`border rounded-[1.8rem] overflow-hidden ${themeStyles.card}`}>
              <div className={`p-5 border-b flex flex-col sm:flex-row gap-4 items-center justify-between ${themeStyles.cardHeader}`}>
                <div className="relative w-full sm:w-72">
                  <FaSearch className="absolute left-3 top-3.5 text-slate-400" size={12} />
                  <input 
                    type="text" 
                    placeholder="Rechercher un utilisateur..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 font-medium ${themeStyles.input}`}
                  />
                </div>
                <div>
                  <select 
                    value={filterRole} 
                    onChange={e => setFilterRole(e.target.value)}
                    className={`p-2.5 rounded-xl text-xs font-bold outline-none border ${themeStyles.input}`}
                  >
                    <option value="TOUS">Tous les rôles</option>
                    <option value="SUPER_ADMIN">Super Admins</option>
                    <option value="AGENCY_ADMIN">Admins Agences</option>
                    <option value="CLIENT">Clients</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b text-[10px] font-black uppercase ${themeStyles.tableHeader}`}>
                      <th className="p-4">Identité</th>
                      <th className="p-4">Email / Contacts</th>
                      <th className="p-4">Rôle</th>
                      <th className="p-4">Statut Compte</th>
                      <th className="p-4 text-center">Actions Système</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-200 dark:divide-slate-800/40">
                    {users
                      .filter(u => filterRole === "TOUS" || u.role === filterRole)
                      .filter(u => u.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((u) => (
                        <tr key={u.id} className={`transition-all ${themeStyles.trHover}`}>
                          <td className="p-4 font-bold">{u.nom} {u.prenom}</td>
                          <td className="p-4">
                            <span className="block font-medium">{u.email}</span>
                            <span className={`text-[10px] ${themeStyles.textMuted}`}>{u.telephone || 'Aucun numéro'}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wider ${u.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-500' : u.role === 'AGENCY_ADMIN' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase ${u.statut === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-500' : (u.statut === 'INACTIF' || u.statut === 'BLOQUE') ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {u.statut === 'INACTIF' ? 'BLOQUÉ' : (u.statut || (u.valide ? 'ACTIF' : 'EN_ATTENTE'))}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              
                              {/* 1. BOUTON VALIDER */}
                              {u.statut !== 'ACTIF' && (
                                <button 
                                  onClick={() => handleValidateUser(u.id)}
                                  title="Valider et activer le compte"
                                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 rounded-lg transition-all"
                                >
                                  <FaCheck size={11} />
                                </button>
                              )}

                              {/* 2. BOUTON BLOQUER / DÉBLOQUER */}
                              <button 
                                onClick={() => handleToggleBlockUser(u)}
                                title={u.statut === 'INACTIF' ? "Débloquer l'accès" : "Bloquer l'accès temporairement"}
                                className={`p-2 rounded-lg transition-all ${u.statut === 'INACTIF' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                              >
                                <FaBan size={11} />
                              </button>

                              {/* 3. BOUTON SUPPRIMER */}
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                title="Supprimer définitivement"
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              >
                                <FaTrash size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. ONGLET : AGENCES PARTENAIRES */}
          {activeTab === 'tenants' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agencies.map((agency) => (
                <div key={agency.id} className={`border p-5 rounded-[1.5rem] space-y-4 ${themeStyles.card}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl"><FaBuilding size={16} /></div>
                      <div>
                        <h4 className="text-sm font-black">{agency.nom || "Agence sans nom"}</h4>
                        <span className={`text-[10px] font-mono ${themeStyles.textMuted}`}>{agency.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL GLOBAL : AJOUT NOUVEL UTILISATEUR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border w-full max-w-lg rounded-[2rem] shadow-2xl p-6 relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setIsModalOpen(false)} className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"><FaTimes size={14} /></button>
            <h3 className="text-md font-black uppercase tracking-wider mb-2">Créer un Compte</h3>
            
            {generatedCode ? (
              <div className="bg-blue-950/40 border border-blue-900/50 p-6 rounded-2xl text-center space-y-4">
                <FaCheckCircle className="text-emerald-500 mx-auto" size={42} />
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xl text-blue-400 font-black tracking-widest">{generatedCode}</div>
                <button onClick={() => setIsModalOpen(false)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase">Fermer</button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider">Raison Sociale ou Nom</label>
                  <input type="text" required className={`w-full px-4 py-3 rounded-xl text-xs outline-none border ${themeStyles.input}`} placeholder="Nom de l'utilisateur ou entreprise" onChange={e => setFormData({...formData, nom: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider">Adresse Électronique</label>
                  <input type="email" required className={`w-full px-4 py-3 rounded-xl text-xs outline-none border ${themeStyles.input}`} placeholder="exemple@domaine.com" onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg mt-4">
                  Valider et Enregistrer sur Supabase
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUtilisateurs;
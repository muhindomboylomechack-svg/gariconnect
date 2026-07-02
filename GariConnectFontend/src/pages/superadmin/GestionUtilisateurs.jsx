import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaTimes, FaUserAlt, FaEnvelope, 
  FaSearch, FaTrash, FaSync, FaCheckCircle, FaBuilding, FaPhoneAlt, FaFilter,
  FaLock, FaLockOpen
} from 'react-icons/fa';
import api from '../../services/api'; 

const GestionUtilisateurs = () => {
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("TOUS");
  
  // Nouveaux états pour gérer le code secret généré
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({ 
    nom: '', 
    email: '', 
    telephone: '', 
    role: 'AGENCY_ADMIN', // 🔒 Rôle verrouillé pour le Super Admin
    statut: 'ACTIF' 
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await api.get('/users/agencies'); 
      setAgencies(response.data);
    } catch (error) {
      console.error("Erreur chargement agences:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAgencies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Le Super Admin ne crée que des AGENCY_ADMIN (Agences)
      const response = await api.post('/admin/users/create', formData);
      
      // Si le backend renvoie le code d'accès généré
      if (response.data && response.data.codeAcces) {
          setGeneratedCode(response.data.codeAcces);
      } else {
          setIsModalOpen(false);
      }
      
      setFormData({ nom: '', email: '', telephone: '', role: 'AGENCY_ADMIN', statut: 'ACTIF' });
      fetchUsers();
      fetchAgencies();
    } catch (error) {
      alert("Erreur : " + (error.response?.data?.message || "Données invalides"));
    }
  };

  const handleActivateUser = async (id) => {
    if (window.confirm("Valider l'inscription de cet utilisateur ?")) {
      try {
        await api.put(`/admin/users/${id}/valider`);
        fetchUsers();
      } catch (error) {
        console.error("Erreur activation:", error);
      }
    }
  };

  // 🟢 CORRIGÉ : Ajout de l'espace sur la variable const isActif
  const handleToggleBlockUser = async (user) => {
    const isActif = user.statut === 'ACTIF'; // <-- Espace corrigé ici
    const actionMessage = isActif 
      ? `Voulez-vous suspendre temporairement le compte de ${user.nom || user.email} ?`
      : `Voulez-vous réactiver le compte de ${user.nom || user.email} ?`;

    if (window.confirm(actionMessage)) {
      try {
        // Envoi du nouveau statut au backend (BLOQUE ou ACTIF)
        const nouveauStatut = isActif ? 'BLOQUE' : 'ACTIF';
        await api.put(`/admin/users/${user.id}/statut`, { statut: nouveauStatut });
        
        // Rafraîchir localement la liste
        setUsers(users.map(u => u.id === user.id ? { ...u, statut: nouveauStatut } : u));
      } catch (error) {
        alert("Erreur lors de la modification du statut : " + (error.response?.data?.message || "Impossible de modifier"));
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer définitivement ce compte ?")) {
      try {
        await api.delete(`/admin/users/${id}`);
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGeneratedCode(null);
    setCopied(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "TOUS" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER DE SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
            Membres <span className="text-blue-600">GariConnect</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">
            Contrôle centralisé des accès et privilèges (Super Admin)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUsers} 
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all active:rotate-180"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-600/20 transition-transform active:scale-95"
          >
            <FaPlus /> Créer une Agence
          </button>
        </div>
      </div>

      {/* FILTRES DYNAMIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="relative lg:col-span-3">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
          <input 
            type="text"
            placeholder="Rechercher un membre par nom ou email..."
            className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <FaFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" />
          <select 
            className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-black text-[11px] text-slate-500 uppercase tracking-widest outline-none appearance-none cursor-pointer"
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="TOUS">Tous les rôles</option>
            <option value="CLIENT">Clients</option>
            <option value="AGENCY_ADMIN">Entrepreneurs Agence</option>
            <option value="AGENCY_MANAGER">Managers Agence</option>
            <option value="CHAUFFEUR">Chauffeurs</option>
            <option value="SUPER_ADMIN">Super Admins</option>
          </select>
        </div>
      </div>

      {/* LISTE DES UTILISATEURS */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Profil</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">État du compte</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Contrôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredUsers.map(user => (
                <tr 
                  key={user.id} 
                  className={`hover:bg-slate-50/50 dark:hover:bg-blue-500/5 transition-colors group ${
                    user.statut === 'BLOQUE' ? 'opacity-60 bg-red-50/10' : ''
                  }`}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        {user.role === 'AGENCY_ADMIN' || user.role === 'AGENCY_MANAGER' ? <FaBuilding size={18} /> : <FaUserAlt size={16} />}
                      </div>
                      <div>
                        <p className={`font-black uppercase text-sm tracking-tight ${user.statut === 'BLOQUE' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{user.nom || 'Sans nom'}</p>
                        <p className="text-xs text-slate-400 font-bold lowercase tracking-normal">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                      user.role === 'SUPER_ADMIN' 
                      ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`inline-flex items-center gap-2 font-black text-[9px] px-4 py-1.5 rounded-full uppercase tracking-widest ${
                      user.statut === 'ACTIF' 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : user.statut === 'BLOQUE'
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.statut === 'ACTIF' ? 'bg-emerald-500 animate-pulse' : user.statut === 'BLOQUE' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}></span>
                      {user.statut ? user.statut.replace('_', ' ') : 'EN ATTENTE'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {user.statut === 'EN_ATTENTE' && (
                        <button 
                          onClick={() => handleActivateUser(user.id)}
                          className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                          <FaCheckCircle /> VALIDER
                        </button>
                      )}

                      {/* 🟢 Bouton Bloquer / Débloquer */}
                      {user.role !== 'SUPER_ADMIN' && (
                        <button 
                          onClick={() => handleToggleBlockUser(user)}
                          title={user.statut === 'BLOQUE' ? "Réactiver le membre" : "Suspendre temporairement"}
                          className={`p-3 rounded-xl transition-all ${
                            user.statut === 'BLOQUE' 
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' 
                              : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                          }`}
                        >
                          {user.statut === 'BLOQUE' ? <FaLockOpen size={14} /> : <FaLock size={14} />}
                        </button>
                      )}

                      <button 
                        onClick={() => handleDelete(user.id)} 
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE DE CRÉATION AGENCE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                    {generatedCode ? 'Succès' : 'Nouvelle '} <span className="text-blue-600">{generatedCode ? '!' : 'Agence'}</span>
                  </h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                    {generatedCode ? 'Compte administrateur créé' : 'Génération de compte partenaire'}
                  </p>
                </div>
                <button onClick={handleCloseModal} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                  <FaTimes size={18}/>
                </button>
              </div>

              {generatedCode ? (
                /* AFFICHAGE DU CODE SECRET APRÈS CRÉATION */
                <div className="p-2 text-center space-y-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-inner">
                    <FaCheckCircle size={28} />
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      L'agence a été créée. Transmettez ce code de sécurité au nouveau propriétaire :
                    </p>
                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-[0.2em] shadow-inner">
                      <span>{generatedCode}</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className={`text-xs px-4 py-2.5 rounded-xl font-sans font-black uppercase tracking-widest shadow-sm transition active:scale-95 ${
                          copied
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {copied ? "Copié" : "Copier"}
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-500 dark:text-amber-400 font-bold uppercase tracking-wider italic">
                      * Le propriétaire devra modifier ce code à la connexion.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full py-5 bg-slate-900 text-white dark:bg-blue-600 dark:hover:bg-blue-700 font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl transition-all active:scale-95 mt-4"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                /* FORMULAIRE DE CRÉATION */
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Nom de l'Agence</label>
                      <div className="relative">
                        <FaBuilding className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          required 
                          value={formData.nom}
                          className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all" 
                          onChange={e => setFormData({...formData, nom: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Contact Mobile</label>
                      <div className="relative">
                        <FaPhoneAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          value={formData.telephone}
                          className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all" 
                          placeholder="+243..."
                          onChange={e => setFormData({...formData, telephone: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Adresse Mail (Propriétaire)</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="email" required 
                        value={formData.email}
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all" 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Attribution du Rôle</label>
                      <div className="w-full px-6 py-5 bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 rounded-[1.5rem] font-black text-xs text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] text-center cursor-not-allowed">
                        🏢 Administrateur d'Agence
                      </div>
                  </div>

                  <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-blue-600/30 transition-all active:scale-95 mt-4">
                    Générer les accès de l'agence
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
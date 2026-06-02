import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaTimes, FaUserAlt, FaEnvelope, 
  FaSearch, FaTrash, FaSync, FaCheckCircle, FaBuilding, FaPhoneAlt, FaFilter
} from 'react-icons/fa';
import api from '../../services/api'; 

const GestionUtilisateurs = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("TOUS");
  const [formData, setFormData] = useState({ 
    nom: '', 
    email: '', 
    telephone: '', 
    role: 'CLIENT',
    statut: 'ACTIF' 
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users/create', formData);
      setIsModalOpen(false);
      setFormData({ nom: '', email: '', telephone: '', role: 'CLIENT', statut: 'ACTIF' });
      fetchUsers();
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
            Contrôle centralisé des accès et privilèges
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
            <FaPlus /> Créer un accès
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
            className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
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
            <option value="AGENCE">Agences</option>
            <option value="CHAUFFEUR">Chauffeurs</option>
            <option value="ADMIN">Admins</option>
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
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-blue-500/5 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        {user.role === 'AGENCE' ? <FaBuilding size={18} /> : <FaUserAlt size={16} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-slate-200 uppercase text-sm tracking-tight">{user.nom || 'Sans nom'}</p>
                        <p className="text-xs text-slate-400 font-bold lowercase tracking-normal">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                      user.role === 'ADMIN' 
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
                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.statut === 'ACTIF' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {user.statut ? user.statut.replace('_', ' ') : 'EN ATTENTE'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {user.statut === 'EN_ATTENTE' && (
                        <button 
                          onClick={() => handleActivateUser(user.id)}
                          className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                          <FaCheckCircle /> VALIDER
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

      {/* MODALE DE CRÉATION PROFESSIONNELLE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-center items-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-10">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Nouvel <span className="text-blue-600">Accès</span></h3>
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Génération de compte administrateur/partenaire</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                 <FaTimes size={18}/>
               </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Identité / Agence</label>
                   <div className="relative">
                     <FaUserAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
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
                        placeholder="06..."
                        onChange={e => setFormData({...formData, telephone: e.target.value})} 
                     />
                   </div>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Adresse Mail Professionnelle</label>
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
                   <select 
                     className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] font-black text-xs text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] outline-none appearance-none cursor-pointer"
                     value={formData.role}
                     onChange={e => setFormData({...formData, role: e.target.value})}>
                       <option value="CLIENT">👤 Utilisateur Standard</option>
                       <option value="AGENCE">🏢 Partenaire Agence</option>
                       <option value="CHAUFFEUR">🚖 Chauffeur</option>
                       <option value="ADMIN">🛡️ Administrateur</option>
                   </select>
               </div>

               <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-blue-600/30 transition-all active:scale-95 mt-4">
                 Activer le compte instantanément
               </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default GestionUtilisateurs;
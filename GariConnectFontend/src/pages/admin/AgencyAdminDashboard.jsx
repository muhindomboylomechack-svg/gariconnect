import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService'; 

export default function AgencyAdminDashboard() {
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('TOUS');
    const [notification, setNotification] = useState({ text: '', type: '' });
    const [showModal, setShowModal] = useState(false);
    
    // Nouvel état pour gérer l'affichage du code d'accès généré par le backend
    const [generatedCode, setGeneratedCode] = useState(null);
    const [copied, setCopied] = useState(false);
    
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: 'CHAUFFEUR'
    });

    // 1. CHARGEMENT SÉCURISÉ DES MEMBRES DE L'AGENCE
    const loadAgencyData = async () => {
        setLoading(true);
        try {
            const response = await adminService.getAgencyUsers();
            let rawData = response?.data !== undefined ? response.data : response;

            if (rawData && !Array.isArray(rawData) && typeof rawData === 'object') {
                rawData = rawData.users || rawData.data || Object.values(rawData).find(Array.isArray) || [];
            }

            if (Array.isArray(rawData)) {
                // Filtrage et normalisation des rôles retournés par l'API
                const filteredPersonnel = rawData.filter(user => 
                    user.role === 'CHAUFFEUR' || user.role === 'AGENCY_MANAGER' || user.role === 'ROLE_CHAUFFEUR' || user.role === 'ROLE_AGENCY_MANAGER'
                );
                setCollaborators(filteredPersonnel);
            } else {
                console.error("Format JSON reçu non reconnu (pas un tableau) :", rawData);
                setCollaborators([]);
            }
        } catch (error) {
            console.error("Erreur lors du chargement de l'équipe :", error);
            triggerNotification("Impossible de charger les données réelles de l'agence.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAgencyData();
    }, []);

    const triggerNotification = (text, type) => {
        setNotification({ text, type });
        setTimeout(() => setNotification({ text: '', type: '' }), 4000);
    };

    // 2. CRÉATION D'UN COLLABORATEUR (Avec capture du code d'accès)
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await adminService.createUser(formData);
            const data = response?.data !== undefined ? response.data : response;
            
            // Si le backend renvoie le codeAcces temporaire
            if (data?.codeAcces) {
                setGeneratedCode(data.codeAcces);
                triggerNotification("Compte créé ! Veuillez copier le code d'accès.", "success");
            } else {
                triggerNotification(data?.message || "Collaborateur ajouté avec succès !", "success");
                setShowModal(false);
            }
            
            // Réinitialisation du formulaire et rechargement de la liste
            setFormData({ nom: '', prenom: '', email: '', telephone: '', role: 'CHAUFFEUR' });
            loadAgencyData(); 
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Erreur lors de la création du compte.";
            triggerNotification(errorMsg, "error");
        }
    };

    // Fonction pratique pour copier le code d'accès dans le presse-papier
    const handleCopyCode = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Fermeture propre de la modale de création
    const handleCloseModal = () => {
        setShowModal(false);
        setGeneratedCode(null);
        setCopied(false);
    };

    // 3. ACTION : BLOQUER UN UTILISATEUR (Désactivation logique -> statut = INACTIF)
    const handleBlock = async (id, nomComplet) => {
        if (window.confirm(`Êtes-vous sûr de vouloir bloquer ${nomComplet} ? Il ne pourra plus se connecter au système.`)) {
            try {
                const response = await adminService.blockUser(id); 
                const data = response?.data !== undefined ? response.data : response;
                triggerNotification(data?.message || "L'utilisateur a été bloqué avec succès.", "success");
                loadAgencyData();
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Erreur lors du blocage de l'utilisateur.";
                triggerNotification(errorMsg, "error");
            }
        }
    };

    // 4. SUPPRESSION DÉFINITIVE D'UN UTILISATEUR (Retrait de la BDD)
    const handleDelete = async (id, nomComplet) => {
        if (window.confirm(`⚠️ ATTENTION : Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT ${nomComplet} de la base de données ? Cette action est irréversible.`)) {
            try {
                const response = await adminService.deleteUser(id);
                const data = response?.data !== undefined ? response.data : response;
                triggerNotification(data?.message || "Utilisateur supprimé définitivement.", "success");
                loadAgencyData();
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Erreur lors de la suppression définitive.";
                triggerNotification(errorMsg, "error");
            }
        }
    };

    // 5. ACTIVATION / VALIDATION D'UN CHAUFFEUR (Statut -> ACTIF)
    const handleValidate = async (id, nomComplet) => {
        if (window.confirm(`Voulez-vous réactiver ou autoriser le compte de ${nomComplet} ?`)) {
            try {
                const response = await adminService.validateUser(id);
                const data = response?.data !== undefined ? response.data : response;
                triggerNotification(data?.message || "Compte activé avec succès.", "success");
                loadAgencyData();
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Impossible de valider cet utilisateur.";
                triggerNotification(errorMsg, "error");
            }
        }
    };

    // 6. LOGIQUE DE RECHERCHE ET FILTRES FRONTEND
    const filteredCollaborators = collaborators.filter(user => {
        const nomComplet = `${user.nom || ''} ${user.prenom || ''}`.toLowerCase();
        const matchesSearch = 
            nomComplet.includes(searchTerm.toLowerCase()) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.telephone && user.telephone.includes(searchTerm));
            
        const userRoleNormalized = (user.role === 'ROLE_CHAUFFEUR' || user.role === 'CHAUFFEUR') ? 'CHAUFFEUR' : 'AGENCY_MANAGER';
        const matchesRole = roleFilter === 'TOUS' || userRoleNormalized === roleFilter;
        
        return matchesSearch && matchesRole;
    });

    const totalDrivers = collaborators.filter(u => u.role === 'CHAUFFEUR' || u.role === 'ROLE_CHAUFFEUR').length;
    const totalManagers = collaborators.filter(u => u.role === 'AGENCY_MANAGER' || u.role === 'ROLE_AGENCY_MANAGER').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            
            {/* NOTIFICATION */}
            {notification.text && (
                <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 ${
                    notification.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' 
                        : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                }`}>
                    {notification.text}
                </div>
            )}

            {/* EN-TÊTE */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Gestion de l'Équipe</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pilotez vos chauffeurs et vos managers de guichet.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
                    </svg>
                    Nouveau Collaborateur
                </button>
            </div>

            {/* CARTES STATISTIQUES */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Effectif Global</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{collaborators.length}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chauffeurs Agence</p>
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalDrivers}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m9-1h1m-1 0v-5h3a2 2 0 012 2v3h-2M13 16h-1m-4 0h3"/></svg>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Managers / Guichet</p>
                        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalManagers}</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    </div>
                </div>
            </div>

            {/* BARRE DE RECHERCHE ET FILTRES */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email, tél..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Filtrer par rôle :</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                        <option value="TOUS">Tous les rôles</option>
                        <option value="CHAUFFEUR">Chauffeurs</option>
                        <option value="AGENCY_MANAGER">Managers de Guichet</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU DES COLLABORATEURS */}
            {loading ? (
                <div className="flex flex-col justify-center items-center h-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">Récupération des données en temps réel...</p>
                </div>
            ) : (
                <div className="overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/70 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Collaborateur</th>
                                    <th className="px-6 py-4">Numéro Téléphone</th>
                                    <th className="px-6 py-4">Fonction</th>
                                    <th className="px-6 py-4">Statut d'Accès</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-300">
                                {filteredCollaborators.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                                            Aucun collaborateur trouvé pour votre agence.
                                        </td>
                                    </tr>
                                ) : filteredCollaborators.map((user) => (
                                    <tr key={user.id || user.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition duration-150">
                                        
                                        {/* NOM & EMAIL */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-900 dark:text-white">{user.nom || 'Sans nom'} {user.prenom || ''}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{user.email}</div>
                                        </td>
                                        
                                        {/* TÉLÉPHONE */}
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">
                                            {user.telephone || <span className="text-slate-300 dark:text-slate-600 italic">Non renseigné</span>}
                                        </td>
                                        
                                        {/* RÔLE */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                user.role === 'CHAUFFEUR' || user.role === 'ROLE_CHAUFFEUR'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50' 
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
                                            }`}>
                                                {user.role === 'CHAUFFEUR' || user.role === 'ROLE_CHAUFFEFFUR' ? 'Conducteur' : 'Guichetier / Manager'}
                                            </span>
                                        </td>
                                        
                                        {/* STATUT */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.statut === 'ACTIF' || user.statut === 'VALIDE' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5"></span>
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5"></span>
                                                    Bloqué / Inactif
                                                </span>
                                            )}
                                        </td>
                                        
                                        {/* ACTIONS */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium space-x-2">
                                            {user.statut !== 'VALIDE' && user.statut !== 'ACTIF' ? (
                                                <button
                                                    onClick={() => handleValidate(user.id, `${user.prenom || ''} ${user.nom || ''}`)}
                                                    className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-xl transition text-xs font-semibold"
                                                >
                                                    Réactiver
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBlock(user.id, `${user.prenom || ''} ${user.nom || ''}`)}
                                                    className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 px-3 py-1.5 rounded-xl transition text-xs font-semibold"
                                                >
                                                    Bloquer
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => handleDelete(user.id, `${user.prenom || ''} ${user.nom || ''}`)}
                                                className="text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 px-3 py-1.5 rounded-xl transition text-xs font-semibold"
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODALE D'AJOUT & AFFICHAGE DU CODE D'ACCÈS */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
                        
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {generatedCode ? "Compte créé avec succès" : "Ajouter à l'équipe"}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        {/* Condition : Si le compte a été créé, affichage moderne du code d'accès */}
                        {generatedCode ? (
                            <div className="p-6 text-center space-y-5">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-inner">
                                    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 px-2">
                                        Le collaborateur a été enregistré. Transmettez-lui impérativement ce code de sécurité unique pour sa première connexion :
                                    </p>
                                    
                                    {/* Encadré du code d'accès optimisé pour les deux modes */}
                                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-mono text-xl font-bold text-slate-800 dark:text-indigo-400 tracking-wider shadow-inner">
                                        <span>{generatedCode}</span>
                                        <button 
                                            type="button" 
                                            onClick={handleCopyCode}
                                            className={`text-xs px-3 py-2 rounded-lg font-sans font-semibold shadow-sm transition active:scale-95 ${
                                                copied 
                                                    ? 'bg-emerald-600 text-white dark:bg-emerald-600' 
                                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900/60 dark:border dark:border-indigo-800/40'
                                            }`}
                                        >
                                            {copied ? "Copié !" : "Copier"}
                                        </button>
                                    </div>
                                    <p className="text-xs text-rose-500 dark:text-rose-400 font-medium italic">
                                        * L'utilisateur devra obligatoirement modifier ce code lors de sa première authentification.
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <button 
                                        type="button" 
                                        onClick={handleCloseModal}
                                        className="w-full py-2.5 bg-slate-950 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 text-sm font-semibold rounded-xl shadow-md hover:bg-slate-800 transition focus:outline-none"
                                    >
                                        Terminer et fermer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Formulaire standard d'ajout */
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Nom</label>
                                        <input type="text" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Prénom</label>
                                        <input type="text" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Email</label>
                                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Téléphone</label>
                                    <input type="text" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition" placeholder="+243..."/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Fonction</label>
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition cursor-pointer">
                                        <option value="CHAUFFEUR">Chauffeur (Conducteur)</option>
                                        <option value="AGENCY_MANAGER">Manager / Agent de guichet</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition">Annuler</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition">Enregistrer</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
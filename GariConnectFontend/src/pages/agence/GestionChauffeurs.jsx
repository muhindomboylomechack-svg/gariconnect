import React, { useState, useEffect } from 'react';
import { 
    FaUserPlus, FaSearch, FaPhone, FaEdit, 
    FaTrash, FaTimes, FaSave, FaKey,
    FaUserTie, FaCheckCircle, FaEnvelope, FaClock, FaUserSlash
} from 'react-icons/fa';
import api from '../../services/api';

const GestionChauffeurs = () => {
    const [chauffeurs, setChauffeurs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // 🔐 GESTION DES DROITS
    const userRole = localStorage.getItem("role") || "ROLE_AGENT";
    const canEdit = userRole === "ROLE_AGENCY_ADMIN" || userRole === "ROLE_AGENCY_MANAGER" || userRole === "ROLE_SUPER_ADMIN";

    const [activeTab, setActiveTab] = useState("ACTIF"); 
    
    const [countryCode, setCountryCode] = useState("243"); 
    const [phoneMain, setPhoneMain] = useState("");
    const [currentChauffeur, setCurrentChauffeur] = useState({ 
        nom: '', email: '', telephone: '', statut: 'EN_ATTENTE' 
    });

    const [tempCode, setTempCode] = useState(null);

    const countries = [
        { code: "243", name: "RDC (CD)", flag: "🇨🇩" },
        { code: "242", name: "Congo (CG)", flag: "🇨🇬" },
        { code: "250", name: "Rwanda (RW)", flag: "🇷🇼" },
        { code: "225", name: "Côte d'Ivoire (CI)", flag: "🇨🇮" },
    ];

    useEffect(() => {
        fetchChauffeurs();
    }, []);

    const fetchChauffeurs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/chauffeurs/mes-chauffeurs'); 
            setChauffeurs(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Erreur chargement chauffeurs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const fullPhone = `+${countryCode}${phoneMain.replace(/\s+/g, '')}`;
        
        const dataToSend = { 
            ...currentChauffeur, 
            telephone: fullPhone, 
            statut: isEditing ? currentChauffeur.statut : 'EN_ATTENTE' 
        };

        try {
            if (isEditing) {
                await api.put(`/chauffeurs/${currentChauffeur.id}`, dataToSend);
                setShowModal(false);
                alert("✅ Profil du chauffeur mis à jour avec succès !");
            } else {
                const response = await api.post('/agences/recruter-chauffeur', dataToSend);
                setTempCode(response.data.code); 
            }
            fetchChauffeurs();
        } catch (error) {
            alert("⚠️ " + (error.response?.data?.message || "Erreur lors de l'enregistrement"));
        }
    };

    const handleBloquer = async (id) => {
        if (window.confirm("Voulez-vous suspendre ce chauffeur ? Il ne pourra plus effectuer de trajets jusqu'à sa réactivation.")) {
            try {
                await api.put(`/users/${id}/bloquer`);
                alert("🛑 Chauffeur suspendu avec succès.");
                fetchChauffeurs();
            } catch (error) {
                alert("❌ Erreur lors de la suspension : " + (error.response?.data?.message || "Action impossible"));
            }
        }
    };

    // 🟢 NOUVELLE LOGIQUE : Fonction centralisée pour déterminer si un chauffeur est opérationnel
    const isOperationnel = (statut) => {
        const s = statut ? statut.toUpperCase() : "EN_ATTENTE";
        // Ajout des statuts "DISPONIBLE" et "ALIGNE A UN TRAJET" générés par le Backend
        return ["ACTIF", "VALIDE", "DISPONIBLE", "ALIGNE A UN TRAJET", "ALIGNÉ A UN TRAJET"].includes(s);
    };

    // Filtrage sur mesure selon la recherche et l'onglet d'état
    const filtrés = chauffeurs.filter(c => {
        const statutC = c.statut ? c.statut.toUpperCase() : "EN_ATTENTE";
        const matchesSearch = (c.nom?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
                              (c.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                              (c.telephone || "").includes(searchTerm);
        
        let matchesTab = false;
        if (activeTab === "ACTIF") {
            matchesTab = isOperationnel(statutC); // Utilisation de la nouvelle condition
        } else if (activeTab === "EN_ATTENTE") {
            matchesTab = statutC === "EN_ATTENTE";
        } else if (activeTab === "INACTIF") {
            matchesTab = statutC === "INACTIF";
        }

        return matchesSearch && matchesTab;
    });

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            
            {/* EN-TÊTE RESPONSIVE */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                        <div className="p-3 md:p-4 bg-blue-600 rounded-2xl md:rounded-3xl shadow-xl shadow-blue-500/20">
                            <FaUserTie className="text-white text-xl md:text-2xl" />
                        </div>
                        Gestion de la Flotte Humaine
                    </h1>
                    <p className="text-slate-400 font-bold text-xs md:text-sm mt-2 ml-1">
                        {canEdit 
                            ? "Recrutez et suivez vos chauffeurs. Note : La validation finale est réservée à l'administrateur."
                            : "Consultez la liste des chauffeurs rattachés à votre agence."}
                    </p>
                </div>
                
                {/* 🔒 BOUTON MASQUÉ POUR L'AGENT */}
                {canEdit && (
                    <button 
                        onClick={() => { 
                            setIsEditing(false); 
                            setTempCode(null);
                            setPhoneMain(""); 
                            setCurrentChauffeur({ nom: '', email: '', telephone: '', statut: 'EN_ATTENTE' }); 
                            setShowModal(true); 
                        }} 
                        className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl md:rounded-[2rem] font-black shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <FaUserPlus /> Recruter un Chauffeur
                    </button>
                )}
            </div>

            {/* FILTRES ET RECHERCHE */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[2rem] w-full md:w-auto overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab("ACTIF")}
                        className={`flex-1 px-6 py-3 rounded-xl md:rounded-[1.8rem] font-black text-[10px] md:text-xs whitespace-nowrap transition-all ${activeTab === "ACTIF" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        {/* Application de la fonction pour le compteur dynamique */}
                        OPÉRATIONNELS ({chauffeurs.filter(c => isOperationnel(c.statut)).length})
                    </button>
                    <button 
                        onClick={() => setActiveTab("EN_ATTENTE")}
                        className={`flex-1 px-6 py-3 rounded-xl md:rounded-[1.8rem] font-black text-[10px] md:text-xs whitespace-nowrap transition-all ${activeTab === "EN_ATTENTE" ? "bg-white dark:bg-slate-700 text-orange-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        EN ATTENTE ({chauffeurs.filter(c => c.statut?.toUpperCase() === "EN_ATTENTE").length})
                    </button>
                    <button 
                        onClick={() => setActiveTab("INACTIF")}
                        className={`flex-1 px-6 py-3 rounded-xl md:rounded-[1.8rem] font-black text-[10px] md:text-xs whitespace-nowrap transition-all ${activeTab === "INACTIF" ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        SUSPENDUS ({chauffeurs.filter(c => c.statut?.toUpperCase() === "INACTIF").length})
                    </button>
                </div>

                <div className="relative w-full flex-1">
                    <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher par nom, email ou téléphone..." 
                        className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 dark:text-white border-none rounded-2xl md:rounded-[2rem] shadow-sm font-bold outline-none ring-2 ring-transparent focus:ring-blue-100 dark:focus:ring-slate-700 transition-all" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            {/* LISTE DES CONDUCTEURS */}
            <div className="grid grid-cols-1 gap-4">
                
                {/* EN-TÊTE DE GRILLE DYNAMIQUE */}
                <div className="hidden md:grid md:grid-cols-12 px-10 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                    <div className={canEdit ? "md:col-span-5" : "md:col-span-6"}>Identité du Conducteur</div>
                    <div className={canEdit ? "md:col-span-4 text-center" : "md:col-span-6 text-right"}>Contacts</div>
                    {canEdit && <div className="md:col-span-3 text-right">Actions de Gestion</div>}
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 font-bold text-slate-400 animate-pulse">Chargement de la flotte de chauffeurs...</div>
                    ) : filtrés.map((chauf) => (
                        <div key={chauf.id} className="bg-white dark:bg-slate-900 flex flex-col md:grid md:grid-cols-12 items-start md:items-center p-5 md:px-10 md:py-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all gap-4 md:gap-0">
                            
                            {/* Identité */}
                            <div className={`${canEdit ? 'md:col-span-5' : 'md:col-span-6'} flex items-center gap-4 w-full`}>
                                <div className="w-14 h-14 shrink-0 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-[1.2rem] flex items-center justify-center font-black text-xl border-2 border-white dark:border-slate-900 shadow-sm">
                                    {chauf.nom?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-black text-slate-800 dark:text-slate-100 text-lg truncate">{chauf.nom}</p>
                                    <div className="mt-1 flex items-center">
                                        {chauf.statut?.toUpperCase() === "EN_ATTENTE" ? (
                                            <span className="inline-flex items-center gap-1.5 text-orange-500 text-[10px] font-black uppercase bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">
                                                <FaClock className="animate-spin duration-1000" /> En attente d'approbation
                                            </span>
                                        ) : chauf.statut?.toUpperCase() === "INACTIF" ? (
                                            <span className="inline-flex items-center gap-1.5 text-rose-500 text-[10px] font-black uppercase bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
                                                <FaUserSlash /> Suspendu / Bloqué
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${chauf.statut === "Aligné a un trajet" ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10" : "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"}`}>
                                                <FaCheckCircle /> {chauf.statut === "Aligné a un trajet" ? "En Mission" : "Opérationnel"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contacts */}
                            <div className={`${canEdit ? 'md:col-span-4' : 'md:col-span-6'} flex flex-col md:items-center ${!canEdit && 'md:items-end'} gap-1.5 w-full`}>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl w-fit">
                                    <FaPhone className="text-blue-500" /> {chauf.telephone}
                                </span>
                                <span className="text-[11px] text-slate-400 font-bold flex items-center gap-2 px-3 truncate max-w-full">
                                    <FaEnvelope className="text-slate-300" /> {chauf.email}
                                </span>
                            </div>

                            {/* 🔒 ACTIONS MASQUÉES POUR L'AGENT */}
                            {canEdit && (
                                <div className="md:col-span-3 flex justify-end items-center gap-2 w-full pt-4 md:pt-0 border-t md:border-t-0 border-slate-50 dark:border-slate-800">
                                    <button 
                                        onClick={() => { 
                                            setCurrentChauffeur(chauf); 
                                            const rawPhone = chauf.telephone ? chauf.telephone.replace('+', '').substring(3) : "";
                                            setPhoneMain(rawPhone); 
                                            setIsEditing(true); 
                                            setTempCode(null);
                                            setShowModal(true); 
                                        }} 
                                        className="p-3 bg-blue-50 dark:bg-slate-800 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all flex-1 md:flex-none flex justify-center items-center"
                                        title="Modifier le profil"
                                    >
                                        <FaEdit size={16} />
                                    </button>
                                    
                                    {chauf.statut?.toUpperCase() !== "INACTIF" && (
                                        <button 
                                            onClick={() => handleBloquer(chauf.id)} 
                                            className="p-3 bg-rose-50 dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all flex-1 md:flex-none flex justify-center items-center"
                                            title="Suspendre le chauffeur"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filtrés.length === 0 && !loading && (
                    <div className="py-16 md:py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <FaUserTie className="text-4xl text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 font-black italic text-xs md:text-sm uppercase tracking-widest">
                            {activeTab === "EN_ATTENTE" ? "Aucun dossier ou inscription en attente" : activeTab === "INACTIF" ? "Aucun chauffeur suspendu" : "Aucun chauffeur opérationnel trouvé"}
                        </p>
                    </div>
                )}
            </div>

            {/* MODAL RESPONSIVE (S'affichera uniquement si canEdit est true) */}
            {showModal && canEdit && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg md:max-w-md rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 p-6 md:p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center z-10">
                            <div>
                                <h2 className="font-black text-lg md:text-xl text-slate-800 dark:text-white uppercase">
                                    {isEditing ? 'Éditer Chauffeur' : 'Nouveau Recrutement'}
                                </h2>
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">En attente de validation admin</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-10">
                            {tempCode ? (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-3xl">
                                        <FaKey />
                                    </div>
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight">Dossier créé !</h3>
                                    <p className="text-slate-500 font-bold text-xs">Transmettez ce code de suivi au chauffeur. Il pourra s'activer dès que l'Admin aura validé son compte :</p>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 select-all">
                                        <span className="text-3xl md:text-4xl font-black tracking-[0.2em] text-blue-600">{tempCode}</span>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-full py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 text-white rounded-2xl font-black transition-colors">
                                        TERMINER
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSave} className="space-y-4 md:space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Identité du conducteur</label>
                                        <input type="text" required placeholder="Nom complet" className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 ring-blue-500" value={currentChauffeur.nom} onChange={(e) => setCurrentChauffeur({...currentChauffeur, nom: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Adresse Courriel</label>
                                        <input type="email" required placeholder="Email de contact" className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 ring-blue-500" value={currentChauffeur.email} onChange={(e) => setCurrentChauffeur({...currentChauffeur, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Numéro de téléphone</label>
                                        <div className="flex gap-2">
                                            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="p-4 md:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-xs md:text-sm outline-none focus:ring-2 ring-blue-500">
                                                {countries.map(c => <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>)}
                                            </select>
                                            <input type="tel" required placeholder="812345678" className="flex-1 p-4 md:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 ring-blue-500" value={phoneMain} onChange={(e) => setPhoneMain(e.target.value)} />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-4 md:py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 mt-4 transition-all active:scale-95">
                                        <FaSave /> {isEditing ? 'METTRE À JOUR LE DOSSIER' : 'SOUMETTRE AU RECRUTEMENT'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionChauffeurs;
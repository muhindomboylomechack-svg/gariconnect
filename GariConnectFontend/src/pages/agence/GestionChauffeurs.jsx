import React, { useState, useEffect } from 'react';
import { 
    FaUserPlus, FaSearch, FaPhone, FaEdit, 
    FaTrash, FaTimes, FaSave, FaKey,
    FaUserTie, FaCheckCircle, FaEnvelope
} from 'react-icons/fa';
import api from '../../services/api';

const GestionChauffeurs = () => {
    const [chauffeurs, setChauffeurs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState("ACTIF"); 
    
    const [countryCode, setCountryCode] = useState("243"); 
    const [phoneMain, setPhoneMain] = useState("");
    const [currentChauffeur, setCurrentChauffeur] = useState({ 
        nom: '', email: '', telephone: '', statut: 'ACTIF' 
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
            // On s'assure que c'est un tableau
            setChauffeurs(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Erreur chargement chauffeurs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprouver = async (id) => {
        if (window.confirm("Approuver ce chauffeur ? Il pourra alors se connecter à son espace.")) {
            try {
                await api.put(`/agences/valider-chauffeur/${id}`);
                alert("✅ Chauffeur approuvé !");
                fetchChauffeurs();
            } catch (error) {
                alert("❌ Erreur : " + (error.response?.data || "Impossible de valider"));
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const fullPhone = `+${countryCode}${phoneMain.replace(/\s+/g, '')}`;
        const dataToSend = { ...currentChauffeur, telephone: fullPhone };

        try {
            if (isEditing) {
                // CORRECTION : Appel à /chauffeurs au lieu de /users
                await api.put(`/chauffeurs/${currentChauffeur.id}`, dataToSend);
                setShowModal(false);
                alert("Mise à jour réussie");
            } else {
                const response = await api.post('/agences/recruter-chauffeur', dataToSend);
                setTempCode(response.data.code); // Affiche le code temporaire pour le nouveau chauffeur
            }
            fetchChauffeurs();
        } catch (error) {
            alert("⚠️ " + (error.response?.data?.message || "Erreur lors de l'enregistrement"));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Voulez-vous révoquer l'accès de ce chauffeur de manière permanente ?")) {
            try {
                // CORRECTION : Appel à /chauffeurs au lieu de /users
                await api.delete(`/chauffeurs/${id}`);
                fetchChauffeurs();
            } catch (error) {
                alert("❌ Erreur lors de la suppression. " + (error.response?.data || ""));
            }
        }
    };

    // Logique de filtrage robuste
    const filtrés = chauffeurs.filter(c => {
        const statutC = c.statut ? c.statut.toUpperCase() : "ACTIF";
        const matchesSearch = (c.nom?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
                              (c.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        
        // On regroupe VALIDE et ACTIF dans l'onglet "ACTIF"
        let matchesTab = false;
        if (activeTab === "ACTIF") {
            matchesTab = statutC === "ACTIF" || statutC === "VALIDE";
        } else {
            matchesTab = statutC === "EN_ATTENTE";
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
                        Vos chauffeurs attitrés et validations en attente
                    </p>
                </div>
                
                <button 
                    onClick={() => { 
                        setIsEditing(false); 
                        setTempCode(null);
                        setPhoneMain(""); 
                        setCurrentChauffeur({ nom: '', email: '', telephone: '', statut: 'ACTIF' }); 
                        setShowModal(true); 
                    }} 
                    className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl md:rounded-[2rem] font-black shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                    <FaUserPlus /> Recrutement Direct
                </button>
            </div>

            {/* FILTRES ET RECHERCHE */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[2rem] w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab("ACTIF")}
                        className={`flex-1 px-4 md:px-8 py-3 rounded-xl md:rounded-[1.8rem] font-black text-[10px] md:text-xs transition-all ${activeTab === "ACTIF" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        ACTIFS ({chauffeurs.filter(c => c.statut === "ACTIF" || c.statut === "VALIDE").length})
                    </button>
                    <button 
                        onClick={() => setActiveTab("EN_ATTENTE")}
                        className={`flex-1 px-4 md:px-8 py-3 rounded-xl md:rounded-[1.8rem] font-black text-[10px] md:text-xs transition-all ${activeTab === "EN_ATTENTE" ? "bg-white dark:bg-slate-700 text-orange-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        EN ATTENTE ({chauffeurs.filter(c => c.statut === "EN_ATTENTE").length})
                    </button>
                </div>

                <div className="relative w-full flex-1">
                    <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher par nom ou email..." 
                        className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 dark:text-white border-none rounded-2xl md:rounded-[2rem] shadow-sm font-bold outline-none ring-2 ring-transparent focus:ring-blue-100 dark:focus:ring-slate-700 transition-all" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            {/* CONTENEUR LISTE CHAUFFEURS */}
            <div className="grid grid-cols-1 gap-4">
                
                {/* EN-TÊTE TABLEAU (Masqué sur mobile, visible sur PC) */}
                <div className="hidden md:grid md:grid-cols-12 px-10 py-4 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                    <div className="md:col-span-5">Identité du Conducteur</div>
                    <div className="md:col-span-4 text-center">Contacts</div>
                    <div className="md:col-span-3 text-right">Actions de Gestion</div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 font-bold text-slate-400 animate-pulse">Chargement de la flotte...</div>
                    ) : filtrés.map((chauf) => (
                        <div key={chauf.id} className="bg-white dark:bg-slate-900 flex flex-col md:grid md:grid-cols-12 items-start md:items-center p-5 md:px-10 md:py-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all gap-4 md:gap-0">
                            
                            {/* Colonne 1: Identité */}
                            <div className="md:col-span-5 flex items-center gap-4 w-full">
                                <div className="w-14 h-14 shrink-0 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-[1.2rem] flex items-center justify-center font-black text-xl border-2 border-white dark:border-slate-900 shadow-sm">
                                    {chauf.nom?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-black text-slate-800 dark:text-slate-100 text-lg truncate">{chauf.nom}</p>
                                    <div className="mt-1 flex items-center">
                                        {chauf.statut === "EN_ATTENTE" ? (
                                            <span className="inline-flex items-center gap-1.5 text-orange-500 text-[10px] font-black uppercase bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">
                                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" /> Non Validé
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                <FaCheckCircle /> Opérationnel
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Colonne 2: Contacts (Empilés sur mobile, alignés sur PC) */}
                            <div className="md:col-span-4 flex flex-col md:items-center gap-1.5 w-full">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl w-fit">
                                    <FaPhone className="text-blue-500" /> {chauf.telephone}
                                </span>
                                <span className="text-[11px] text-slate-400 font-bold flex items-center gap-2 px-3">
                                    <FaEnvelope className="text-slate-300" /> {chauf.email}
                                </span>
                            </div>

                            {/* Colonne 3: Actions */}
                            <div className="md:col-span-3 flex justify-end items-center gap-2 w-full pt-4 md:pt-0 border-t md:border-t-0 border-slate-50 dark:border-slate-800">
                                {chauf.statut === "EN_ATTENTE" && (
                                    <button 
                                        onClick={() => handleApprouver(chauf.id)}
                                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex-1 md:flex-none"
                                    >
                                        APPROUVER
                                    </button>
                                )}
                                <button 
                                    onClick={() => { 
                                        setCurrentChauffeur(chauf); 
                                        // On enlève le "+" et le code pays (ex: +243) pour le formulaire
                                        const rawPhone = chauf.telephone ? chauf.telephone.replace('+', '').substring(3) : "";
                                        setPhoneMain(rawPhone); 
                                        setIsEditing(true); 
                                        setTempCode(null);
                                        setShowModal(true); 
                                    }} 
                                    className="p-3 bg-blue-50 dark:bg-slate-800 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                >
                                    <FaEdit size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(chauf.id)} 
                                    className="p-3 bg-rose-50 dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                >
                                    <FaTrash size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filtrés.length === 0 && !loading && (
                    <div className="py-16 md:py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <FaUserTie className="text-4xl text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 font-black italic text-xs md:text-sm uppercase tracking-widest">
                            {activeTab === "EN_ATTENTE" ? "Aucune validation en attente" : "Aucun chauffeur actif trouvé"}
                        </p>
                    </div>
                )}
            </div>

            {/* MODAL RESPONSIVE */}
            {showModal && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg md:max-w-md rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 p-6 md:p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center z-10">
                            <div>
                                <h2 className="font-black text-lg md:text-xl text-slate-800 dark:text-white uppercase">
                                    {isEditing ? 'Éditer Chauffeur' : 'Nouveau Recrutement'}
                                </h2>
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Opération Sécurisée</p>
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
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight">Accès Généré !</h3>
                                    <p className="text-slate-500 font-bold text-xs">Transmettez ce code de première connexion au chauffeur :</p>
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
                                        <FaSave /> {isEditing ? 'METTRE À JOUR LE PROFIL' : 'VALIDER LE RECRUTEMENT'}
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
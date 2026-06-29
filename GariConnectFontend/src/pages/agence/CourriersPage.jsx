import React, { useState, useEffect } from 'react';
import { 
    FaBox, FaSearch, FaPlus, FaTimes, FaTrash, FaEdit, 
    FaEnvelopeOpenText, FaWeightHanging, FaRobot, FaShieldAlt,
    FaCalendarAlt, FaCheckCircle, FaSpinner, FaMagic, FaExclamationTriangle, FaBolt,
    FaMoneyBillWave, FaDollarSign
} from 'react-icons/fa';
import api from '../../services/api'; 
import StatutActions from '../../component/StatutActions';

const CourriersPage = () => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Mode et gestion des étapes (Intégration de l'IA)
    const [isAiMode, setIsAiMode] = useState(false);
    const [step, setStep] = useState(1);
    const [aiReport, setAiReport] = useState(null);
    const [trajets, setTrajets] = useState([]);
    const [courriers, setCourriers] = useState([]); 
    
    const [selectedColis, setSelectedColis] = useState(null);
    const [formData, setFormData] = useState({
        nomExpediteur: '', 
        telExpediteur: '', 
        nomDestinataire: '',
        telDestinataire: '',
        description: '',
        poidsKg: '',
        valeurEstimee: '',
        estFragile: false,
        type: 'COLIS', // Par défaut
        trajetId: '',
        prix: ''
    });

    // 1. Chargement initial des courriers / colis
    const chargerCourriers = async () => {
        setLoading(true);
        try {
            // CORRECTION ICI : Remplacement de '/api/courriers' par '/courriers'
            const response = await api.get('/courriers');
            if (Array.isArray(response.data)) {
                setCourriers(response.data);
            } else {
                console.error("Les données reçues ne sont pas un tableau :", response.data);
                setCourriers([]);
            }
        } catch (error) {
            console.error("Erreur de chargement des courriers", error);
            setCourriers([]);
        } finally {
            setLoading(false);
        }
    };

    // 2. Chargement initial des trajets disponibles pour l'attribution
    const chargerTrajets = async () => {
        try {
            // CORRECTION ICI : Remplacement de '/api/trajets' par '/trajets'
            const response = await api.get('/trajets');
            setTrajets(response.data);
        } catch (error) {
            console.error("Erreur de chargement des trajets", error);
        }
    };

    useEffect(() => {
        chargerCourriers();
        chargerTrajets();
    }, []);

    // Déclenchement de l'analyse IA (Étape 1 vers Étape 2)
    const executerAnalyseIA = async () => {
        if (!formData.description || !formData.poidsKg || !formData.valeurEstimee) {
            alert("Veuillez remplir la description, le poids et la valeur estimée pour l'analyse IA.");
            return;
        }

        setLoading(true);
        try {
            // CORRECTION ICI : Remplacement de '/api/courriers/analyser-ia' par '/courriers/analyser-ia'
            const response = await api.post('/courriers/analyser-ia', {
                description: formData.description,
                poidsKg: parseFloat(formData.poidsKg),
                valeurEstimee: parseFloat(formData.valeurEstimee),
                estFragile: formData.estFragile
            });
            
            setAiReport(response.data);
            setFormData(prev => ({
                ...prev,
                prix: response.data.prixSuggereIA
            }));
            setStep(2); // Passer à l'affichage des résultats et de la tarification
        } catch (error) {
            console.error("Erreur lors de l'analyse IA", error);
            alert("Impossible de compléter l'analyse IA pour le moment.");
        } finally {
            setLoading(false);
        }
    };

    // Soumission finale du colis en Base de Données
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Construction de l'objet final attendu par le Backend Spring Boot
        const payload = {
            ...formData,
            poidsKg: parseFloat(formData.poidsKg),
            valeurEstimee: parseFloat(formData.valeurEstimee),
            prix: parseFloat(formData.prix),
            trajet: formData.trajetId ? { id: parseInt(formData.trajetId) } : null,
            // Inclusion des diagnostics de l'IA s'ils ont été générés
            niveauRisqueIA: aiReport ? aiReport.niveauRisqueIA : null,
            prixSuggereIA: aiReport ? aiReport.prixSuggereIA : null,
            justificationIA: aiReport ? aiReport.justificationIA : null
        };

        try {
            if (selectedColis) {
                // Modification
                // CORRECTION ICI : Remplacement de `/api/courriers/${selectedColis.id}` par `/courriers/${selectedColis.id}`
                await api.put(`/courriers/${selectedColis.id}`, payload);
            } else {
                // Enregistrement
                // CORRECTION ICI : Remplacement de '/api/courriers' par '/courriers'
                await api.post('/courriers', payload);
            }
            
            setShowModal(false);
            resetForm();
            chargerCourriers();
        } catch (error) {
            console.error("Erreur lors de l'enregistrement", error);
            alert("Erreur lors de la sauvegarde du colis.");
        } finally {
            setLoading(false);
        }
    };

    // Suppression d'un colis
    const handleDelete = async (id) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce colis/courrier ?")) {
            try {
                // CORRECTION ICI : Remplacement de `/api/courriers/${id}` par `/courriers/${id}`
                await api.delete(`/courriers/${id}`);
                chargerCourriers();
            } catch (error) {
                console.error("Erreur lors de la suppression", error);
            }
        }
    };

    const handleEdit = (colis) => {
        setSelectedColis(colis);
        setFormData({
            nomExpediteur: colis.nomExpediteur || '',
            telExpediteur: colis.telExpediteur || '',
            nomDestinataire: colis.nomDestinataire || '',
            telDestinataire: colis.telDestinataire || '',
            description: colis.description || '',
            poidsKg: colis.poidsKg || '',
            valeurEstimee: colis.valeurEstimee || '',
            estFragile: colis.estFragile || false,
            type: colis.type || 'COLIS',
            trajetId: colis.trajet ? colis.trajet.id : '',
            prix: colis.prix || ''
        });
        setIsAiMode(false);
        setStep(1);
        setAiReport(null);
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedColis(null);
        setFormData({
            nomExpediteur: '', telExpediteur: '', nomDestinataire: '', telDestinataire: '',
            description: '', poidsKg: '', valeurEstimee: '', estFragile: false,
            type: 'COLIS', trajetId: '', prix: ''
        });
        setIsAiMode(false);
        setStep(1);
        setAiReport(null);
    };

    // Filtrage dynamique des lignes du tableau
    const filteredCourriers = courriers.filter(c => 
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.nomExpediteur && c.nomExpediteur.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.nomDestinataire && c.nomDestinataire.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.codeRetrait && c.codeRetrait.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <FaBox className="text-indigo-600" /> Gestion des Colis & Courriers
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Enregistrement, tarification intelligente et suivi des expéditions</p>
                </div>
                
                <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-sm">
                    <FaPlus size={14} /> Nouvel Enregistrement
                </button>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[1.4rem] shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Total Flux</span>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 block">{courriers.length}</span>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center"><FaBox size={20} /></div>
                </div>
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[1.4rem] shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">En attente</span>
                        <span className="text-2xl font-black text-amber-600 mt-1 block">{courriers.filter(c => c.statut === 'EN_ATTENTE').length}</span>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center"><FaCalendarAlt size={20} /></div>
                </div>
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[1.4rem] shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">En Transit</span>
                        <span className="text-2xl font-black text-blue-600 mt-1 block">{courriers.filter(c => c.statut === 'EN_ROUTE').length}</span>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center"><FaBolt size={20} /></div>
                </div>
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[1.4rem] shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Livrés</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block">{courriers.filter(c => c.statut === 'ARRIVE').length}</span>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center"><FaCheckCircle size={20} /></div>
                </div>
            </div>

            {/* Search filter */}
            <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-[1.4rem] shadow-sm">
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Rechercher par expéditeur, destinataire, description ou code secret..." className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 outline-none text-sm focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Main Table View */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[1.4rem] shadow-sm overflow-hidden">
                {loading && courriers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                        <FaSpinner className="animate-spin text-indigo-600" size={32} />
                        <span className="text-sm font-medium">Chargement des données sur l'axe logistique...</span>
                    </div>
                ) : filteredCourriers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                        <FaExclamationTriangle size={28} className="text-slate-300 dark:text-slate-700" />
                        <span className="text-sm font-medium">Aucun colis ne correspond à vos critères</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <th className="py-4 px-5">Code & Type</th>
                                    <th className="py-4 px-5">Expéditeur</th>
                                    <th className="py-4 px-5">Destinataire</th>
                                    <th className="py-4 px-5">Spécifications</th>
                                    <th className="py-4 px-5 text-right">Frais d'Envoi</th>
                                    <th className="py-4 px-5 text-center">Diagnostic IA</th>
                                    <th className="py-4 px-5 text-center">Statut spatial</th>
                                    <th className="py-4 px-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm text-slate-700 dark:text-slate-300">
                                {filteredCourriers.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-all group">
                                        <td className="py-4 px-5">
                                            <span className="font-mono text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200/40 dark:border-slate-700/30">{c.codeRetrait || 'AFFECTATION...'}</span>
                                            <span className={`ml-2 text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-md ${c.type === 'COLIS' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'}`}>{c.type}</span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="font-bold text-slate-800 dark:text-slate-100">{c.nomExpediteur}</div>
                                            <div className="text-xs text-slate-400 font-medium mt-0.5">{c.telExpediteur}</div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="font-bold text-slate-800 dark:text-slate-100">{c.nomDestinataire}</div>
                                            <div className="text-xs text-slate-400 font-medium mt-0.5">{c.telDestinataire}</div>
                                        </td>
                                        <td className="py-4 px-5 max-w-xs">
                                            <div className="truncate font-semibold text-slate-800 dark:text-slate-200">{c.description}</div>
                                            <div className="flex gap-2 items-center text-xs text-slate-400 mt-1 font-medium">
                                                <span className="flex items-center gap-1"><FaWeightHanging size={10} /> {c.poidsKg} kg</span>
                                                {c.estFragile && <span className="bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold">FRAGILE</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-right font-black text-slate-900 dark:text-white">
                                            {c.prix ? `${c.prix.toLocaleString()} FC` : 'Non défini'}
                                        </td>
                                        <td className="py-4 px-5 text-center">
                                            {c.niveauRisqueIA ? (
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                                                    c.niveauRisqueIA === 'ELEVE' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' :
                                                    c.niveauRisqueIA === 'MODERE' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                                                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                }`}>
                                                    <FaRobot size={12} /> {c.niveauRisqueIA}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-300 dark:text-slate-700 font-medium">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 text-center">
                                            <StatutActions currentStatut={c.statut} courrierId={c.id} onStatutUpdated={chargerCourriers} />
                                        </td>
                                        <td className="py-4 px-5 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(c)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"><FaEdit size={14} /></button>
                                                <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"><FaTrash size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Enregistrement / Modification (Multi-étapes & Mode IA Intégré) */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden transform transition-all">
                        {/* Modal Header */}
                        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    {selectedColis ? <FaEdit className="text-indigo-600" /> : <FaPlus className="text-indigo-600" />}
                                    {selectedColis ? "Modifier la Fiche d'Expédition" : "Nouvel Enregistrement de Fret"}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Veuillez renseigner les détails physiques et géographiques</p>
                            </div>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center rounded-xl transition-all"><FaTimes size={14} /></button>
                        </div>

                        {/* Choix de la méthode de saisie (Seulement lors de la création) */}
                        {!selectedColis && step === 1 && (
                            <div className="grid grid-cols-2 p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 gap-3">
                                <button type="button" onClick={() => setIsAiMode(false)} className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${!isAiMode ? 'bg-white dark:bg-slate-900 text-indigo-600 border-indigo-100 dark:border-indigo-900/50 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/30'}`}>
                                    <FaBox size={14} /> Saisie Classique (Tarif Manuel)
                                </button>
                                <button type="button" onClick={() => setIsAiMode(true)} className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${isAiMode ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/30'}`}>
                                    <FaMagic className="text-indigo-500 animate-pulse" size={14} /> Tarification Intelligente (IA Gemini)
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* ÉTAPE 1 : Renseignement des informations */}
                            {step === 1 && (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
                                    {/* Informations Expéditeur */}
                                    <div className="space-y-3 md:col-span-1">
                                        <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800/40 pb-1">Expéditeur</h4>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Nom Complet *</label>
                                            <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl border border-slate-100 dark:border-slate-800/60 outline-none text-sm focus:border-indigo-500" value={formData.nomExpediteur} onChange={e => setFormData({...formData, nomExpediteur: e.target.value})} required />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Numéro Téléphone *</label>
                                            <input type="tel" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl border border-slate-100 dark:border-slate-800/60 outline-none text-sm focus:border-indigo-500" value={formData.telExpediteur} onChange={e => setFormData({...formData, telExpediteur: e.target.value})} required />
                                        </div>
                                    </div>

                                    {/* Informations Destinataire */}
                                    <div className="space-y-3 md:col-span-1">
                                        <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800/40 pb-1">Destinataire</h4>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Nom Complet *</label>
                                            <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl border border-slate-100 dark:border-slate-800/60 outline-none text-sm focus:border-indigo-500" value={formData.nomDestinataire} onChange={e => setFormData({...formData, nomDestinataire: e.target.value})} required />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Numéro Téléphone *</label>
                                            <input type="tel" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl border border-slate-100 dark:border-slate-800/60 outline-none text-sm focus:border-indigo-500" value={formData.telDestinataire} onChange={e => setFormData({...formData, telDestinataire: e.target.value})} required />
                                        </div>
                                    </div>

                                    {/* Spécificités Physiques du Fret */}
                                    <div className="space-y-3 md:col-span-2 mt-2">
                                        <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800/40 pb-1">Description & Spécifications physiques</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 mb-1 block">Type de Colis</label>
                                                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl border border-slate-100 dark:border-slate-800/60 outline-none text-sm focus:border-indigo-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                                    <option value="COLIS">COLIS (Boîte, Sac, Fret...)</option>
                                                    <option value="COURRIER">COURRIER (Lettre, Document...)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 mb-1 block">Poids (en Kg) *</label>
                                                <input type="number" step="0.1" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl border border-slate-100 dark:border-slate-800/60 outline-none text-sm focus:border-indigo-500" value={formData.poidsKg} onChange={e => setFormData({...formData, poidsKg: e.target.value})} required />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 mb-1 block">Valeur estimée (FC) *</label>
                                                <input type="number" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl border border-slate-100 dark:border-slate-800/60 outline-none text-sm focus:border-indigo-500" value={formData.valeurEstimee} onChange={e => setFormData({...formData, valeurEstimee: e.target.value})} required />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Description précise du contenu *</label>
                                            <input type="text" placeholder="Exemple : Écran TV 55 pouces, Carton de médicaments, Sac de vêtements..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl border border-slate-100 dark:border-slate-800/60 outline-none text-sm focus:border-indigo-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                                        </div>

                                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/40 w-max">
                                            <input type="checkbox" id="estFragile" className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" checked={formData.estFragile} onChange={e => setFormData({...formData, estFragile: e.target.checked})} />
                                            <label htmlFor="estFragile" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Ce colis contient des éléments fragiles</label>
                                        </div>
                                    </div>

                                    {/* Axe Géographique (Trajet) */}
                                    <div className="space-y-3 md:col-span-2 mt-2">
                                        <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800/40 pb-1">Logistique géographique</h4>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Axe de transport / Trajet associé *</label>
                                            <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl border border-slate-100 dark:border-slate-800/60 outline-none text-sm focus:border-indigo-500" value={formData.trajetId} onChange={e => setFormData({...formData,  trajetId: e.target.value})} required>
                                                <option value="">-- Sélectionnez l'axe routier de transit --</option>
                                                {trajets.map(t => (
                                                    <option key={t.id} value={t.id}>{t.villeDepart} → {t.villeArrivee} ({t.prixTrajet ? `${t.prixTrajet.toLocaleString()} FC` : 'Tarif libre'})</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        {/* Champ Prix visible directement uniquement en Saisie Classique ou en Mode Modification */}
                                        {(!isAiMode || selectedColis) && (
                                            <div>
                                                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 block">Frais de transport appliqués (FC) *</label>
                                                <input type="number" className="w-full px-4 py-4 bg-indigo-50/40 dark:bg-indigo-950/10 font-bold dark:text-white rounded-xl border border-indigo-100 dark:border-indigo-900/40 outline-none text-sm focus:border-indigo-500" value={formData.prix} onChange={e => setFormData({...formData, prix: e.target.value})} required />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ÉTAPE 2 : Évaluation et validation IA (Affiché uniquement en Mode IA à la création) */}
                            {step === 2 && isAiMode && aiReport && (
                                <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl text-white shadow-md">
                                        <div className="flex items-center gap-2">
                                            <FaRobot size={22} className="animate-bounce" />
                                            <div>
                                                <h4 className="font-black text-base">Évaluation Complétée avec succès !</h4>
                                                <p className="text-xs text-indigo-100">Le modèle logistique prédictif Gemini a extrait les diagnostics suivants :</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
                                            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider flex items-center gap-1.5"><FaShieldAlt /> Niveau de Risque Estimé</span>
                                            <span className={`text-xl font-black mt-1.5 inline-block ${aiReport.niveauRisqueIA === 'ELEVE' ? 'text-rose-600' : aiReport.niveauRisqueIA === 'MODERE' ? 'text-amber-500' : 'text-emerald-500'}`}>{aiReport.niveauRisqueIA}</span>
                                        </div>
                                        <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
                                            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider flex items-center gap-1.5"><FaMoneyBillWave /> Prix Suggéré par l'IA</span>
                                            <span className="text-xl font-black text-slate-900 dark:text-white mt-1.5 block">{aiReport.prixSuggereIA ? `${aiReport.prixSuggereIA.toLocaleString()} FC` : '0 FC'}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
                                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Justification cognitive de la tarification</span>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60">{aiReport.justificationIA}</p>
                                    </div>

                                    <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center gap-3">
                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2 min-w-32">Prix Final (FC)</span>
                                        <input type="number" className="flex-1 p-4 bg-white dark:bg-slate-900 dark:text-white rounded-[1.4rem] font-black text-right text-lg border border-slate-100 dark:border-slate-800/60 outline-none focus:border-indigo-500" value={formData.prix ?? ""} onChange={e => setFormData({...formData, prix: e.target.value})} required />
                                    </div>
                                </div>
                            )}

                            {/* Modal Actions Footer */}
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3">
                                {step === 1 && isAiMode && !selectedColis ? (
                                    <button type="button" onClick={executerAnalyseIA} disabled={loading} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 transition-all">
                                        {loading ? <FaSpinner className="animate-spin" /> : <FaMagic />} Calculer le tarif recommandé
                                    </button>
                                ) : (
                                    <>
                                        {step === 2 && isAiMode && (
                                            <button type="button" onClick={() => setStep(1)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all">← Modifier les infos</button>
                                        )}
                                        <button type="submit" disabled={loading} className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2 transition-all">
                                            {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} {selectedColis ? "Mettre à jour la fiche" : "Confirmer et Archiver"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourriersPage;
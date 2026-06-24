import React, { useState, useEffect } from 'react';
import { 
    FaBox, FaSearch, FaPlus, FaTimes, FaTrash, FaEdit, 
    FaEnvelopeOpenText, FaWeightHanging, FaRobot, FaShieldAlt,
    FaCalendarAlt, FaCheckCircle, FaSpinner, FaMagic, FaExclamationTriangle, FaBolt
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
        nomExpediteur: '', telExpediteur: '', nomDestinataire: '',
        telDestinataire: '', description: '', prix: '', trajetId: '',
        type: 'COLIS',
        poidsKg: '', valeurEstimee: '', estFragile: false
    });

    useEffect(() => {
        fetchTrajets();
        fetchCourriers();
    }, []);

    const fetchTrajets = async () => {
        try {
            const res = await api.get('/trajets');
            setTrajets(res.data || []);
        } catch (err) {
            console.error("Erreur lors de la récupération des trajets", err);
        }
    };

    const fetchCourriers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/courriers');
            setCourriers(res.data || []);
        } catch (err) {
            console.error("Erreur lors de la récupération des courriers", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const openCreateModal = () => {
        setSelectedColis(null);
        setIsAiMode(false);
        setStep(1);
        setAiReport(null);
        setFormData({
            nomExpediteur: '', telExpediteur: '', nomDestinataire: '',
            telDestinataire: '', description: '', prix: '', trajetId: '',
            type: 'COLIS',
            poidsKg: '', valeurEstimee: '', estFragile: false
        });
        setShowModal(true);
    };

    const openEditModal = (courrier) => {
        setSelectedColis(courrier);
        setIsAiMode(false);
        setStep(1);
        setAiReport(null);
        setFormData({
            nomExpediteur: courrier.nomExpediteur ?? '',
            telExpediteur: courrier.telExpediteur ?? '',
            nomDestinataire: courrier.nomDestinataire ?? '',
            telDestinataire: courrier.telDestinataire ?? '',
            description: courrier.description ?? '',
            prix: courrier.prix ?? '',
            trajetId: courrier.trajet?.id ?? courrier.trajetId ?? '',
            type: courrier.type ?? 'COLIS',
            poidsKg: courrier.poidsKg ?? '',
            valeurEstimee: courrier.valeurEstimee ?? '',
            estFragile: courrier.estFragile ?? false
        });
        setShowModal(true);
    };

    // Étape 1 de l'IA : Analyse intelligente des risques et tarification
    const handleAiAnalyze = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/courriers/analyser-ia', formData);
            setAiReport(res.data);
            setFormData(prev => ({
                ...prev,
                prix: res.data.prixSuggereIA ?? prev.prix
            }));
            setStep(2);
        } catch (err) {
            console.error("Erreur lors de l'analyse IA", err);
            alert("L'analyse IA a échoué. Saisie classique activée.");
            setIsAiMode(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Nettoyage et conversion des types pour Spring Boot / JPA
            const payload = {
                nomExpediteur: formData.nomExpediteur,
                telExpediteur: formData.telExpediteur,
                nomDestinataire: formData.nomDestinataire,
                telDestinataire: formData.telDestinataire,
                description: formData.description,
                type: formData.type || 'COLIS',

                // Sécurité : Conversion numérique stricte ou null
                prix: formData.prix ? parseFloat(formData.prix) : 0.0,
                poidsKg: formData.poidsKg ? parseFloat(formData.poidsKg) : null,
                valeurEstimee: formData.valeurEstimee ? parseFloat(formData.valeurEstimee) : null,
                estFragile: formData.estFragile || false,

                // Formatage de la relation Trajet pour JPA
                trajet: formData.trajetId ? { id: parseInt(formData.trajetId) } : null,

                // Persistance des champs d'évaluation IA
                niveauRisqueIA: aiReport?.niveauRisqueIA ?? selectedColis?.niveauRisqueIA ?? null,
                justificationIA: aiReport?.justificationIA ?? selectedColis?.justificationIA ?? null,
                prixSuggereIA: aiReport?.prixSuggereIA ?? selectedColis?.prixSuggereIA ?? null
            };

            console.log("🚀 Payload envoyé au backend :", payload);

            if (selectedColis) {
                await api.put(`/courriers/${selectedColis.id}`, payload);
            } else {
                await api.post('/courriers/envoyer', payload);
            }

            fetchCourriers();
            setShowModal(false);
        } catch (err) {
            console.error("❌ Erreur détaillée :", err.response?.data);
            alert("Erreur lors de la sauvegarde du colis. Vérifiez la console.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce courrier/colis ?")) {
            try {
                await api.delete(`/courriers/${id}`);
                fetchCourriers();
            } catch (err) {
                console.error("Erreur lors de la suppression", err);
            }
        }
    };

    const filteredCourriers = courriers.filter(c =>
        (c.nomExpediteur?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.nomDestinataire?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <FaBox className="text-indigo-600 dark:text-indigo-400" /> Gestion des Courriers & Colis
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Gerez les expéditions de colis, lettres de transport et intégration de tarification par IA.
                    </p>
                </div>
                <button onClick={openCreateModal} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[1.2rem] shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm uppercase tracking-wider">
                    <FaPlus /> Enregistrer un Courrier
                </button>
            </div>

            {/* Barre de recherche */}
            <div className="mb-6 max-w-md relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher par expéditeur, destinataire..."
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-[1.2rem] text-sm outline-none focus:border-indigo-500 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grille d'affichage des colis */}
            {loading && courriers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <FaSpinner className="animate-spin text-4xl text-indigo-600" />
                    <p className="text-sm font-semibold text-slate-500">Chargement des données en cours...</p>
                </div>
            ) : filteredCourriers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 rounded-[2rem] p-12 text-center shadow-sm">
                    <FaEnvelopeOpenText className="mx-auto text-5xl text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-lg font-bold mb-1">Aucun courrier trouvé</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">Commencez par ajouter un nouveau colis ou liez-les à votre agence connectée.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredCourriers.map((courrier) => (
                        <div key={courrier.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            
                            {/* IA Badge */}
                            {courrier.niveauRisqueIA && (
                                <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-xl flex items-center gap-1.5 text-white ${
                                    courrier.niveauRisqueIA === 'ELEVE' ? 'bg-rose-500' :
                                    courrier.niveauRisqueIA === 'MODERE' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}>
                                    <FaRobot /> IA Vérifiée ({courrier.niveauRisqueIA})
                                </div>
                            )}

                            <div className="flex gap-4 items-start mb-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-600 dark:text-slate-300">
                                    <FaBox className="text-2xl" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 uppercase tracking-wider">{courrier.type}</span>
                                    <h4 className="font-bold text-lg mt-1 truncate">{courrier.description || "Sans description"}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                        <FaCalendarAlt /> Trajet : {courrier.trajet?.depart || "N/A"} → {courrier.trajet?.destination || "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-3 my-3 border-y border-slate-50 dark:border-slate-800/50 text-xs">
                                <div>
                                    <p className="text-slate-400">Expéditeur :</p>
                                    <p className="font-bold mt-0.5">{courrier.nomExpediteur} ({courrier.telExpediteur})</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Destinataire :</p>
                                    <p className="font-bold mt-0.5">{courrier.nomDestinataire} ({courrier.telDestinataire})</p>
                                </div>
                            </div>

                            {/* Spécifications physiques */}
                            {(courrier.poidsKg || courrier.valeurEstimee) && (
                                <div className="flex gap-4 text-xs bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl mb-4">
                                    {courrier.poidsKg && <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400"><FaWeightHanging /> {courrier.poidsKg} kg</span>}
                                    {courrier.valeurEstimee && <span className="font-semibold text-slate-600 dark:text-slate-400">💰 Valeur : {courrier.valeurEstimee} FC</span>}
                                    {courrier.estFragile && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 rounded-md font-bold uppercase tracking-wider text-[9px] flex items-center">Fragile</span>}
                                </div>
                            )}

                            {/* Justification de l'IA */}
                            {courrier.justificationIA && (
                                <p className="text-[11px] text-slate-400 italic bg-indigo-50/30 dark:bg-indigo-950/10 p-2.5 rounded-xl border border-indigo-100/30 dark:border-indigo-900/20 mb-4 flex items-start gap-1.5">
                                    <FaMagic className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <span>{courrier.justificationIA}</span>
                                </p>
                            )}

                            {/* Actions de gestion du colis & composants d'états */}
                            <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-50 dark:border-slate-800/30">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Prix de l'envoi</p>
                                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{courrier.prix?.toLocaleString()} FC</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatutActions courrier={courrier} onRefresh={fetchCourriers} />
                                    <button onClick={() => openEditModal(courrier)} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300" title="Modifier">
                                        <FaEdit size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(courrier.id)} className="p-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 rounded-xl transition-all text-rose-600 dark:text-rose-400" title="Supprimer">
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* Modal de création / modification */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800/50 transform transition-all">
                        
                        {/* En-tête Modal */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    {selectedColis ? <FaEdit className="text-indigo-500" /> : <FaPlus className="text-indigo-500" />}
                                    {selectedColis ? "Modifier le Courrier/Colis" : "Enregistrer un Nouveau Courrier/Colis"}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Remplissez les informations d'expédition pour le cloisonnement de l'agence.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-200 rounded-full transition-colors">
                                <FaTimes size={14} />
                            </button>
                        </div>

                        {/* Sélecteur de Mode (Uniquement lors de la création d'un nouveau colis) */}
                        {!selectedColis && step === 1 && (
                            <div className="p-6 pb-0 grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setIsAiMode(false)} className={`p-4 rounded-2xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                    !isAiMode ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}>
                                    <FaBox /> Saisie Manuelle
                                </button>
                                <button type="button" onClick={() => setIsAiMode(true)} className={`p-4 rounded-2xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                    isAiMode ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}>
                                    <FaRobot /> Évaluation par IA
                                </button>
                            </div>
                        )}

                        {/* Corps du Formulaire */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {/* ÉTAPE 1 : Formulaire Général ou Analyse IA */}
                            {step === 1 && (
                                <form onSubmit={isAiMode ? handleAiAnalyze : handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Nom de l'Expéditeur</label>
                                            <input type="text" name="nomExpediteur" value={formData.nomExpediteur} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Téléphone Expéditeur</label>
                                            <input type="tel" name="telExpediteur" value={formData.telExpediteur} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Nom du Destinataire</label>
                                            <input type="text" name="nomDestinataire" value={formData.nomDestinataire} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Téléphone Destinataire</label>
                                            <input type="tel" name="telDestinataire" value={formData.telDestinataire} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Type d'expédition</label>
                                            <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:border-indigo-500 font-semibold">
                                                <option value="COLIS">📦 COLIS (Marchandises/Paquets)</option>
                                                <option value="COURRIER">✉️ COURRIER (Lettres/Documents)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Trajet Associé</label>
                                            <select name="trajetId" value={formData.trajetId} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:border-indigo-500 font-semibold">
                                                <option value="">-- Sélectionner un trajet --</option>
                                                {trajets.map(t => (
                                                    <option key={t.id} value={t.id}>{t.depart} → {t.destination} ({t.prixTrajet} FC)</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Description du contenu</label>
                                        <textarea name="description" value={formData.description} onChange={handleChange} required rows="2" className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:border-indigo-500 resize-none" placeholder="Ex: Pièces de rechange électroniques, habits..."></textarea>
                                    </div>

                                    {/* Champs conditionnels ou complémentaires pour l'IA */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            <FaShieldAlt className="text-indigo-500" /> Spécifications Physiques & Logistiques
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Poids approximatif (Kg)</label>
                                                <input type="number" step="0.1" name="poidsKg" value={formData.poidsKg} onChange={handleChange} placeholder="Ex: 4.5" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:border-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Valeur Estimée (FC)</label>
                                                <input type="number" name="valeurEstimee" value={formData.valeurEstimee} onChange={handleChange} placeholder="Ex: 45000" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl text-sm outline-none focus:border-indigo-500" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pt-1">
                                            <input type="checkbox" name="estFragile" id="estFragile" checked={formData.estFragile} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                                            <label htmlFor="estFragile" className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 cursor-pointer">Ce colis est fragile / délicat</label>
                                        </div>
                                    </div>

                                    {/* Champ de tarification directe si Saisie Manuelle ou si Modification */}
                                    {(!isAiMode || selectedColis) && (
                                        <div className="pt-2">
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Prix Final du Transport (FC)</label>
                                            <input type="number" name="prix" value={formData.prix} onChange={handleChange} required placeholder="Montant facturé au client" className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl text-lg font-black text-right text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500" />
                                        </div>
                                    )}

                                    {/* Actions d'envoi Étape 1 */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
                                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">Annuler</button>
                                        <button type="submit" disabled={loading} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2">
                                            {loading ? <FaSpinner className="animate-spin" /> : isAiMode ? <><FaBolt /> Lancer l'analyse IA</> : "Valider et Enregistrer"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* ÉTAPE 2 : Rapport d'analyse de l'IA (Confirmation de Tarification) */}
                            {step === 2 && aiReport && (
                                <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
                                    <div className="p-6 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-[1.8rem] space-y-4">
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase text-xs tracking-wider">
                                            <FaRobot className="text-xl" /> Analyse Logistique Réussie !
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Niveau de Risque</span>
                                                <span className={`inline-block px-3 py-1 text-[11px] font-black rounded-full mt-1.5 text-white uppercase tracking-widest ${
                                                    aiReport.niveauRisqueIA === 'ELEVE' ? 'bg-rose-500' :
                                                    aiReport.niveauRisqueIA === 'MODERE' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}>
                                                    {aiReport.niveauRisqueIA || 'MODERE'}
                                                </span>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Prix Suggéré (IA)</span>
                                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                                                    {aiReport.prixSuggereIA?.toLocaleString()} FC
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                                            <strong className="text-slate-700 dark:text-slate-200 block mb-1 flex items-center gap-1"><FaExclamationTriangle className="text-amber-500" /> Justification de l'algorithme :</strong>
                                            <span className="italic">"{aiReport.justificationIA || "Aucune justification fournie."}"</span>
                                        </div>
                                    </div>

                                    {/* Saisie ou ajustement manuel du Prix Final avant l'encaissement */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex items-center gap-4">
                                        <span className="px-6 py-3.5 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl tracking-wider">Prix Final (FC)</span>
                                        <input 
                                            type="number" 
                                            className="flex-1 p-4 bg-white dark:bg-slate-900 dark:text-white rounded-[1.4rem] font-black text-right text-lg border border-slate-100 dark:border-slate-800/60 outline-none focus:border-indigo-500" 
                                            value={formData.prix ?? ""} 
                                            onChange={e => setFormData({...formData, prix: e.target.value})} 
                                            required 
                                        />
                                    </div>

                                    {/* Actions d'envoi final */}
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setStep(1)} className="px-8 py-5 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">Retour</button>
                                        <button type="submit" disabled={loading} className="flex-1 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all text-xs shadow-xl shadow-emerald-500/20 disabled:opacity-50">
                                            {loading ? "Traitement..." : "Valider et Encaisser"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default CourriersPage;
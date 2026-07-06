import React, { useState, useEffect } from 'react';
import { 
    FaBox, FaSearch, FaPaperPlane, FaShieldAlt, FaRoute, 
    FaCheckCircle, FaSpinner, FaHistory, FaUser, FaPhoneAlt, FaExclamationTriangle,
    FaMoneyBillWave, FaBuilding
} from 'react-icons/fa';
import api from '../../services/api';

const ClientCourrierHub = () => {
    const [activeTab, setActiveTab] = useState('suivi'); // 'suivi', 'demande', ou 'historique'
    const [codeRetrait, setCodeRetrait] = useState('');
    const [suiviResult, setSuiviResult] = useState(null);
    const [mesColis, setMesColis] = useState([]); // Stockage de l'historique complet
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingTrajets, setLoadingTrajets] = useState(false);
    const [message, setMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Listes pour le multi-tenant et la cascade
    const [agences, setAgences] = useState([]);
    const [trajets, setTrajets] = useState([]);

    // Pour la création d'une pré-demande ou estimation par le client
    const [clientForm, setClientForm] = useState({
        nomExpediteur: '', telExpediteur: '',
        nomDestinataire: '', telDestinataire: '',
        description: '', poidsKg: '', valeurEstimee: '', devise: 'FC', estFragile: false,
        type: 'COLIS',
        agenceId: '', trajetId: '' // Nouveaux champs rajoutés
    });

    // Charger l'historique ou les agences selon l'onglet actif
    useEffect(() => {
        if (activeTab === 'historique') {
            chargerHistorique();
        } else if (activeTab === 'demande') {
            chargerAgences();
        }
    }, [activeTab]);

    // Charger dynamiquement les trajets quand l'agence sélectionnée change
    useEffect(() => {
        if (clientForm.agenceId) {
            chargerTrajetsParAgence(clientForm.agenceId);
        } else {
            setTrajets([]);
            setClientForm(prev => ({ ...prev, trajetId: '' }));
        }
    }, [clientForm.agenceId]);

    const chargerAgences = async () => {
        try {
            const response = await api.get('/users/agencies'); 
            setAgences(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement des agences", error);
            setMessage("Impossible de charger la liste des agences.");
        }
    };

    const chargerTrajetsParAgence = async (agenceId) => {
        setLoadingTrajets(true);
        try {
            const response = await api.get(`/trajets/agence/${agenceId}`); 
            // Diagnostic optionnel : affiche la structure exacte reçue dans votre console de navigateur
            console.log("Trajets reçus du backend :", response.data);
            setTrajets(response.data);
            setClientForm(prev => ({ ...prev, trajetId: '' })); // Reset du trajet précédent
        } catch (error) {
            console.error("Erreur lors du chargement des trajets", error);
            setMessage("Impossible de charger les trajets pour cette agence.");
        } finally {
            setLoadingTrajets(false);
        }
    };

    const chargerHistorique = async () => {
        setLoadingHistory(true);
        setMessage('');
        try {
            const response = await api.get('/courriers/mon-hub');
            setMesColis(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement du hub", error);
            setMessage("Impossible de récupérer votre historique de colis. Vérifiez votre session.");
        } finally {
            setLoadingHistory(false);
        }
    };

    // Fonction de suivi de colis via le code secret
    const handleSuivi = async (e) => {
        e.preventDefault();
        if (!codeRetrait) return;
        setLoading(true);
        setSuiviResult(null);
        setMessage('');

        try {
            const response = await api.get(`/courriers/suivi/${codeRetrait}`);
            setSuiviResult(response.data);
        } catch (error) {
            console.error("Erreur lors du suivi du colis", error);
            setMessage("Code de retrait introuvable ou invalide. Veuillez vérifier votre reçu.");
        } finally {
            setLoading(false);
        }
    };

    // Soumission d'une pré-demande d'expédition
    const handleCreateDemande = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setSuccessMessage('');

        try {
            const payload = {
                ...clientForm,
                poidsKg: clientForm.poidsKg ? parseFloat(clientForm.poidsKg) : null,
                valeurEstimee: clientForm.valeurEstimee ? parseFloat(clientForm.valeurEstimee) : null,
                trajet: clientForm.trajetId ? { id: parseInt(clientForm.trajetId) } : null,
                statut: 'EN_ATTENTE' 
            };

            delete payload.agenceId;
            delete payload.trajetId;

            await api.post('/courriers/pre-enregistrer', payload);
            setSuccessMessage("Votre pré-enregistrement a été validé ! Présentez-vous à l'agence pour le pesage.");
            
            setClientForm({
                nomExpediteur: '', telExpediteur: '',
                nomDestinataire: '', telDestinataire: '',
                description: '', poidsKg: '', valeurEstimee: '', devise: 'FC', estFragile: false,
                type: 'COLIS', agenceId: '', trajetId: ''
            });
        } catch (error) {
            console.error("Erreur lors de la création de la demande", error);
            setMessage("Une erreur est survenue lors de l'enregistrement de votre demande.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
            {/* Header Client */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight flex items-center justify-center gap-3">
                    <FaBox className="text-indigo-600" /> Espace Expéditions GariConnect
                </h1>
                <p className="text-sm text-slate-500 mt-2">Suivez vos convois en temps réel ou gérez vos réceptions</p>
            </div>

            {/* Onglets de Navigation */}
            <div className="flex bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm mb-8 max-w-xl mx-auto">
                <button 
                    onClick={() => setActiveTab('suivi')}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'suivi' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                    <FaSearch className="inline mr-1.5" /> Suivre un Colis
                </button>
                <button 
                    onClick={() => setActiveTab('historique')}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'historique' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                    <FaHistory className="inline mr-1.5" /> Mes Colis (Hub)
                </button>
                <button 
                    onClick={() => setActiveTab('demande')}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'demande' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                    <FaPaperPlane className="inline mr-1.5" /> Pré-enregistrer
                </button>
            </div>

            {message && <p className="mb-4 text-sm font-semibold text-rose-500 text-center bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl">{message}</p>}
            {successMessage && <p className="mb-4 text-sm font-semibold text-emerald-500 text-center bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl">{successMessage}</p>}

            {/* CONTENU ONGLET : SUIVI DE COLIS RAPIDE */}
            {activeTab === 'suivi' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <form onSubmit={handleSuivi} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-2">Entrez votre code de retrait secret :</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Ex: 4A7B2C8E" 
                                    className="flex-1 px-4 py-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm font-mono uppercase focus:border-indigo-500 tracking-wider"
                                    value={codeRetrait}
                                    onChange={e => setCodeRetrait(e.target.value)}
                                    required
                                    />
                                <button type="submit" disabled={loading} className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                                    {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Rechercher
                                </button>
                            </div>
                        </div>
                    </form>

                    {suiviResult && <StatusCard result={suiviResult} />}
                </div>
            )}

            {/* CONTENU ONGLET : HUB HISTORIQUE AUTOMATIQUE */}
            {activeTab === 'historique' && (
                <div className="space-y-4">
                    {loadingHistory ? (
                        <div className="flex justify-center items-center py-12">
                            <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
                        </div>
                    ) : mesColis.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 rounded-3xl text-center text-slate-400 text-sm">
                            <FaBox className="mx-auto mb-3 text-slate-300" size={32} />
                            Aucun colis trouvé lié à votre compte ou à votre numéro de téléphone.
                        </div>
                    ) : (
                        mesColis.map((colis) => (
                            <div key={colis.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-50 dark:border-slate-800 pb-3 gap-2">
                                    <div>
                                        <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 px-2.5 py-1 rounded-md font-bold font-mono mr-2">Code: {colis.codeRetrait}</span>
                                        <span className="text-xs text-slate-400">Envoyé le {new Date(colis.dateEnvoi).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded-full font-black self-start sm:self-auto ${
                                        colis.statut === 'ARRIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                        colis.statut === 'EN_ROUTE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {colis.statut}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold">Détails fret & Description :</p>
                                        <p className="font-semibold">{colis.description} ({colis.type})</p>
                                        <div className="flex gap-4 text-xs text-slate-400 mt-1">
                                            <span>Poids : {colis.poidsKg ? `${colis.poidsKg} kg` : 'N/A'}</span>
                                            {colis.valeurEstimee && (
                                                <span className="font-medium text-slate-500 dark:text-slate-300">
                                                    Valeur : {colis.valeurEstimee.toLocaleString()} {colis.devise || 'FC'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 border-l border-slate-50 dark:border-slate-800 pl-0 md:pl-4">
                                        <div>
                                            <span className="text-[11px] text-slate-400 block font-bold">Expéditeur</span>
                                            <span className="font-medium block truncate">{colis.nomExpediteur}</span>
                                            <span className="text-xs font-mono text-slate-400">{colis.telExpediteur}</span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-slate-400 block font-bold">Destinataire</span>
                                            <span className="font-medium block truncate">{colis.nomDestinataire}</span>
                                            <span className="text-xs font-mono text-slate-400">{colis.telDestinataire}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* CONTENU ONGLET : DEMANDE / PRE-ENREGISTREMENT */}
            {activeTab === 'demande' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <div className="flex gap-2 items-start text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl font-medium mb-6">
                        <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                        <span>Les estimations fournies restent soumises à la validation finale de l'agent lors du pesage et contrôle physique à l'agence de transport.</span>
                    </div>

                    <form onSubmit={handleCreateDemande} className="space-y-4">
                        
                        {/* Section de Sélection d'Agence (Tenant) & Trajet Rattaché */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                                    <FaBuilding className="text-indigo-500" /> Sélectionner une Agence *
                                </label>
                                <select 
                                    required 
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500"
                                    value={clientForm.agenceId} 
                                    onChange={e => setClientForm({...clientForm, agenceId: e.target.value})}
                                >
                                    <option value="">-- Choisir une agence --</option>
                                    {agences.map(a => (
                                        <option key={a.id} value={a.id}>{a.nom} ({a.ville})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                                    <FaRoute className="text-indigo-500" /> Trajet disponible *
                                </label>
                                <select 
                                    required 
                                    disabled={!clientForm.agenceId || loadingTrajets}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500 disabled:opacity-50"
                                    value={clientForm.trajetId} 
                                    onChange={e => setClientForm({...clientForm, trajetId: e.target.value})}
                                >
                                    <option value="">
                                        {loadingTrajets ? "Chargement des trajets..." : "-- Sélectionner le trajet --"}
                                    </option>
                                    {trajets.map(t => {
                                        // Détermination sécurisée des propriétés venant de Spring Boot
                                        const depart = t.lieuDepart || t.villeDepart || t.depart || 'Inconnu';
                                        const destination = t.lieuDestination || t.villeDestination || t.destination || 'Inconnu';
                                        const convoyeur = t.nomConvoyeur || t.convoyeur || 'Standard';

                                        return (
                                            <option key={t.id} value={t.id}>
                                                {depart} → {destination} ({convoyeur})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">Nom Expéditeur *</label>
                                <input type="text" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500" value={clientForm.nomExpediteur} onChange={e => setClientForm({...clientForm, nomExpediteur: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">Téléphone Expéditeur *</label>
                                <input type="tel" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500" value={clientForm.telExpediteur} onChange={e => setClientForm({...clientForm, telExpediteur: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">Nom Destinataire *</label>
                                <input type="text" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500" value={clientForm.nomDestinataire} onChange={e => setClientForm({...clientForm, nomDestinataire: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">Téléphone Destinataire *</label>
                                <input type="tel" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500" value={clientForm.telDestinataire} onChange={e => setClientForm({...clientForm, telDestinataire: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-400 block mb-1">Description du contenu *</label>
                                <input type="text" required placeholder="Ex: Cartons de vêtements, pièces mécaniques..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500" value={clientForm.description} onChange={e => setClientForm({...clientForm, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">Type d'envoi</label>
                                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500" value={clientForm.type} onChange={e => setClientForm({...clientForm, type: e.target.value})}>
                                    <option value="COLIS">Colis / Marchandise</option>
                                    <option value="COURRIER">Courrier / Document</option>
                                </select>
                            </div>
                        </div>

                        {/* Zone Multi-Devises */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <div className="sm:col-span-1">
                                <label className="text-xs font-bold text-slate-400 block mb-1">Poids approximatif (Kg)</label>
                                <input type="number" step="0.1" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500" value={clientForm.poidsKg} onChange={e => setClientForm({...clientForm, poidsKg: e.target.value})} />
                            </div>
                            <div className="sm:col-span-1">
                                <label className="text-xs font-bold text-slate-400 block mb-1">Valeur estimée</label>
                                <div className="relative">
                                    <input type="number" className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-sm focus:border-indigo-500" value={clientForm.valeurEstimee} onChange={e => setClientForm({...clientForm, valeurEstimee: e.target.value})} placeholder="0.00" />
                                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">{clientForm.devise}</span>
                                </div>
                            </div>
                            <div className="sm:col-span-1">
                                <label className="text-xs font-bold text-slate-400 block mb-1">Devise de l'estimation</label>
                                <div className="relative flex bg-slate-100 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setClientForm({...clientForm, devise: 'FC'})}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${clientForm.devise === 'FC' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                                    >
                                        FC
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setClientForm({...clientForm, devise: 'USD'})}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${clientForm.devise === 'USD' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                                    >
                                        USD
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="fragile" className="rounded text-indigo-600 focus:ring-indigo-500" checked={clientForm.estFragile} onChange={e => setClientForm({...clientForm, estFragile: e.target.checked})} />
                            <label htmlFor="fragile" className="text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none">Ce colis contient des éléments fragiles</label>
                        </div>

                        <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                            {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />} Soumettre la pré-demande
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

// Sous-composant isolé pour afficher le Stepper de suivi visuel
const StatusCard = ({ result }) => {
    return (
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
                <div>
                    <span className="text-xs font-bold text-slate-400 block">Description du fret</span>
                    <span className="font-bold text-sm">{result.description}</span>
                </div>
                <div className="text-sm font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 px-3 py-1 rounded-lg flex items-center gap-1.5">
                    <FaMoneyBillWave className="text-indigo-500" />
                    {result.prix ? `${result.prix.toLocaleString()} ${result.devise || 'FC'}` : 'Calcul en cours'}
                </div>
            </div>

            {/* Stepper Visuel */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 pt-4">
                <div className="absolute left-4 md:left-0 md:top-5 w-0.5 md:w-full h-full md:h-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>

                {/* Étape 1 : En attente */}
                <div className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${result.statut === 'EN_ATTENTE' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'}`}><FaBox size={14}/></div>
                    <div>
                        <span className="text-xs font-bold block">Déposé à l'Agence</span>
                        <span className="text-[10px] text-slate-400">En attente de transit</span>
                    </div>
                </div>

                {/* Étape 2 : En route */}
                <div className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${result.statut === 'EN_ROUTE' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'}`}><FaRoute size={14}/></div>
                    <div>
                        <span className="text-xs font-bold block">En Transit</span>
                        <span className="text-[10px] text-slate-400">Le convoi est en route</span>
                    </div>
                </div>

                {/* Étape 3 : Arrivé */}
                <div className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${result.statut === 'ARRIVE' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'}`}><FaCheckCircle size={14}/></div>
                    <div>
                        <span className="text-xs font-bold block">Prêt pour Retrait</span>
                        <span className="text-[10px] text-slate-400">Disponible à destination</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientCourrierHub;
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { 
    FaSync, FaExclamationTriangle, FaCheckCircle, 
    FaMoneyBillWave, FaTimes, FaBook, FaArrowUp, 
    FaArrowDown, FaPlus, FaWallet, FaBuilding, FaSearch,
    FaPrint
} from 'react-icons/fa';

const DashboardFinancierAdmin = () => {
    // Éléments de navigation par onglet
    const [activeTab, setActiveTab] = useState('commissions'); // 'commissions' ou 'caisse'

    // États financiers globaux
    const [stats, setStats] = useState({
        volumeAffairesTotal: 0,
        revenusGariConnectNet: 0,
        soldeCaisseActuel: 0,
        billetsConfirmes: 0
    });

    // États pour le suivi des agences
    const [detailsAgences, setDetailsAgences] = useState([]);
    
    // États pour le Livre de Caisse Superadmin
    const [livreCaisse, setLivreCaisse] = useState([]);
    const [filtreCaisse, setFiltreCaisse] = useState('TOUS'); // 'TOUS', 'ENTREE', 'SORTIE'
    const [filtreMoisAnnee, setFiltreMoisAnnee] = useState(''); // Format: YYYY-MM

    // États structurels de l'application
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Modals : 1. Règlement d'une agence | 2. Nouvelle écriture manuelle en caisse
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAgence, setSelectedAgence] = useState(null);
    const [montantSaisi, setMontantSaisi] = useState("");

    const [isCaisseModalOpen, setIsCaisseModalOpen] = useState(false);
    const [nouvelleEcriture, setNouvelleEcriture] = useState({
        libelle: '',
        montant: '',
        type: 'ENTREE', // 'ENTREE' (Recette) ou 'SORTIE' (Dépense)
        devise: 'CDF' // 'CDF' ou 'USD'
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Appels simultanés sur les routes financières globales de l'admin
            const [resStats, resCommissions, resCaisse] = await Promise.all([
                api.get('/admin/finances/stats-globales'),
                api.get('/admin/finances/resume-commissions'),
                api.get('/admin/finances/livre-caisse')
            ]);

            setStats({
                volumeAffairesTotal: resStats.data.volumeAffairesTotal || 0,
                revenusGariConnectNet: resStats.data.revenusGariConnectNet || 0,
                soldeCaisseActuel: resCaisse.data.soldeActuel || 0,
                billetsConfirmes: resStats.data.billetsConfirmes || 0
            });
            
            setDetailsAgences(resCommissions.data || []);
            setLivreCaisse(resCaisse.data.ecritures || []);
        } catch (err) {
            console.error("Erreur de synchronisation financière globale", err);
            setToast({ show: true, message: "Erreur lors de la synchronisation des flux", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIQUE DE RÈGLEMENT AGENCE ---
    const openReglementModal = (agence) => {
        setSelectedAgence(agence);
        setMontantSaisi(agence.commissionNet || 0);
        setIsModalOpen(true);
    };

    const handleValiderReglement = async () => {
        const montantNet = parseFloat(montantSaisi);
        if (!montantSaisi || isNaN(montantNet) || montantNet <= 0) {
            setToast({ show: true, message: "Montant saisi invalide", type: "error" });
            return;
        }

        try {
            setProcessing(true);
            const payload = {
                montant: montantNet,
                agence: selectedAgence.partenaire 
            };

            await api.post('/admin/finances/regler', payload);

            setIsModalOpen(false);
            setToast({ 
                show: true, 
                message: `Succès : ${montantNet.toLocaleString()} FC encaissés de ${selectedAgence.partenaire}`, 
                type: "success" 
            });
            
            await fetchData(); 
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de l'encaissement de la commission";
            setToast({ show: true, message: errorMsg, type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    // --- LOGIQUE DE CAISSE MANUELLE (LIVRE DE CAISSE SUPERADMIN) ---
    const handleAjouterEcritureCaisse = async (e) => {
        e.preventDefault();
        const mt = parseFloat(nouvelleEcriture.montant);
        if (!nouvelleEcriture.libelle || isNaN(mt) || mt <= 0) {
            setToast({ show: true, message: "Informations d'écriture incomplètes ou invalides", type: "error" });
            return;
        }

        try {
            setProcessing(true);
            // Soumission de la nouvelle ligne de flux comptable propre à l'admin avec la devise choisie
            await api.post('/admin/finances/livre-caisse/ecriture', {
                libelle: nouvelleEcriture.libelle,
                montant: mt,
                type: nouvelleEcriture.type,
                devise: nouvelleEcriture.devise
            });

            setIsCaisseModalOpen(false);
            setNouvelleEcriture({ libelle: '', montant: '', type: 'ENTREE', devise: 'CDF' });
            setToast({ show: true, message: "Opération comptable enregistrée avec succès", type: "success" });
            
            await fetchData();
        } catch (err) {
            setToast({ show: true, message: "Impossible d'ajouter l'écriture comptable", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    // Action d'impression native
    const handlePrintLivreCaisse = () => {
        window.print();
    };

    // Filtrage dynamique des lignes du livre de caisse (Type + Mois/Année)
    const lignesCaisseFiltrees = livreCaisse.filter(ligne => {
        // 1. Filtre par type (Entrée/Sortie)
        const respecteType = filtreCaisse === 'TOUS' || ligne.type === filtreCaisse;
        
        // 2. Filtre par Mois et Année
        let respecteDate = true;
        if (filtreMoisAnnee) {
            const dateObj = new Date(ligne.dateCreation || ligne.date);
            const anneeMoisLigne = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            respecteDate = anneeMoisLigne === filtreMoisAnnee;
        }

        return respecteType && respecteDate;
    });

    if (loading && detailsAgences.length === 0) return (
        <div className="h-[60vh] flex flex-col justify-center items-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Calcul des flux en temps réel...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative pb-20">
            
            {/* TOAST SYSTEM */}
            {toast.show && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-8 py-4 rounded-3xl shadow-2xl border animate-in slide-in-from-top-10 print:hidden ${
                    toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                    {toast.type === "success" ? <FaCheckCircle className="text-lg" /> : <FaExclamationTriangle className="text-lg" />}
                    <p className="font-black uppercase text-[10px] tracking-widest">{toast.message}</p>
                </div>
            )}

            {/* HEADER ET SWITCHER D'ONGLETS */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 print:mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        Trésorerie <span className="text-blue-600">Globale</span>
                    </h1>
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">
                        Livre de caisse et pilotage des revenus SaaS / Commissions
                    </p>
                </div>
                
                <div className="flex items-center gap-4 w-full lg:w-auto print:hidden">
                    {/* Navigation inter-modules */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center flex-1 lg:flex-none">
                        <button 
                            onClick={() => setActiveTab('commissions')}
                            className={`flex-1 lg:w-48 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'commissions' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <FaBuilding /> Partenaires
                        </button>
                        <button 
                            onClick={() => setActiveTab('caisse')}
                            className={`flex-1 lg:w-48 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'caisse' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <FaBook /> Livre de Caisse
                        </button>
                    </div>

                    <button onClick={fetchData} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all shadow-sm">
                        <FaSync className={loading ? "animate-spin text-blue-600" : "text-slate-600"} />
                    </button>
                </div>
            </div>

            {/* VUE DES CARTES FINANCIÈRES (KPI DYNAMIQUE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume d'Affaires Global</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white italic">
                        {Number(stats.volumeAffairesTotal).toLocaleString()} <span className="text-xs font-bold text-blue-600">FC</span>
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Revenus Commissions Attendus</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white italic">
                        {Number(stats.revenusGariConnectNet).toLocaleString()} <span className="text-xs font-bold text-blue-500">FC</span>
                    </p>
                </div>

                <div className="bg-slate-950 p-6 rounded-[2.5rem] shadow-xl ring-4 ring-blue-600/10">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FaWallet/> Solde Réel en Caisse</p>
                    <p className="text-2xl font-black text-white italic">
                        {Number(stats.soldeCaisseActuel).toLocaleString()} <span className="text-xs font-bold text-emerald-400">FC</span>
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Billets Validés</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white italic">
                        {stats.billetsConfirmes} <span className="text-xs font-bold text-slate-400">Tickets</span>
                    </p>
                </div>
            </div>

            {/* --- CONTENU DE L'ONGLET 1 : COMMISSIONS PARTENAIRES --- */}
            {activeTab === 'commissions' && (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Situation par Agence</h3>
                            <p className="text-xs text-slate-400 font-bold">Suivi des encaissements et dettes des agences connectées au réseau SaaS</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-5 px-8">Agence Partenaire</th>
                                    <th className="py-5 px-6">Volume généré</th>
                                    <th className="py-5 px-6">Taux moy.</th>
                                    <th className="py-5 px-6">Commission Due</th>
                                    <th className="py-5 px-8 text-right print:hidden">Action Comptable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-bold text-slate-700 dark:text-slate-300">
                                {detailsAgences.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-400 italic">Aucun flux financier disponible pour les agences.</td>
                                    </tr>
                                ) : (
                                    detailsAgences.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-all">
                                            <td className="py-5 px-8 font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{row.partenaire}</td>
                                            <td className="py-5 px-6">{Number(row.volumeAffaires).toLocaleString()} FC</td>
                                            <td className="py-5 px-6 text-blue-600">{row.tauxCommission || 10}%</td>
                                            <td className="py-5 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black ${row.commissionNet > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'}`}>
                                                    {Number(row.commissionNet).toLocaleString()} FC
                                                </span>
                                            </td>
                                            <td className="py-5 px-8 text-right print:hidden">
                                                <button 
                                                    onClick={() => openReglementModal(row)}
                                                    disabled={row.commissionNet <= 0}
                                                    className="px-5 py-2.5 bg-slate-900 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                                >
                                                    Encaisser flux
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- CONTENU DE L'ONGLET 2 : LIVRE DE CAISSE SUPERADMIN --- */}
            {activeTab === 'caisse' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    
                    {/* BARRE DE CONTRÔLE ET FILTRES DU LIVRE DE CAISSE */}
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm print:hidden">
                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                            {/* Type de Flux */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                {['TOUS', 'ENTREE', 'SORTIE'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFiltreCaisse(type)}
                                        className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${filtreCaisse === type ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type === 'TOUS' ? 'Tout voir' : type === 'ENTREE' ? 'Recettes' : 'Dépenses'}
                                    </button>
                                ))}
                            </div>

                            {/* Filtre Temporel Mois/Année */}
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Mois :</label>
                                <input 
                                    type="month" 
                                    value={filtreMoisAnnee}
                                    onChange={(e) => setFiltreMoisAnnee(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-white outline-none cursor-pointer"
                                />
                                {filtreMoisAnnee && (
                                    <button 
                                        onClick={() => setFiltreMoisAnnee('')}
                                        className="text-[10px] text-rose-500 font-bold ml-1 hover:text-rose-600 uppercase tracking-tighter"
                                    >
                                        Effacer
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            {/* Bouton d'impression */}
                            <button
                                onClick={handlePrintLivreCaisse}
                                className="flex-1 lg:flex-none px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                <FaPrint /> Imprimer journal
                            </button>

                            {/* Passer une écriture */}
                            <button
                                onClick={() => setIsCaisseModalOpen(true)}
                                className="flex-1 lg:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 active:scale-95"
                            >
                                <FaPlus /> Passer une écriture
                            </button>
                        </div>
                    </div>

                    {/* TABLEAU DES OPÉRATIONS DE CAISSE CENTRALES */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-5 px-8">Date d'opération</th>
                                        <th className="py-5 px-6">Libellé de la pièce</th>
                                        <th className="py-5 px-6 text-center">Type de flux</th>
                                        <th className="py-5 px-6 text-right">Montant</th>
                                        <th className="py-5 px-8 text-right">Solde Comptable</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {lignesCaisseFiltrees.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-12 text-slate-400 italic">Aucune transaction enregistrée dans le livre de caisse principal.</td>
                                        </tr>
                                    ) : (
                                        lignesCaisseFiltrees.map((ligne, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-all">
                                                <td className="py-5 px-8 text-xs font-mono text-slate-400">
                                                    {new Date(ligne.dateCreation || ligne.date).toLocaleString('fr-FR')}
                                                </td>
                                                <td className="py-5 px-6 font-black text-slate-900 dark:text-white">{ligne.libelle}</td>
                                                <td className="py-5 px-6 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${ligne.type === 'ENTREE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                                                        {ligne.type === 'ENTREE' ? <FaArrowDown size={8}/> : <FaArrowUp size={8}/>}
                                                        {ligne.type === 'ENTREE' ? 'Recette' : 'Dépense'}
                                                    </span>
                                                </td>
                                                <td className={`py-5 px-6 text-right font-black ${ligne.type === 'ENTREE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {ligne.type === 'ENTREE' ? '+' : '-'} {Number(ligne.montant).toLocaleString()} <span className="text-[10px] font-black">{ligne.devise || 'CDF'}</span>
                                                </td>
                                                <td className="py-5 px-8 text-right font-mono text-slate-600 dark:text-slate-400">
                                                    {Number(ligne.soldeCalculer || ligne.solde).toLocaleString()} <span className="text-[10px] font-bold text-slate-400">{ligne.devise || 'CDF'}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 1 : ENCAISSEMENT DES COMMISSIONS DE L'AGENCE --- */}
            {isModalOpen && selectedAgence && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 print:hidden">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl p-8 relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all">
                            <FaTimes />
                        </button>

                        <div className="mb-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
                                <FaMoneyBillWave />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Règlement de flux</h3>
                                <p className="text-xs text-slate-400 font-bold">Perception des commissions dues par {selectedAgence.partenaire}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Montant perçu (FC)</label>
                                <input 
                                    type="number"
                                    value={montantSaisi}
                                    onChange={(e) => setMontantSaisi(e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-black text-lg text-slate-900 dark:text-white transition-all shadow-inner"
                                    placeholder="Ex: 150000"
                                />
                            </div>

                            <button 
                                onClick={handleValiderReglement}
                                disabled={processing}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-3 active:scale-95"
                            >
                                {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Confirmer la réception"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2 : PASSER UNE ÉCRITURE MANUELLE DANS LE LIVRE DE CAISSE --- */}
            {isCaisseModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 print:hidden">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsCaisseModalOpen(false)}></div>
                    <form onSubmit={handleAjouterEcritureCaisse} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl p-8 relative z-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <button type="button" onClick={() => setIsCaisseModalOpen(false)} className="absolute top-6 right-6 p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all">
                            <FaTimes />
                        </button>

                        <div className="mb-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
                                <FaBook />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Flux Comptable Admin</h3>
                                <p className="text-xs text-slate-400 font-bold">Ajouter une entrée ou sortie manuelle sur la caisse principale</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Choix Nature du Flux */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nature du flux</label>
                                <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
                                    <button 
                                        type="button"
                                        onClick={() => setNouvelleEcriture({...nouvelleEcriture, type: 'ENTREE'})}
                                        className={`py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${nouvelleEcriture.type === 'ENTREE' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                                    >
                                        Recette (+)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setNouvelleEcriture({...nouvelleEcriture, type: 'SORTIE'})}
                                        className={`py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${nouvelleEcriture.type === 'SORTIE' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
                                    >
                                        Dépense (-)
                                    </button>
                                </div>
                            </div>

                            {/* Choix de la Devise */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Devise cible</label>
                                <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
                                    <button 
                                        type="button"
                                        onClick={() => setNouvelleEcriture({...nouvelleEcriture, devise: 'CDF'})}
                                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${nouvelleEcriture.devise === 'CDF' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                                    >
                                        Franc Congolais (CDF)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setNouvelleEcriture({...nouvelleEcriture, devise: 'USD'})}
                                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${nouvelleEcriture.devise === 'USD' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                                    >
                                        Dollar Américain (USD)
                                    </button>
                                </div>
                            </div>

                            {/* Libellé de l'opération */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Libellé / Motif de la pièce</label>
                                <input 
                                    type="text"
                                    required
                                    value={nouvelleEcriture.libelle}
                                    onChange={(e) => setNouvelleEcriture({...nouvelleEcriture, libelle: e.target.value})}
                                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-bold text-sm text-slate-900 dark:text-white transition-all shadow-inner"
                                    placeholder="Ex: Retrait frais d'hébergement serveur Render ou Supabase"
                                />
                            </div>

                            {/* Montant avec indicateur de devise dynamique */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Montant de l'écriture</label>
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">Devise : {nouvelleEcriture.devise}</span>
                                </div>
                                <input 
                                    type="number"
                                    required
                                    value={nouvelleEcriture.montant}
                                    onChange={(e) => setNouvelleEcriture({...nouvelleEcriture, montant: e.target.value})}
                                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 font-black text-lg text-slate-900 dark:text-white transition-all shadow-inner"
                                    placeholder="0"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={processing}
                                className="w-full py-4 bg-slate-900 dark:bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
                            >
                                {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Inscrire au livre de caisse"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default DashboardFinancierAdmin;
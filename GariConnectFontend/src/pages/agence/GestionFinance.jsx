import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { 
    PlusCircle, Wallet, FileText, Printer, Filter, X, Search, CalendarX2
} from 'lucide-react';

const GestionFinance = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [nomAgence, setNomAgence] = useState("Chargement..."); 
    
    // Par défaut on affiche le mois en cours (Format: YYYY-MM)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        typeTransaction: 'ENTREE',
        description: '',
        devise: 'CDF', // CDF par défaut
        montant: '',
        entite: '',
        documentRef: ''
    });

    useEffect(() => {
        fetchLivreDeCaisse();
        fetchInfosAgence();
    }, []);

    const fetchInfosAgence = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/agences/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNomAgence(response.data.nom || "AGENCE"); 
        } catch (error) {
            console.error("Erreur lors de la récupération du profil agence", error);
            setNomAgence("AGENCE"); 
        }
    };

    // 🛡️ Formatage ultra-robuste des dates provenant du backend
    const formatBackendDate = (dateVal) => {
        if (!dateVal) return "";
        
        // Cas 1 : Spring Boot renvoie la date sous forme de tableau [2026, 7, 15]
        if (Array.isArray(dateVal)) {
            const [year, month, day] = dateVal;
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        // Cas 2 : Chaîne ISO (ex: "2026-07-15T18:20:33.000Z")
        if (typeof dateVal === 'string') {
            if (dateVal.includes('T')) {
                return dateVal.split('T')[0];
            }
            // Cas 3 : Format DD-MM-YYYY ou DD/MM/YYYY -> Conversion en YYYY-MM-DD
            const regex = /^(\d{2})[-/](\d{2})[-/](\d{4})$/;
            const match = dateVal.match(regex);
            if (match) {
                const [, day, month, year] = match;
                return `${year}-${month}-${day}`;
            }
            return dateVal; // Déjà au format YYYY-MM-DD
        }
        return String(dateVal);
    };

    const fetchLivreDeCaisse = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/finance/livre-de-caisse', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Sécurité : s'assurer que les données reçues forment bien un tableau
            const dataReceived = Array.isArray(response.data) ? response.data : [];
            
            // Formatage immédiat à la réception
            const formattedData = dataReceived.map(t => ({
                ...t,
                date: formatBackendDate(t.date)
            }));
            
            setTransactions(formattedData);
        } catch (error) {
            console.error("Erreur de chargement du livre de caisse", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    // 🔍 Filtrage Dynamique local
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Si selectedMonth est vide (bouton "Tout voir"), on laisse passer toutes les dates
            const matchMonth = selectedMonth ? (t.date && t.date.startsWith(selectedMonth)) : true;
            
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = (t.description?.toLowerCase().includes(searchLower)) || 
                                (t.entite?.toLowerCase().includes(searchLower)) ||
                                (t.documentRef?.toLowerCase().includes(searchLower));
            
            return matchMonth && (searchTerm === '' || matchSearch);
        });
    }, [transactions, selectedMonth, searchTerm]);

    // 💰 Solde de la période filtrée (Le dernier solde calculé de la liste filtrée)
    const periodBalance = useMemo(() => {
        if (filteredTransactions.length === 0) {
            return { soldeUSD: 0, soldeCDF: 0 };
        }
        return filteredTransactions[filteredTransactions.length - 1];
    }, [filteredTransactions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { 
                ...formData, 
                montant: parseFloat(formData.montant) 
            };
            
            await api.post('/finance/transactions', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowForm(false);
            // Réinitialiser les champs tout en gardant la date et la devise pour l'UX
            setFormData({ 
                ...formData, 
                description: '', 
                montant: '', 
                entite: '', 
                documentRef: '' 
            });
            fetchLivreDeCaisse(); // Recharger le tableau
        } catch (error) {
            console.error("Erreur lors de la création de la transaction", error);
            const errorMsg = error.response?.data?.message || error.message || "Erreur inconnue";
            alert(`Erreur lors de l'enregistrement manuel : ${errorMsg}`);
        }
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-300">
            <style>
                {`
                    @media print {
                        @page { size: landscape; margin: 10mm; }
                        .no-print { display: none !important; }
                        .print-only { display: block !important; }
                        body { background: white !important; padding: 0 !important; color: black !important; }
                        .printable-area { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; background: white !important; }
                        table { width: 100%; border-collapse: collapse !important; margin-top: 10px; }
                        th { border: 1.5px solid black !important; padding: 6px !important; font-size: 9px !important; text-transform: uppercase; font-weight: bold !important; color: black !important; }
                        td { border: 1px solid black !important; padding: 4px 6px !important; font-size: 10px !important; color: black !important; }
                        .print-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
                        .agency-title { color: #003399 !important; font-size: 18px !important; font-weight: 900 !important; text-transform: uppercase; }
                        .doc-title { font-size: 12px !important; font-weight: 800 !important; text-transform: uppercase; margin-top: 2px; }
                        .meta-info { font-size: 9px !important; text-align: right; font-weight: bold; color: black !important; }
                        .signature-section { margin-top: 40px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                        .sig-box { border-top: 1.5px solid black; padding-top: 5px; text-align: center; font-size: 9px; font-weight: bold; text-transform: uppercase; }
                    }
                    .print-only { display: none; }
                `}
            </style>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 no-print">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200 dark:shadow-none">
                            <Wallet className="text-white" size={24} />
                        </div>
                        {nomAgence} Finance
                    </h1>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 lg:flex-none">
                        <Filter size={18} className="text-slate-400" />
                        <input 
                            type="month" 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)} 
                            className="border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent w-full cursor-pointer" 
                        />
                        {selectedMonth && (
                            <button onClick={() => setSelectedMonth('')} className="text-rose-500 hover:text-rose-700 transition-colors" title="Voir tout l'historique">
                                <CalendarX2 size={16} />
                            </button>
                        )}
                    </div>
                    <button onClick={() => window.print()} className="bg-blue-600 text-white p-2.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex-1 lg:flex-none">
                        <Printer size={18} /> <span>Imprimer</span>
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-2.5 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all flex-1 lg:flex-none">
                        <PlusCircle size={18} /> <span>Opération Manuelle</span>
                    </button>
                </div>
            </div>

            {/* Formulaire manuel */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 mb-8 animate-in slide-in-from-top-4 no-print">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase">Nouvelle Opération</h3>
                        <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                            <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                            <select value={formData.typeTransaction} onChange={(e) => setFormData({...formData, typeTransaction: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold">
                                <option value="ENTREE" className="text-emerald-600 font-bold">Entrée (+)</option>
                                <option value="SORTIE" className="text-rose-600 font-bold">Sortie (-)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Montant</label>
                            <div className="flex gap-2">
                                <input type="number" step="0.01" required value={formData.montant} onChange={(e) => setFormData({...formData, montant: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black" placeholder="0.00" />
                                <select value={formData.devise} onChange={(e) => setFormData({...formData, devise: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold w-24">
                                    <option value="CDF">CDF</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Description / Libellé</label>
                            <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" placeholder="Ex: Paiement facture internet..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Entité concernée</label>
                            <input type="text" required value={formData.entite} onChange={(e) => setFormData({...formData, entite: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" placeholder="Nom du client/fournisseur" />
                        </div>
                    </div>
                    <button type="submit" className="mt-6 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-200 flex justify-center items-center gap-2 transition-all">
                        <PlusCircle size={20}/> VALIDER L'OPÉRATION
                    </button>
                </form>
            )}

            {/* Tableau principal */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden printable-area">
                <div className="print-only">
                    <div className="print-header">
                        <div>
                            <div className="agency-title">{nomAgence}</div>
                            <div className="doc-title">Livre de Caisse - Global</div>
                        </div>
                        <div className="meta-info">
                            <div>Édité le : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</div>
                            <div>Période : {selectedMonth || 'Toutes les dates'}</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                    <h2 className="text-lg font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" /> Relevé des opérations
                    </h2>
                    
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase">Libellé</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase">Entité</th>
                                <th className="px-6 py-4 text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase text-right">Entrées</th>
                                <th className="px-6 py-4 text-xs font-black text-rose-600 dark:text-rose-500 uppercase text-right">Sorties</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-600 dark:text-blue-500 uppercase text-right">Solde USD</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-600 dark:text-blue-500 uppercase text-right">Solde CDF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-slate-400 font-bold">
                                        Chargement des données financières...
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-slate-400 font-bold">
                                        Aucune transaction pour cette période.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t, idx) => (
                                    <tr key={t.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.date}</td>
                                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                            {t.description}
                                            {t.documentRef && <span className="block text-[10px] text-slate-400 font-mono mt-1">Ref: {t.documentRef}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{t.entite || '-'}</td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                                            {t.entree && t.entree > 0 ? `${t.entree.toLocaleString('fr-FR')} ${t.devise || ''}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-rose-500 dark:text-rose-400">
                                            {t.sortie && t.sortie > 0 ? `${t.sortie.toLocaleString('fr-FR')} ${t.devise || ''}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/30">
                                            ${t.soldeUSD?.toLocaleString('fr-FR') || '0'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/30">
                                            {t.soldeCDF?.toLocaleString('fr-FR') || '0'} FC
                                        </td>
                                    </tr>
                                ))
                            )}
                            {/* Ligne des Totaux de la Période */}
                            <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-800">
                                <td colSpan="3" className="px-6 py-4 font-black uppercase text-blue-800 dark:text-blue-300 text-right">
                                    Solde Final de la Période
                                </td>
                                <td className="px-6 py-4 text-right font-black text-emerald-600"></td>
                                <td className="px-6 py-4 text-right font-black text-rose-600"></td>
                                <td className="px-6 py-4 text-right font-black text-blue-700 dark:text-blue-300 text-base">
                                    ${periodBalance?.soldeUSD?.toLocaleString('fr-FR') || '0'}
                                </td>
                                <td className="px-6 py-4 text-right font-black text-blue-700 dark:text-blue-300 text-base">
                                    {periodBalance?.soldeCDF?.toLocaleString('fr-FR') || '0'} FC
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Section Signatures visible uniquement à l'impression */}
                <div className="print-only signature-section">
                    <div className="sig-box">Vérifié par (Comptabilité)</div>
                    <div className="sig-box">Validé par (Gérant)</div>
                    <div className="sig-box">Approuvé par (Direction)</div>
                </div>
            </div>
        </div>
    );
};

export default GestionFinance;
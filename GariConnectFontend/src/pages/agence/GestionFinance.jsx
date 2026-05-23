import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    PlusCircle, Wallet, FileText, Printer, Filter, X, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

const GestionFinance = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [nomAgence, setNomAgence] = useState("Chargement..."); 
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        typeTransaction: 'ENTREE',
        description: '',
        devise: 'USD',
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
            const response = await axios.get('http://localhost:8080/api/agence/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNomAgence(response.data.nom); 
        } catch (error) {
            console.error("Erreur nom agence", error);
            setNomAgence("AGENCE BENI"); 
        }
    };

    const fetchLivreDeCaisse = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token'); 
            const response = await axios.get('http://localhost:8080/api/finance/livre-de-caisse', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sortedData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
            setTransactions(sortedData);
        } catch (error) {
            console.error("Erreur de chargement", error);
        } finally {
            setLoading(false);
        }
    };

    const transactionsWithBalances = useMemo(() => {
        let runningBalanceUSD = 0;
        let runningBalanceCDF = 0;

        return transactions.map(t => {
            if (t.devise === 'USD') {
                runningBalanceUSD += (t.entree || 0) - (t.sortie || 0);
            } else if (t.devise === 'CDF') {
                runningBalanceCDF += (t.entree || 0) - (t.sortie || 0);
            }
            return {
                ...t,
                computedSoldeUSD: runningBalanceUSD,
                computedSoldeCDF: runningBalanceCDF
            };
        });
    }, [transactions]);

    const filteredTransactions = transactionsWithBalances.filter(t => t.date.startsWith(selectedMonth));

    const globalBalance = transactionsWithBalances.length > 0 
        ? transactionsWithBalances[transactionsWithBalances.length - 1] 
        : { computedSoldeUSD: 0, computedSoldeCDF: 0 };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { ...formData, montant: parseFloat(formData.montant) };

            await axios.post('http://localhost:8080/api/finance/transactions', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setShowForm(false);
            setFormData({ ...formData, description: '', montant: '', entite: '', documentRef: '' });
            fetchLivreDeCaisse();
        } catch (error) {
            alert("Erreur lors de l'enregistrement");
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
                        th { 
                            border: 1.5px solid black !important; 
                            padding: 6px !important; 
                            font-size: 9px !important; 
                            text-transform: uppercase;
                            font-weight: bold !important;
                            color: black !important;
                        }
                        td { 
                            border: 1px solid black !important; 
                            padding: 4px 6px !important; 
                            font-size: 10px !important; 
                            color: black !important;
                        }

                        .print-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
                        .agency-title { color: #003399 !important; font-size: 18px !important; font-weight: 900 !important; text-transform: uppercase; }
                        .doc-title { font-size: 12px !important; font-weight: 800 !important; text-transform: uppercase; margin-top: 2px; }
                        .meta-info { font-size: 9px !important; text-align: right; font-weight: bold; color: black !important; }
                        
                        .signature-section { 
                            margin-top: 40px; 
                            display: grid; 
                            grid-template-columns: repeat(3, 1fr); 
                            gap: 20px; 
                        }
                        .sig-box { border-top: 1.5px solid black; padding-top: 5px; text-align: center; font-size: 9px; font-weight: bold; text-transform: uppercase; }
                    }
                    .print-only { display: none; }
                `}
            </style>

            {/* --- INTERFACE ÉCRAN --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 no-print">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 dark:shadow-none shadow-lg">
                            <Wallet className="text-white" size={24} />
                        </div>
                        {nomAgence} Finance
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Livre de caisse numérique</p>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 lg:flex-none">
                        <Filter size={18} className="text-slate-400" />
                        <input 
                            type="month" 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent w-full"
                        />
                    </div>

                    <button onClick={() => window.print()} className="bg-blue-600 text-white p-2.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none flex-1 lg:flex-none">
                        <Printer size={18} /> <span>Imprimer</span>
                    </button>

                    <button onClick={() => { setShowForm(!showForm); }} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-2.5 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex-1 lg:flex-none">
                        <PlusCircle size={18} /> <span>Nouveau</span>
                    </button>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-8 no-print max-w-2xl">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Solde Total USD</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-blue-400">{globalBalance.computedSoldeUSD?.toLocaleString()} $</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Solde Total CDF</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-emerald-500">{globalBalance.computedSoldeCDF?.toLocaleString()} FC</p>
                </div>
            </div>

            {/* FORMULAIRE */}
            {showForm && (
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl mb-10 border border-blue-50 dark:border-slate-800 no-print transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <FileText size={22} className="text-blue-600" /> Nouvelle écriture de caisse
                        </h2>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase ml-2 text-slate-400">Date</label>
                            <input type="date" className="p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none border border-transparent focus:border-blue-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase ml-2 text-slate-400">Bénéficiaire / Entité</label>
                            <input type="text" placeholder="Ex: Client John, SNEL, etc." className="p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none border border-transparent focus:border-blue-500" value={formData.entite} onChange={e => setFormData({...formData, entite: e.target.value})} required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase ml-2 text-slate-400">Motif</label>
                            <input type="text" placeholder="Description de l'opération" className="p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none border border-transparent focus:border-blue-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                        </div>
                        <select className="p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none border border-transparent focus:border-blue-500 font-bold" value={formData.typeTransaction} onChange={e => setFormData({...formData, typeTransaction: e.target.value})}>
                            <option value="ENTREE">ENTRÉE (+)</option>
                            <option value="SORTIE">SORTIE (-)</option>
                        </select>
                        <input type="number" step="0.01" placeholder="Montant" className="p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none border border-transparent focus:border-blue-500" value={formData.montant} onChange={e => setFormData({...formData, montant: e.target.value})} required />
                        <select className="p-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none border border-transparent focus:border-blue-500 font-black" value={formData.devise} onChange={e => setFormData({...formData, devise: e.target.value})}>
                            <option value="USD">USD ($)</option>
                            <option value="CDF">CDF (FC)</option>
                        </select>
                        <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                            <button type="submit" className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95">
                                Enregistrer l'opération
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- SECTION D'IMPRESSION / TABLEAU --- */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden printable-area transition-colors">
                <div className="p-4 md:p-8">
                    
                    {/* Header Print */}
                    <div className="print-only">
                        <div className="print-header">
                            <div>
                                <h2 className="agency-title">{nomAgence}</h2>
                                <h3 className="doc-title text-black">Livre de caisse officiel</h3>
                                <p className="text-[8px] uppercase text-black">Beni, Nord-Kivu, RDC</p>
                            </div>
                            <div className="meta-info">
                                <p>Date d'édition: {new Date().toLocaleDateString('fr-FR')}</p>
                                <p>Mois de: {new Date(selectedMonth).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}</p>
                            </div>
                        </div>
                        <div className="w-full h-[1.5px] bg-black mb-4"></div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 no-print">
                                    <th className="px-4 py-4 text-center w-12 text-[10px] font-black uppercase text-slate-400">N°</th>
                                    <th className="px-4 py-4 text-center text-[10px] font-black uppercase text-slate-400">Date</th>
                                    <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400">Bénéficiaire</th>
                                    <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400">Motif</th>
                                    <th className="px-4 py-4 text-center text-[10px] font-black uppercase text-slate-400">Entrée</th>
                                    <th className="px-4 py-4 text-center text-[10px] font-black uppercase text-slate-400">Sortie</th>
                                    <th className="px-4 py-4 text-center text-[10px] font-black uppercase text-slate-400">Solde USD</th>
                                    <th className="px-4 py-4 text-center text-[10px] font-black uppercase text-slate-400">Solde CDF</th>
                                </tr>
                                {/* Header spécifique pour l'impression */}
                                <tr className="print-only">
                                    <th>N°</th>
                                    <th>Date</th>
                                    <th>Bénéficiaire</th>
                                    <th>Libellé / Motif</th>
                                    <th>Entrée</th>
                                    <th>Sortie</th>
                                    <th>Solde USD</th>
                                    <th>Solde CDF</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan="8" className="p-10 text-center font-bold text-slate-400 animate-pulse">Chargement des données financières...</td></tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr><td colSpan="8" className="p-10 text-center font-bold text-slate-400">Aucune transaction pour ce mois.</td></tr>
                                ) : filteredTransactions.map((t, i) => (
                                    <tr key={t.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-4 text-center font-bold text-slate-400">{i + 1}</td>
                                        <td className="px-4 py-4 text-center dark:text-slate-300">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-4 font-black uppercase text-slate-700 dark:text-slate-200">{t.entite}</td>
                                        <td className="px-4 py-4 text-slate-500 dark:text-slate-400 italic text-sm">{t.description}</td>
                                        <td className="px-4 py-4 text-center font-bold text-emerald-600">{t.entree > 0 ? t.entree.toLocaleString() : '-'}</td>
                                        <td className="px-4 py-4 text-center font-bold text-rose-500">{t.sortie > 0 ? t.sortie.toLocaleString() : '-'}</td>
                                        <td className="px-4 py-4 text-center font-black bg-slate-50/50 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400">{t.computedSoldeUSD.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-center font-black bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">{t.computedSoldeCDF.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Zone de Signatures (Impression) */}
                    <div className="print-only signature-section text-black">
                        <div className="sig-box">Chef d'Agence</div>
                        <div className="sig-box">Comptabilité</div>
                        <div className="sig-box">Audit / Contrôle</div>
                    </div>

                    {/* Footer Écran */}
                    <div className="no-print mt-8 flex justify-between items-center border-t border-slate-50 dark:border-slate-800 pt-6">
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2">
                               <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Entrées</span>
                           </div>
                           <div className="flex items-center gap-2">
                               <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Sorties</span>
                           </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Propulsé par GariConnect Finance v2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestionFinance;
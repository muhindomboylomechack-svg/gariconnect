import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api'; // Import de l'instance centralisée
import { 
    PlusCircle, Wallet, FileText, Printer, Filter, X 
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

    // 🟢 CORRECTION : Mise à jour de l'URL vers '/agences/profile' (avec le "s")
    const fetchInfosAgence = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/agences/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNomAgence(response.data.nom); 
        } catch (error) {
            console.error("Erreur nom agence", error);
            setNomAgence("AGENCE"); 
        }
    };

    // 🟢 CORRECTION : Ajout du token pour la récupération du livre de caisse
    const fetchLivreDeCaisse = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/finance/livre-de-caisse', {
                headers: { Authorization: `Bearer ${token}` }
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

    // 🟢 CORRECTION : Ajout du token pour la création d'une nouvelle transaction
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { ...formData, montant: parseFloat(formData.montant) };
            
            await api.post('/finance/transactions', payload, {
                headers: { Authorization: `Bearer ${token}` }
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
            {/* Styles pour l'impression conservés intacts */}
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
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent w-full" />
                    </div>
                    <button onClick={() => window.print()} className="bg-blue-600 text-white p-2.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex-1 lg:flex-none">
                        <Printer size={18} /> <span>Imprimer</span>
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-2.5 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all flex-1 lg:flex-none">
                        <PlusCircle size={18} /> <span>Nouveau</span>
                    </button>
                </div>
            </div>

            {/* Stats, Formulaire et Tableau... (Le reste du JSX est conservé comme dans votre code initial) */}
            {/* Note: Pour des raisons de concision ici, le JSX reste le même, utilisez la logique API intégrée ci-dessus. */}
        </div>
    );
};

export default GestionFinance;
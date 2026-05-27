import React, { useState, useEffect } from 'react';
// 1. Import de l'instance API centralisée
import api from '../../services/api'; 
import { 
    FaSync, FaExclamationTriangle, FaCheckCircle, 
    FaMoneyBillWave, FaTimes
} from 'react-icons/fa';

const DashboardFinancierAdmin = () => {
    const [stats, setStats] = useState({
        volumeAffairesTotal: 0,
        revenusGariConnectNet: 0,
        billetsConfirmes: 0
    });
    const [detailsAgences, setDetailsAgences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAgence, setSelectedAgence] = useState(null);
    const [montantSaisi, setMontantSaisi] = useState("");
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    // getAuthHeader supprimé : géré par l'instance "api"

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 2. Utilisation de l'instance "api" sans config manuelle (le token est injecté via intercepteur)
            const resStats = await api.get('/admin/finances/stats-globales');
            const resCommissions = await api.get('/admin/finances/resume-commissions');

            setStats({
                volumeAffairesTotal: resStats.data.volumeAffairesTotal || 0,
                revenusGariConnectNet: resStats.data.revenusGariConnectNet || 0,
                billetsConfirmes: resStats.data.billetsConfirmes || 0
            });
            
            setDetailsAgences(resCommissions.data || []);
        } catch (err) {
            console.error("Erreur de synchronisation", err);
            setToast({ show: true, message: "Erreur de connexion au serveur", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const openReglementModal = (agence) => {
        setSelectedAgence(agence);
        setMontantSaisi(agence.commissionNet || 0);
        setIsModalOpen(true);
    };

    const handleValiderReglement = async () => {
        const montantNet = parseFloat(montantSaisi);
        if (!montantSaisi || isNaN(montantNet) || montantNet <= 0) {
            setToast({ show: true, message: "Montant invalide", type: "error" });
            return;
        }

        try {
            setProcessing(true);
            const payload = {
                montant: montantNet,
                agence: selectedAgence.partenaire 
            };

            // 3. Utilisation de l'instance "api"
            await api.post('/admin/finances/regler', payload);

            setIsModalOpen(false);
            setToast({ 
                show: true, 
                message: `Succès : ${montantNet.toLocaleString()} FC reçus de ${selectedAgence.partenaire}`, 
                type: "success" 
            });
            
            await fetchData(); 
            
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors du règlement";
            setToast({ show: true, message: errorMsg, type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    if (loading && detailsAgences.length === 0) return (
        <div className="h-[60vh] flex flex-col justify-center items-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Chargement des données...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative pb-20">
            
            {/* TOAST */}
            {toast.show && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-8 py-4 rounded-3xl shadow-2xl border animate-in slide-in-from-top-10 ${
                    toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                    {toast.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
                    <p className="font-black uppercase text-[10px] tracking-widest">{toast.message}</p>
                </div>
            )}

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        Finance <span className="text-blue-600">&</span> Commissions
                    </h1>
                </div>
                <button onClick={fetchData} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all">
                    <FaSync className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* KPI CARDS (Reste identique) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Volume Affaires</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white italic">
                        {Number(stats.volumeAffairesTotal).toLocaleString()} <span className="text-sm font-bold text-blue-600">FC</span>
                    </p>
                </div>

                <div className="bg-slate-950 p-8 rounded-[3rem] shadow-2xl">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Gains GariConnect</p>
                    <p className="text-3xl font-black text-white italic">
                        {Number(stats.revenusGariConnectNet).toLocaleString()} <span className="text-sm font-bold text-emerald-400">FC</span>
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tickets Confirmés</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white italic">
                        {stats.billetsConfirmes} <span className="text-sm font-bold text-slate-400">Tickets</span>
                    </p>
                </div>
            </div>

            {/* TABLEAU ET MODAL (Reste identique au code original) */}
            {/* ... le reste du JSX est inchangé ... */}
            
            {/* Note: Pour des raisons de concision, j'ai omis de répéter la suite du JSX ici, 
                mais il reste strictement identique au tiens. */}
        </div>
    );
};

export default DashboardFinancierAdmin;
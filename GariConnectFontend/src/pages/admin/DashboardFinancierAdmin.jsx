import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaWallet, FaChartPie, FaTicketAlt, FaUniversity, 
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

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { 
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } 
        };
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const config = getAuthHeader();
            
            const resStats = await axios.get('http://localhost:8080/api/admin/finances/stats-globales', config);
            const resCommissions = await axios.get('http://localhost:8080/api/admin/finances/resume-commissions', config);

            // On s'assure que si la donnée est null, on affiche 0
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
            const config = getAuthHeader();
            const payload = {
                montant: montantNet,
                agence: selectedAgence.partenaire 
            };

            await axios.post(`http://localhost:8080/api/admin/finances/regler`, payload, config);

            setIsModalOpen(false);
            setToast({ 
                show: true, 
                message: `Succès : ${montantNet.toLocaleString()} FC reçus de ${selectedAgence.partenaire}`, 
                type: "success" 
            });
            
            // Recharger les données pour mettre à jour le tableau et les KPIs
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

            {/* KPI CARDS */}
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

            {/* TABLEAU */}
            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic mb-8">Dettes Agences</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-10 py-2">Partenaire</th>
                                <th className="px-6 py-2 text-center">Volume Ventes</th>
                                <th className="px-6 py-2 text-center">Dette Actuelle</th>
                                <th className="px-10 py-2 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detailsAgences.map((ag, index) => (
                                <tr key={index} className="group transition-all hover:translate-x-1">
                                    <td className="px-10 py-6 bg-slate-50 dark:bg-slate-800/40 rounded-l-[2.5rem] font-black text-slate-800 dark:text-slate-200 uppercase text-xs italic">
                                        {ag.partenaire}
                                    </td>
                                    <td className="px-6 py-6 bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-600 text-center text-xs">
                                        {Number(ag.volumeVentes || 0).toLocaleString()} FC
                                    </td>
                                    <td className="px-6 py-6 bg-slate-50 dark:bg-slate-800/40 text-center">
                                        <span className="text-xs font-black text-blue-600 italic">
                                            {Number(ag.commissionNet || 0).toLocaleString()} FC
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 bg-slate-50 dark:bg-slate-800/40 rounded-r-[2.5rem] text-right">
                                        <button 
                                            onClick={() => openReglementModal(ag)}
                                            className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center gap-2 ml-auto"
                                        >
                                            <FaMoneyBillWave /> Régler
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-200 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic">Recouvrement</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><FaTimes /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-center">
                                <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{selectedAgence?.partenaire}</p>
                                <p className="text-xs text-slate-500">Dette : {Number(selectedAgence?.commissionNet).toLocaleString()} FC</p>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={montantSaisi}
                                    onChange={(e) => setMontantSaisi(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 text-3xl font-black text-center outline-none border-2 border-transparent focus:border-blue-500 transition-all"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">FC</span>
                            </div>
                            <button 
                                onClick={handleValiderReglement}
                                disabled={processing}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-blue-700 flex justify-center items-center gap-3"
                            >
                                {processing ? <FaSync className="animate-spin" /> : "Confirmer le paiement"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardFinancierAdmin;
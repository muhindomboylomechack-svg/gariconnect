import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaHistory, FaBus, FaBox, FaSearch, 
    FaChevronRight, FaCalendarAlt, FaArrowLeft, FaStar
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const History = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('voyages'); 
    const [historyData, setHistoryData] = useState({ tickets: [], colis: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    const API_BASE_URL = "http://localhost:8080/api";

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login');
                return;
            }

            const config = { 
                headers: { 'Authorization': `Bearer ${token.trim()}` } 
            };
            
            try {
                // Appels simultanés au backend pour les réservations et les colis
                const [ticketsRes, colisRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/reservations/mes-reservations`, config),
                    axios.get(`${API_BASE_URL}/agences/courriers/mes-envois`, config)
                ]);

                setHistoryData({
                    tickets: Array.isArray(ticketsRes.data) ? ticketsRes.data : [],
                    colis: Array.isArray(colisRes.data) ? colisRes.data : []
                });
            } catch (error) {
                console.error("Erreur historique :", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    // Filtrage des données selon l'onglet actif et le terme de recherche
    const filteredData = activeTab === 'voyages' 
        ? historyData.tickets.filter(t => 
            t.trajet?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.trajet?.depart?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.agenceNom?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : historyData.colis.filter(c => 
            c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.nomDestinataire?.toLowerCase().includes(searchTerm.toLowerCase())
          );

    const formatDate = (dateString) => {
        if (!dateString) return t('back'); // Fallback si date absente
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen pb-20 animate-in fade-in duration-700 bg-slate-50/30 dark:bg-transparent">
            <div className="max-w-4xl mx-auto px-4">
                
                {/* Header Profilé */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 mt-8">
                    <div className="flex items-center gap-5">
                        <div className="p-5 bg-blue-600 rounded-[1.8rem] text-white shadow-2xl shadow-blue-500/30 ring-4 ring-white dark:ring-slate-900">
                            <FaHistory size={28} />
                        </div>
                        <div>
                            <Link to="/client/dashboard" className="text-blue-600 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 mb-2 hover:translate-x-[-5px] transition-transform">
                                <FaArrowLeft /> {t('back')}
                            </Link>
                            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-none">
                                {t('settings')}<span className="text-blue-600">.</span>
                            </h1>
                        </div>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="flex gap-3">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex-1 md:flex-none min-w-[120px]">
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{activeTab === 'voyages' ? 'Tickets' : 'Colis'}</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                                {activeTab === 'voyages' ? historyData.tickets.length : historyData.colis.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation par Onglets */}
                <div className="bg-slate-200/50 dark:bg-slate-800/50 p-2 rounded-[2.5rem] flex mb-10 backdrop-blur-sm">
                    <button 
                        onClick={() => { setActiveTab('voyages'); setSearchTerm(""); }}
                        className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-xs uppercase transition-all duration-500 ${activeTab === 'voyages' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FaBus size={16} /> {t('checkout.your_seat')}
                    </button>
                    <button 
                        onClick={() => { setActiveTab('colis'); setSearchTerm(""); }}
                        className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-xs uppercase transition-all duration-500 ${activeTab === 'colis' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FaBox size={16} /> {t('preferences')}
                    </button>
                </div>

                {/* Barre de Recherche Dynamique */}
                <div className="relative group mb-12">
                    <FaSearch className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'voyages' ? t('checkout.select_seat_placeholder') : "Rechercher une expédition..."}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-transparent rounded-[2rem] py-6 pl-16 pr-8 outline-none focus:border-blue-500/20 shadow-xl shadow-slate-200/40 dark:shadow-none font-bold text-slate-700 dark:text-white placeholder:text-slate-300 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Liste des Résultats */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-sm border-2 border-dashed border-slate-100 dark:border-slate-800">
                             <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                             <p className="font-black text-[11px] uppercase tracking-[0.4em] text-blue-600 animate-pulse">Intelligence Sync...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-inner">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                                <FaHistory size={40} />
                            </div>
                            <p className="font-black uppercase text-xs text-slate-400 tracking-[0.2em]">{t('checkout.error_load')}</p>
                        </div>
                    ) : (
                        filteredData.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="group bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-50 dark:border-slate-800 transition-all hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-5"
                                style={{ animationDelay: `${index * 70}ms` }}
                            >
                                <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                                    <div className="flex items-center gap-6 w-full lg:w-auto">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl transition-all duration-500 ${
                                            activeTab === 'voyages' 
                                            ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white shadow-lg shadow-blue-500/10' 
                                            : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white shadow-lg shadow-emerald-500/10'
                                        }`}>
                                            {activeTab === 'voyages' ? <FaBus /> : <FaBox />}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xl mb-2">
                                                {activeTab === 'voyages' 
                                                    ? `${item.trajet?.depart} ➔ ${item.trajet?.destination}` 
                                                    : (item.description || `Colis #${item.id.toString().slice(-4)}`)}
                                            </h4>
                                            
                                            <div className="flex flex-wrap items-center gap-4">
                                                <span className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                    <FaCalendarAlt className="text-blue-500" />
                                                    {formatDate(activeTab === 'voyages' ? item.trajet?.dateDepart : item.dateEnvoi)}
                                                </span>
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
                                                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${
                                                    (item.statutPaiement === 'CONFIRME' || item.statut === 'LIVRE') 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {activeTab === 'voyages' ? (item.statutPaiement || 'ATTENTE') : (item.statut || 'TRANSIT')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-12 border-t lg:border-none pt-6 lg:pt-0 border-slate-50">
                                        <div className="text-left lg:text-right">
                                            <p className="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-tighter">{t('checkout.total_to_pay')}</p>
                                            <p className="font-black text-slate-900 dark:text-white text-2xl italic">
                                                {activeTab === 'voyages' ? item.trajet?.prix : item.prix} 
                                                <span className="text-blue-600 text-sm not-italic ml-1">FCFA</span>
                                            </p>
                                        </div>

                                        {/* Bouton Action : Si voyage terminé, proposer l'évaluation */}
                                        <button 
                                            onClick={() => activeTab === 'voyages' && navigate(`/client/evaluate/${item.id}`)}
                                            className="group/btn bg-slate-50 dark:bg-slate-800 p-5 rounded-[1.5rem] text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/20 active:scale-95"
                                        >
                                            {activeTab === 'voyages' ? <FaStar className="animate-pulse" /> : <FaChevronRight />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;
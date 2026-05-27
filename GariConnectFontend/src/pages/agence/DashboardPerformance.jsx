import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Importation de l'instance centralisée
import { 
    BarChart3, TrendingUp, AlertTriangle, Users, 
    Star, ArrowRight, RefreshCw, 
    MessageSquare, Calendar, User, Truck
} from 'lucide-react';

const DashboardPerformance = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const fetchPerformanceData = async () => {
        setLoading(true);
        try {
            // Remplacement d'axios par api. 
            // L'URL de base et le token d'autorisation sont gérés automatiquement.
            const response = await api.get('/evaluations/rapport-performance');
            
            setStats(response.data);
            setError(null);
        } catch (error) {
            console.error("Erreur dashboard", error);
            setError("Impossible de charger les indicateurs de performance.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const toPercent = (note) => Math.min(100, Math.round((note || 0) * 20));

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <RefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center">
                Extraction des données opérationnelles...
            </p>
        </div>
    );

    if (error) return <div className="p-10 text-rose-600 font-bold text-center dark:bg-slate-950 h-screen">{error}</div>;

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
            {/* EN-TÊTE */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Intelligence Décisionnelle</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Analyse des performances et retours clients en temps réel</p>
                </div>
                <button 
                    onClick={fetchPerformanceData}
                    className="bg-blue-600 text-white p-2.5 px-6 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-200 dark:shadow-none"
                >
                    <RefreshCw size={18} /> Actualiser les données
                </button>
            </div>

            {/* --- GRILLE DES KPI PRINCIPAUX --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* KPI Satisfaction */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 w-fit mb-4">
                        <Star size={24} fill="currentColor" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Satisfaction Globale (CSAT)</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                        {stats?.satisfactionGlobale?.toFixed(1) || "0.0"} <span className="text-lg text-slate-400">/ 5</span>
                    </p>
                </div>

                {/* KPI Moyenne */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                            <Users size={24} />
                        </div>
                        <TrendingUp size={20} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Note Moyenne Chauffeurs</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                        {stats?.moyenneConduite?.toFixed(1) || "0.0"} <span className="text-lg text-slate-400">/ 5</span>
                    </p>
                </div>

                {/* KPI Alertes */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-rose-100 dark:border-rose-900/20 transition-colors">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 w-fit mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Signalements Critiques</p>
                    <p className="text-4xl font-black text-rose-600 dark:text-rose-500 mt-1">{stats?.alertesCritiques?.length || 0}</p>
                </div>
            </div>

            {/* --- SECTION TABLEAU : JOURNAL DES ÉVALUATIONS --- */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 mb-10 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase">
                        <MessageSquare className="text-blue-600" /> Journal des évaluations
                    </h2>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-1 rounded-full text-xs font-bold">
                        {stats?.allEvaluations?.length || 0} Entrées
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                <th className="px-4 py-2">Date & Client</th>
                                <th className="px-4 py-2">Chauffeur / Véhicule</th>
                                <th className="px-4 py-2 text-center">Score Global</th>
                                <th className="px-4 py-2">Commentaire</th>
                                <th className="px-4 py-2">Détails Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.allEvaluations?.length > 0 ? stats.allEvaluations.map((evalItem) => (
                                <tr key={evalItem.id} className="bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group">
                                    <td className="px-4 py-4 rounded-l-2xl">
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-slate-200">
                                                <Calendar size={12} className="text-blue-500"/> {formatDate(evalItem.dateEvaluation)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">ID: #{evalItem.client?.id || '---'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1 font-black text-slate-700 dark:text-slate-300 text-sm uppercase">
                                                <User size={14} className="text-purple-500"/> {evalItem.chauffeur?.nom || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                                                <Truck size={12}/> {evalItem.vehicule?.immatriculation || '---'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-white ${
                                            evalItem.noteGlobale >= 4 ? 'bg-green-500' : evalItem.noteGlobale >= 3 ? 'bg-orange-500' : 'bg-rose-500'
                                        }`}>
                                            {evalItem.noteGlobale}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 max-w-xs">
                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic line-clamp-2">
                                            "{evalItem.commentaire || '...'}"
                                        </p>
                                    </td>
                                    <td className="px-4 py-4 rounded-r-2xl">
                                        <div className="grid grid-cols-3 gap-2 text-[9px] font-black uppercase text-slate-400">
                                            <div className="text-center">
                                                <p>Cond.</p>
                                                <p className="text-slate-900 dark:text-slate-200 text-xs">{evalItem.noteConduite}/5</p>
                                            </div>
                                            <div className="text-center">
                                                <p>Conf.</p>
                                                <p className="text-slate-900 dark:text-slate-200 text-xs">{evalItem.noteConfort}/5</p>
                                            </div>
                                            <div className="text-center">
                                                <p>Ponc.</p>
                                                <p className="text-slate-900 dark:text-slate-200 text-xs">{evalItem.notePonctualite}/5</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-20 text-slate-400 italic">Aucune évaluation.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ANALYSE ET ALERTES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Analyse des services */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase">
                        <BarChart3 className="text-blue-600" /> Analyse des services
                    </h2>
                    <div className="space-y-8">
                        {/* Barre de progression type */}
                        {[
                            { label: "Sécurité de conduite", val: stats?.moyenneConduite, col: "bg-blue-600", text: "text-blue-600" },
                            { label: "État & Confort Flotte", val: stats?.moyenneConfort, col: "bg-orange-500", text: "text-orange-500" },
                            { label: "Ponctualité", val: stats?.moyennePonctualite, col: "bg-green-500", text: "text-green-500" }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                                    <span className={item.text}>{toPercent(item.val)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                    <div className={`${item.col} h-full transition-all duration-1000 ease-out`} 
                                         style={{ width: `${toPercent(item.val)}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Signalements */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-rose-100 dark:border-rose-900/20 transition-colors">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase">
                        <AlertTriangle className="text-rose-500" /> Signalements à traiter
                    </h2>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {stats?.alertesCritiques?.length > 0 ? stats.alertesCritiques.map((alerte) => (
                            <div key={alerte.id} className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 flex justify-between items-center transition-colors">
                                <div>
                                    <p className="font-black text-rose-900 dark:text-rose-400 uppercase text-xs">Note {alerte.noteGlobale}/5</p>
                                    <p className="text-sm text-rose-700 dark:text-rose-300 mt-1 italic line-clamp-1">"{alerte.commentaire}"</p>
                                </div>
                                <button className="p-2 bg-white dark:bg-slate-800 rounded-full text-rose-500 shadow-sm hover:scale-110 transition-all">
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-slate-400 italic">Zéro alerte critique.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPerformance;
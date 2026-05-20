import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { 
    FaChevronRight, FaBus, FaPlay, FaStop, 
    FaStar, FaAward
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const EspaceChauffeur = () => {
    const [trajet, setTrajet] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Statistiques
    const [stats, setStats] = useState({
        note: 4.8,
        courses: 124,
        prime: 15,
        statut: "Élite",
        agence: "GariConnect",
        recettesMobileMoney: 0
    });

    const initData = useCallback(async () => {
        setLoading(true);
        try {
            const [profileRes, trajetRes] = await Promise.allSettled([
                api.get('/users/profile'),
                api.get('/trajets/mon-trajet-actif')
            ]);

            if (profileRes.status === 'fulfilled') {
                setUser(profileRes.value.data);
                if(profileRes.value.data.agenceEmployeur) {
                    setStats(prev => ({ ...prev, agence: profileRes.value.data.agenceEmployeur.nom }));
                }
            }

            if (trajetRes.status === 'fulfilled' && trajetRes.value.status === 200) {
                setTrajet(trajetRes.value.data);
            } else {
                setTrajet(null);
            }
            
        } catch (err) {
            console.error("Erreur GariConnect Sync:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        initData();
    }, [initData]);

    const toggleVoyage = async () => {
        if (!trajet) return;

        const estAuDepart = trajet.statut === "DISPONIBLE";
        const action = estAuDepart ? "EN_ROUTE" : "TERMINE";
        const message = estAuDepart 
            ? `Voulez-vous démarrer le voyage vers ${trajet.destination} ?`
            : `Voulez-vous clôturer ce voyage ?`;

        if (!window.confirm(message)) return;

        try {
            const response = await api.patch(`/trajets/${trajet.id}/statut`, { statut: action });
            
            if (response.status === 200) {
                alert(`Succès : Voyage ${action === "EN_ROUTE" ? "démarré" : "terminé"}`);
                initData(); 
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Erreur de communication avec le serveur.";
            alert("Erreur : " + errorMsg);
        }
    };

    if (loading && !user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-slate-950 transition-colors duration-300">
            <div className="text-center">
                <FaBus size={48} className="mx-auto mb-4 text-indigo-600 dark:text-indigo-400 animate-bounce"/>
                <p className="font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase text-xs">Synchronisation GariConnect...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-10 font-sans relative transition-colors duration-300">
            
            {/* Header Harmonisé - Couleurs vibrantes adaptées aux deux modes */}
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 pb-24 rounded-b-[3rem] shadow-2xl bg-gradient-to-br from-[#1e1b4b] via-[#4338ca] to-[#6366f1] text-white relative z-20"
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                            <span className="text-2xl font-black">{user?.nom?.charAt(0) || 'C'}</span>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em]">{stats.agence}</p>
                            <h1 className="text-xl font-black tracking-tight">{user?.nom} {user?.prenom}</h1>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="px-5 -mt-16 space-y-5 relative z-10">
                <AnimatePresence mode="wait">
                    {!trajet ? (
                        <motion.div 
                            key="no-trip"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-10 rounded-[2.5rem] text-center shadow-xl border border-white dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm"
                        >
                            <FaBus size={30} className="mx-auto mb-4 text-slate-200 dark:text-slate-700"/>
                            <h3 className="font-black uppercase text-sm text-slate-800 dark:text-slate-200">Aucune mission</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">L'agence n'a pas encore validé votre départ.</p>
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={initData} 
                                className="w-full py-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none transition-colors"
                            >
                                RAFRAÎCHIR
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="active-trip"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="p-6 rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1 tracking-wider">Trajet Actif</p>
                                    <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-slate-100">
                                        {trajet.depart} <FaChevronRight className="inline mx-1 text-slate-300 dark:text-slate-700" size={12}/> {trajet.destination}
                                    </h2>
                                </div>
                                <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                                    {trajet.statut}
                                </div>
                            </div>

                            {/* BOUTON DYNAMIQUE */}
                            <motion.button 
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={toggleVoyage} 
                                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all ${
                                    trajet.statut === "DISPONIBLE" 
                                    ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-100 dark:shadow-none" 
                                    : "bg-rose-600 dark:bg-rose-500 text-white shadow-rose-100 dark:shadow-none"
                                }`}
                            >
                                {trajet.statut === "DISPONIBLE" ? <><FaPlay size={12}/> Démarrer la mission</> : <><FaStop size={12}/> Clôturer la course</>}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Section Stats Subtile - Cartes Blanches (Clair) / Gris Foncé (Sombre) */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Évaluation</p>
                        <div className="flex items-center gap-1">
                            <FaStar className="text-amber-400 dark:text-amber-500" size={14}/>
                            <span className="font-black text-slate-700 dark:text-slate-300">{stats.note}</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Niveau</p>
                        <div className="flex items-center gap-1">
                            <FaAward className="text-indigo-600 dark:text-indigo-400" size={14}/>
                            <span className="font-black text-slate-700 dark:text-slate-300">{stats.statut}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default EspaceChauffeur;
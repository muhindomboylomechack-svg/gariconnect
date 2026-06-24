import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { 
    FaChevronRight, FaBus, FaStar, FaAward, FaQrcode, FaSyncAlt, FaMapMarkerAlt 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ScannerTicket from './ScannerTicket'; 

const EspaceChauffeur = () => {
    const navigate = useNavigate();
    
    const [trajets, setTrajets] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanOuvert, setScanOuvert] = useState(false);
    
    const [stats, setStats] = useState({
        note: 4.8,
        courses: 124,
        prime: 15,
        statut: "Élite",
        agence: "GariConnect",
    });

    const initData = useCallback(async () => {
        setLoading(true);
        try {
            const [profileRes, trajetsRes] = await Promise.allSettled([
                api.get('/users/profile'),
                api.get('/trajets/mon-historique/aujourdhui') // Endpoint filtré par jour
            ]);

            if (profileRes.status === 'fulfilled') {
                setUser(profileRes.value.data);
                if(profileRes.value.data.agenceEmployeur) {
                    setStats(prev => ({ ...prev, agence: profileRes.value.data.agenceEmployeur.nom }));
                }
            }

            if (trajetsRes.status === 'fulfilled' && trajetsRes.value.data) {
                setTrajets(trajetsRes.value.data);
            }
        } catch (err) {
            console.error("Erreur de synchronisation:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        initData();
    }, [initData]);

    // 🟢 CORRECTION ICI : Changement du verbe de PATCH à PUT et passage du statut dans la Query String (?statut=)
    const handleUpdateStatus = async (id, nouveauStatut) => {
        try {
            await api.put(`/trajets/${id}/statut?statut=${nouveauStatut}`);
            alert("Statut mis à jour !");
            initData(); // Rechargement pour rafraîchir l'interface
        } catch (err) {
            console.error("Erreur mise à jour statut:", err);
            alert("Erreur lors de la mise à jour : " + (err.response?.data?.message || err.response?.data?.error || "Serveur indisponible"));
        }
    };

    // Trouver s'il y a un trajet actuellement "EN_ROUTE" pour l'affichage du widget Option 2
    const trajetActif = trajets.find(t => t.statut === 'EN_ROUTE');

    if (loading && !user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-slate-950">
            <FaBus className="text-indigo-600 animate-bounce" size={48}/>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 font-sans transition-colors duration-300">
            
            {/* En-tête */}
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 pb-24 rounded-b-[3rem] shadow-2xl bg-gradient-to-br from-[#1e1b4b] via-[#4338ca] to-[#6366f1] text-white"
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <span className="text-2xl font-black">{user?.nom?.charAt(0) || 'C'}</span>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em]">{stats.agence}</p>
                            <h1 className="text-xl font-black tracking-tight">Bonjour, {user?.nom} {user?.prenom} !</h1>
                        </div>
                    </div>
                    <button onClick={initData} className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl border border-white/10">
                        <FaSyncAlt size={14} className={loading ? "animate-spin" : ""}/>
                    </button>
                </div>
            </motion.div>

            {/* Corps de la page */}
            <div className="px-5 -mt-16 space-y-5">
                
                {/* 🚀 INTEGRATION OPTION 2 : Widget dynamique de Course en Cours */}
                <AnimatePresence>
                    {trajetActif && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => navigate('/chauffeur/course-actuelle')}
                            className="p-5 rounded-[2.5rem] bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 border border-emerald-400/30 cursor-pointer flex items-center justify-between gap-4 active:scale-[0.99] transition-transform"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                                    <FaMapMarkerAlt size={20} className="animate-pulse text-white" />
                                </div>
                                <div className="min-w-0">
                                    <span className="inline-block px-2 py-0.5 bg-white/20 rounded-md text-[9px] font-black uppercase tracking-wider mb-1">
                                        Course active
                                    </span>
                                    <h4 className="font-bold text-base truncate">{trajetActif.depart} → {trajetActif.destination}</h4>
                                    <p className="text-emerald-100 text-xs mt-0.5 flex items-center gap-1">
                                        Suivi des passagers et arrêts en cours
                                    </p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <FaChevronRight size={14} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase text-xs tracking-widest mb-3">Trajets du jour ({trajets.length})</h3>

                <AnimatePresence mode="wait">
                    {trajets.length === 0 ? (
                        <motion.div className="p-10 rounded-[2.5rem] text-center bg-white/80 dark:bg-slate-900/90 shadow-xl border border-white dark:border-slate-800">
                            <p className="text-slate-400 font-medium text-xs mb-4">Aucun trajet pour aujourd'hui.</p>
                            <button onClick={initData} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black">RECHARGER</button>
                        </motion.div>
                    ) : (
                        trajets.map((t) => (
                            <motion.div 
                                key={t.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 rounded-[2rem] shadow-lg border border-white dark:border-slate-800 bg-white dark:bg-slate-900"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[9px] font-black text-indigo-500 uppercase">Trajet</p>
                                        <h2 className="font-black text-lg">{t.depart} → {t.destination}</h2>
                                    </div>
                                    <select 
                                        value={t.statut}
                                        onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black p-2 rounded-lg border border-slate-200 dark:border-slate-700 outline-none"
                                    >
                                        <option value="PROGRAMME">PROGRAMMÉ</option>
                                        <option value="EN_ROUTE">EN ROUTE</option>
                                        <option value="TERMINE">TERMINÉ</option>
                                        <option value="DISPONIBLE">DISPONIBLE</option>
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setScanOuvert(true)} 
                                        className="flex-1 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                    >
                                        <FaQrcode size={14}/> Scanner passager
                                    </button>

                                    {/* Si le trajet individuel est en route, on propose un raccourci d'action direct */}
                                    {t.statut === 'EN_ROUTE' && (
                                        <button 
                                            onClick={() => navigate('/chauffeur/course-actuelle')}
                                            className="px-4 bg-indigo-600 text-white rounded-2xl text-xs font-black flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-indigo-600/20"
                                            title="Ouvrir le suivi de course"
                                        >
                                            Suivre
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-[9px] text-slate-400 uppercase">Évaluation</p>
                        <div className="flex items-center gap-1 font-bold"><FaStar className="text-amber-400" size={14}/> {stats.note}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-[9px] text-slate-400 uppercase">Niveau</p>
                        <div className="flex items-center gap-1 font-bold"><FaAward className="text-indigo-600 dark:text-indigo-400" size={14}/> {stats.statut}</div>
                    </div>
                </div>
            </div>

            {/* Scan Modal */}
            <AnimatePresence>
                {scanOuvert && <ScannerTicket onFermer={() => setScanOuvert(false)} />}
            </AnimatePresence>
        </div>
    );
};

export default EspaceChauffeur;
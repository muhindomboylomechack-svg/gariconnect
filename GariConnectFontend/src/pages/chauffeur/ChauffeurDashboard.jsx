import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api'; 
import { 
    FaChevronRight, FaBus, FaStar, FaAward, FaQrcode, FaSyncAlt 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ScannerTicket from './ScannerTicket'; 

const EspaceChauffeur = () => {
    // Changement : on utilise un tableau [] au lieu de null
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

    // Fonction pour changer le statut d'un trajet spécifique
    const handleUpdateStatus = async (id, nouveauStatut) => {
        try {
            await api.patch(`/trajets/${id}/statut`, { statut: nouveauStatut });
            alert("Statut mis à jour !");
            initData(); // Rechargement pour rafraîchir l'interface
        } catch (err) {
            alert("Erreur lors de la mise à jour : " + (err.response?.data?.error || "Serveur indisponible"));
        }
    };

    if (loading && !user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-slate-950">
            <FaBus className="text-indigo-600 animate-bounce" size={48}/>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-10 font-sans transition-colors duration-300">
            
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
                            <h1 className="text-xl font-black tracking-tight">{user?.nom} {user?.prenom}</h1>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Corps */}
            <div className="px-5 -mt-16 space-y-5">
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

                                <button 
                                    onClick={() => setScanOuvert(true)} 
                                    className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2"
                                >
                                    <FaQrcode size={14}/> Scanner passager
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] text-slate-400 uppercase">Évaluation</p>
                        <div className="flex items-center gap-1"><FaStar className="text-amber-400" size={14}/> {stats.note}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] text-slate-400 uppercase">Niveau</p>
                        <div className="flex items-center gap-1"><FaAward className="text-indigo-600" size={14}/> {stats.statut}</div>
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
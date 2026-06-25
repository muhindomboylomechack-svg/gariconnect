import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    FaMapMarkerAlt, FaSearch, FaBus, 
    FaChevronRight, FaCalendarAlt
} from 'react-icons/fa';
import { motion } from 'framer-motion';

import api from '../../services/api'; 

const Home = () => {
    const { t } = useTranslation();
    const [trajets, setTrajets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState({ depart: '', destination: '', date: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchTrajets();
    }, []);

    const fetchTrajets = async () => {
        setLoading(true);
        try {
            // Modification de l'endpoint de '/trajets' vers '/trajets/tous' pour s'aligner avec l'option A
            const response = await api.get('/trajets/tous');
            setTrajets(response.data);
        } catch (error) {
            console.error("Erreur de chargement des trajets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get('/trajets/recherche', {
                params: { 
                    depart: searchQuery.depart, 
                    destination: searchQuery.destination,
                    date: searchQuery.date 
                }
            });
            setTrajets(response.data);
        } catch (error) {
            console.error("Erreur lors de la recherche", error);
        } finally {
            setLoading(false);
        }
    };

    // 🔥 Redirection directe vers la page unifiée après vérification du token
    const proceedToReservation = (trajetId) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert(t('auth.login_required_reservation', "Veuillez vous connecter pour réserver."));
            navigate('/login');
            return;
        }

        // Redirection vers ta nouvelle page de réservation unifiée
        navigate(`/client/reservation/${trajetId}`);
    };

    return (
        <div className="pb-20 space-y-6 md:space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300 relative px-4 md:px-8 py-4">
            
            {/* SECTION HERO */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-12 shadow-2xl overflow-hidden mt-0 mx-0"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 space-y-6">
                    <div className="space-y-2 text-center sm:text-left">
                        <p className="text-indigo-200 dark:text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px]">
                            GariConnect Express
                        </p>
                        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter">
                            {t('home.where_to_go', "Où allez-vous ?")}
                        </h1>
                    </div>

                    {/* FORMULAIRE DE RECHERCHE RESPONSIVE */}
                    <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-4 lg:p-3 rounded-2xl md:rounded-[2rem] flex flex-col lg:flex-row items-center gap-4 lg:gap-2 shadow-2xl border border-slate-100 dark:border-slate-800/60">
                        
                        {/* DEPART */}
                        <div className="flex-1 flex items-center px-3 w-full border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-3 lg:pb-0">
                            <FaMapMarkerAlt className="text-indigo-500 dark:text-indigo-400 shrink-0 text-lg md:text-base" />
                            <input 
                                type="text" 
                                placeholder={t('home.departure_city', "Ville de départ")} 
                                className="w-full p-2.5 bg-transparent border-none focus:ring-0 font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none text-sm md:text-base" 
                                onChange={(e) => setSearchQuery({...searchQuery, depart: e.target.value})} 
                            />
                        </div>
                        
                        {/* DESTINATION */}
                        <div className="flex-1 flex items-center px-3 w-full border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-3 lg:pb-0">
                            <FaMapMarkerAlt className="text-violet-500 dark:text-violet-400 shrink-0 text-lg md:text-base" />
                            <input 
                                type="text" 
                                placeholder={t('home.destination_city', "Ville de destination")} 
                                className="w-full p-2.5 bg-transparent border-none focus:ring-0 font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none text-sm md:text-base" 
                                onChange={(e) => setSearchQuery({...searchQuery, destination: e.target.value})} 
                            />
                        </div>
                        
                        {/* DATE */}
                        <div className="flex-1 flex items-center px-3 w-full pb-3 lg:pb-0">
                            <FaCalendarAlt className="text-emerald-500 dark:text-emerald-400 shrink-0 text-lg md:text-base" />
                            <input 
                                type="date" 
                                className="w-full p-2.5 bg-transparent border-none focus:ring-0 font-bold text-slate-800 dark:text-slate-100 focus:outline-none text-sm md:text-base dark:[color-scheme:dark]" 
                                onChange={(e) => setSearchQuery({...searchQuery, date: e.target.value})} 
                            />
                        </div>
                        
                        {/* BOUTON RECHERCHE */}
                        <motion.button 
                            whileHover={{ scale: 1.01 }} 
                            whileTap={{ scale: 0.99 }} 
                            onClick={handleSearch} 
                            className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-8 py-4 rounded-xl md:rounded-2xl font-black uppercase flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 text-xs md:text-sm tracking-wider"
                        >
                            <FaSearch /> {t('home.search', "Rechercher")}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* LISTE DES TRAJETS */}
            <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                        <FaBus className="text-indigo-500" /> {t('home.available_trips', "Trajets disponibles")}
                    </h2>
                </div>

                {loading ? (
                    <div className="text-center py-20 animate-pulse text-indigo-600 dark:text-indigo-400 font-black tracking-widest text-sm uppercase">
                        {t('common.loading', "Chargement...")}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {trajets.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-900 p-6 font-semibold text-slate-400 dark:text-slate-600 text-sm">
                                Aucun trajet ne correspond à vos critères.
                            </div>
                        ) : (
                            trajets.map((trajet) => (
                                <motion.div 
                                    key={trajet.id} 
                                    className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 hover:shadow-xl dark:hover:shadow-slate-950/40 transition-all shadow-sm"
                                >
                                    {/* AGENCE & HEURE */}
                                    <div className="flex items-center gap-4 w-full sm:w-auto min-w-[180px]">
                                        <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 rounded-xl md:rounded-[1.2rem] flex flex-col items-center justify-center shrink-0 border dark:border-slate-800/40">
                                            <FaBus className="text-lg md:text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{trajet.agence?.nom || "Express"}</p>
                                            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{trajet.heureDepart}</h3>
                                            {trajet.jourDepart && (
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{trajet.jourDepart}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* ITINÉRAIRE (LIGNE ADAPTATIVE) */}
                                    <div className="flex flex-1 items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto py-2 sm:py-0 border-y sm:border-y-0 border-slate-100 dark:border-slate-800/60">
                                        <p className="font-bold text-sm md:text-base text-slate-700 dark:text-slate-300">{trajet.depart}</p>
                                        <div className="h-[2px] flex-1 max-w-[60px] bg-slate-200 dark:bg-slate-800" />
                                        <p className="font-bold text-sm md:text-base text-slate-700 dark:text-slate-300">{trajet.destination}</p>
                                    </div>

                                    {/* PRIX & ACTION */}
                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-1 sm:mt-0">
                                        <p className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                            {trajet.prix} <span className="text-xs font-bold tracking-normal uppercase">Fc</span>
                                        </p>
                                        <button 
                                            onClick={() => proceedToReservation(trajet.id)} 
                                            className="w-11 h-11 md:w-12 md:h-12 bg-slate-900 hover:bg-indigo-600 dark:bg-slate-950 dark:hover:bg-indigo-600 dark:border dark:border-slate-800 text-white rounded-xl md:rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-md"
                                        >
                                            <FaChevronRight className="text-xs md:text-sm" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
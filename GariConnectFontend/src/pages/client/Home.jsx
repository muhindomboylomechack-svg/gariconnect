import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    FaMapMarkerAlt, FaSearch, FaBus, 
    FaClock, FaChevronRight, FaCalendarAlt 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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
            const response = await api.get('/trajets');
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

    const handleReservation = async (trajetId) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert(t('auth.login_required_reservation', "Veuillez vous connecter pour réserver."));
            navigate('/login');
            return;
        }

        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const clientId = user?.id || 1;

        try {
            const reservationPayload = {
                client: { id: parseInt(clientId) },
                trajet: { id: parseInt(trajetId) },
                nbPlaces: 1,
                statut: "EN_ATTENTE"
            };

            const response = await api.post('/reservations/creer-simple', reservationPayload);

            if (response.status === 200 || response.status === 201) {
                const reservationId = response.data.id || response.data.reservationId;
                navigate(`/client/finaliser-reservation/${reservationId}`);
            }
        } catch (error) {
            console.error("Erreur création réservation:", error);
            alert(error.response?.data?.error || error.response?.data?.message || t('checkout.error_confirm', "Une erreur est survenue."));
        }
    };

    return (
        <div className="pb-20 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
            
            {/* SECTION HERO */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 dark:from-indigo-900 dark:via-slate-900 dark:to-violet-950 rounded-[2.5rem] p-6 md:p-12 shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                        <p className="text-indigo-200 dark:text-indigo-300 font-black uppercase tracking-[0.3em] text-[10px]">
                            GariConnect Express
                        </p>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                            {t('home.where_to_go', "Où allez-vous ?")}
                        </h1>
                    </div>

                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 lg:p-3 rounded-[2rem] flex flex-col lg:flex-row items-center gap-4 lg:gap-2 shadow-2xl border border-transparent dark:border-slate-800">
                        <div className="flex-1 flex items-center px-4 w-full border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
                            <FaMapMarkerAlt className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                            <input type="text" placeholder={t('home.departure_city', "Ville de départ")} className="w-full p-3 bg-transparent border-none focus:ring-0 font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none" onChange={(e) => setSearchQuery({...searchQuery, depart: e.target.value})} />
                        </div>
                        <div className="flex-1 flex items-center px-4 w-full border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
                            <FaMapMarkerAlt className="text-violet-500 dark:text-violet-400 shrink-0" />
                            <input type="text" placeholder={t('home.destination_city', "Ville de destination")} className="w-full p-3 bg-transparent border-none focus:ring-0 font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none" onChange={(e) => setSearchQuery({...searchQuery, destination: e.target.value})} />
                        </div>
                        <div className="flex-1 flex items-center px-4 w-full">
                            <FaCalendarAlt className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                            <input type="date" className="w-full p-3 bg-transparent border-none focus:ring-0 font-bold text-slate-700 dark:text-slate-200 focus:outline-none" onChange={(e) => setSearchQuery({...searchQuery, date: e.target.value})} />
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSearch} className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 transition-all shadow-lg shrink-0">
                            <FaSearch /> {t('home.search', "Rechercher")}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* LISTE DES TRAJETS */}
            <div className="px-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <FaBus className="text-indigo-500" /> {t('home.available_trips', "Trajets disponibles")}
                    </h2>
                </div>

                {loading ? (
                    <div className="text-center py-20 animate-pulse text-indigo-600 font-bold">{t('common.loading', "Chargement...")}</div>
                ) : (
                    <div className="grid gap-4">
                        {trajets.map((trajet) => (
                            <motion.div key={trajet.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all">
                                
                                {/* AGENCE & HEURE */}
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="w-14 h-14 bg-indigo-50 dark:bg-slate-800 text-indigo-600 rounded-[1.2rem] flex flex-col items-center justify-center">
                                        <FaBus size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase">{trajet.agence?.nom || "Express"}</p>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tighter">{trajet.heureDepart}</h3>
                                        {/* AJOUT DU JOUR DE DÉPART */}
                                        {trajet.jourDepart && (
                                            <p className="text-[10px] font-bold text-slate-400">{trajet.jourDepart}</p>
                                        )}
                                    </div>
                                </div>

                                {/* ITINÉRAIRE */}
                                <div className="flex flex-1 items-center justify-center gap-4">
                                    <p className="font-bold text-slate-700 dark:text-slate-300">{trajet.depart}</p>
                                    <div className="h-[2px] w-12 bg-slate-200 dark:bg-slate-800" />
                                    <p className="font-bold text-slate-700 dark:text-slate-300">{trajet.destination}</p>
                                </div>

                                {/* PRIX & ACTION */}
                                <div className="flex items-center gap-6">
                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{trajet.prix} <span className="text-xs">Fc</span></p>
                                    <button onClick={() => handleReservation(trajet.id)} className="w-12 h-12 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center transition-colors">
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    FaMapMarkerAlt, FaSearch, FaBus, 
    FaClock, FaChevronRight 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ CORRECTION DU CHEMIN : On remonte de deux dossiers pour atteindre src/services
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
                params: { depart: searchQuery.depart, destination: searchQuery.destination }
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
            alert(t('auth.login_required_reservation') || "Veuillez vous connecter pour réserver.");
            navigate('/login');
            return;
        }

        // Récupération des infos utilisateur stockées localement à la connexion
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const clientId = user?.id || 1; // ID 1 par défaut si non trouvé pour le test, à ajuster selon votre auth

        try {
            // ✅ MODIFICATION MAJEURE : Restructuration du payload pour correspondre aux entités Spring Boot
            const reservationPayload = {
                client: { id: parseInt(clientId) },         // Structure d'objet pour @ManyToOne User
                trajet: { id: parseInt(trajetId) },         // Structure d'objet pour @ManyToOne Trajet
                nbPlaces: 1,                                // Requis par votre modèle backend
                statut: "EN_ATTENTE"                        // Statut d'initialisation
            };

            const response = await api.post('/reservations/creer-simple', reservationPayload);

            if (response.status === 200 || response.status === 201) {
                const reservationId = response.data.id || response.data.reservationId;
                navigate(`/client/finaliser-reservation/${reservationId}`);
            }
        } catch (error) {
            console.error("Erreur création réservation:", error);
            alert(error.response?.data?.error || error.response?.data?.message || t('checkout.error_confirm') || "Une erreur est survenue.");
        }
    };

    return (
        <div className="pb-20 space-y-8">
            
            {/* SECTION HERO ANIMÉE */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                        <p className="text-indigo-200 font-black uppercase tracking-[0.3em] text-[10px]">
                            GariConnect Express
                        </p>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                            {t('home.where_to_go') || "Où allez-vous ?"}
                        </h1>
                    </div>

                    <div className="bg-white/95 backdrop-blur-md p-3 rounded-[2rem] flex flex-col lg:flex-row items-center gap-2 shadow-2xl">
                        <div className="flex-1 flex items-center px-4 w-full border-b lg:border-b-0 lg:border-r border-slate-100">
                            <FaMapMarkerAlt className="text-indigo-400" />
                            <input 
                                type="text"
                                name="depart" 
                                placeholder={t('home.departure_city') || "Ville de départ"} 
                                className="w-full p-4 bg-transparent border-none focus:ring-0 font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none"
                                onChange={(e) => setSearchQuery({...searchQuery, depart: e.target.value})}
                            />
                        </div>
                        <div className="flex-1 flex items-center px-4 w-full">
                            <FaMapMarkerAlt className="text-violet-400" />
                            <input 
                                type="text"
                                name="destination" 
                                placeholder={t('home.destination_city') || "Ville de destination"} 
                                className="w-full p-4 bg-transparent border-none focus:ring-0 font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none"
                                onChange={(e) => setSearchQuery({...searchQuery, destination: e.target.value})}
                            />
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSearch}
                            className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
                        >
                            <FaSearch /> {t('home.search') || "Rechercher"}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* LISTE DES TRAJETS */}
            <div className="px-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <FaBus className="text-indigo-500" /> 
                        {t('home.available_trips') || "Trajets disponibles"}
                    </h2>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md font-bold text-slate-500">
                        {trajets.length} {t('home.results') || "RÉSULTATS"}
                    </span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-black text-slate-400 tracking-widest uppercase">
                            {t('common.loading') || "Chargement..."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence>
                            {trajets.length > 0 ? (
                                trajets.map((trajet, index) => (
                                    <motion.div 
                                        key={trajet.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white dark:bg-slate-900 group p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-default"
                                    >
                                        <div className="flex items-center gap-6 w-full md:w-auto">
                                            <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] flex flex-col items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <FaBus size={20} />
                                                <span className="text-[8px] font-black mt-1 uppercase">Bus</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter mb-1">
                                                    {trajet.agence?.nom || "Express"}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <FaClock className="text-slate-300 dark:text-slate-600 text-xs" />
                                                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tighter">
                                                        {trajet.heureDepart}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-1 items-center justify-center gap-4 my-6 md:my-0">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Départ</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">{trajet.depart}</p>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 px-4">
                                                <div className="h-[2px] w-12 bg-slate-100 dark:bg-slate-800 relative">
                                                    <div className="absolute -top-1 right-0 w-2 h-2 bg-indigo-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Arrivée</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">{trajet.destination}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between w-full md:w-auto gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase">{t('checkout.total_to_pay') || "Total à payer"}</p>
                                                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                                                    {trajet.prix} <span className="text-xs uppercase">Fc</span>
                                                </p>
                                            </div>
                                            <motion.button 
                                                whileHover={{ x: 5 }}
                                                onClick={() => handleReservation(trajet.id)}
                                                className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-2xl flex items-center justify-center hover:bg-indigo-600 dark:hover:bg-indigo-600 transition-colors shadow-lg"
                                            >
                                                <FaChevronRight />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
                                >
                                    <p className="font-black text-slate-400 uppercase text-xs tracking-widest">
                                        {t('home.no_trips_found') || "Aucun trajet disponible pour le moment"}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
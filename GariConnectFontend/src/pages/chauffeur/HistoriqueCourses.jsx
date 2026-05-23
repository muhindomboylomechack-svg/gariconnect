import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaHistory, FaMapMarkerAlt, FaCarSide, 
    FaMoneyBillWave, FaCalendarAlt, FaSearch,
    FaCheckCircle, FaRoute, FaClock, FaUsers
} from 'react-icons/fa';
import api from '../../services/api';

const ChauffeurHistorique = () => {
    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    const [filter, setFilter] = useState('TOUS'); 
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTripsHistory = useCallback(async () => {
        try {
            // Plus besoin de spécifier les headers ici, 
            // l'intercepteur configuré à l'étape 1 s'en occupe tout seul !
            const response = await api.get('/trajets/mon-historique');
            setTrips(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des trajets:", err);
            setTrips([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // 1. Premier chargement normal à l'ouverture de la page
        fetchTripsHistory();

        // 2. ÉCOUTEUR D'ÉVÉNEMENT : Met à jour la liste en temps réel quand la cloche sonne
        window.addEventListener('actualiserHistorique', fetchTripsHistory);

        // 3. Nettoyage de l'écouteur quand on quitte la page
        return () => {
            window.removeEventListener('actualiserHistorique', fetchTripsHistory);
        };
    }, [fetchTripsHistory]);

    // Filtrage basé sur l'entité Trajet
    const filteredTrips = trips.filter(trip => {
        const matchesFilter = filter === 'TOUS' || trip.statut === filter;
        
        const labelSearch = trip.label ? trip.label.toLowerCase() : "";
        const plaqueSearch = trip.vehicule?.plaque ? trip.vehicule.plaque.toLowerCase() : "";
        
        const matchesSearch = labelSearch.includes(searchTerm.toLowerCase()) || 
                              plaqueSearch.includes(searchTerm.toLowerCase());
                              
        return matchesFilter && matchesSearch;
    });

    const getStatusStyle = (statut) => {
        switch (statut) {
            case 'TERMINE': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'EN_ROUTE': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'DISPONIBLE': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'PROGRAMME': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
            default: return 'text-slate-500 bg-slate-500/10';
        }
    };

    if (loading && trips.length === 0) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <FaHistory className="text-blue-600" /> Historique GariConnect
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                        Suivi des trajets - {trips[0]?.agence?.nom || "Beni, RDC"}
                    </p>
                </div>

                <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto w-full md:w-auto">
                    {['TOUS', 'PROGRAMME', 'DISPONIBLE', 'EN_ROUTE', 'TERMINE'].map((item) => (
                        <button
                            key={item}
                            onClick={() => setFilter(item)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
                                filter === item 
                                ? 'bg-white dark:bg-slate-800 shadow-lg text-blue-600 scale-105 border border-slate-200 dark:border-slate-700' 
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative mb-8">
                <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Rechercher par ville ou plaque d'immatriculation..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 pl-14 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => (
                        <div 
                            key={trip.id} 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all border-l-4"
                            style={{ 
                                borderLeftColor: trip.statut === 'TERMINE' ? '#10b981' : 
                                                 trip.statut === 'EN_ROUTE' ? '#3b82f6' : 
                                                 trip.statut === 'PROGRAMME' ? '#6366f1' : '#f59e0b' 
                            }}
                        >
                            <div className="flex flex-col lg:flex-row justify-between gap-8">
                                <div className="flex-1 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            <FaCalendarAlt className="text-blue-500" />
                                            {trip.dateHeureDepart ? new Date(trip.dateHeureDepart).toLocaleDateString('fr-FR', { 
                                                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
                                            }) : "Date non définie"}
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border ${getStatusStyle(trip.statut)}`}>
                                            {trip.statut}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                                            <FaRoute className="text-blue-600 text-2xl" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black dark:text-white leading-tight">{trip.label}</h4>
                                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">
                                                Identifiant #{trip.id} • {trip.placesDisponibles} places disponibles
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-10">
                                    <div className="text-left lg:text-right">
                                        <div className="flex items-center lg:justify-end gap-2 text-slate-600 dark:text-slate-400 font-black text-xs uppercase">
                                            <FaCarSide /> {trip.vehicule?.plaque || 'Sans immatriculation'}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{trip.vehicule?.modele || 'Modèle standard'}</p>
                                    </div>

                                    <div className="text-right mt-0 lg:mt-6">
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase text-center">Revenu Trajet</p>
                                            <p className="text-2xl font-black text-emerald-500 tracking-tighter">
                                                {trip.prix ? trip.prix.toFixed(2) : "0.00"} <span className="text-xs ml-1">USD</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-32 bg-slate-50 dark:bg-slate-950 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaHistory className="text-slate-400 text-3xl" />
                        </div>
                        <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">Historique Vide</h3>
                        <p className="text-slate-500 font-bold mt-2 px-10">
                            Aucun trajet ne correspond à votre recherche.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChauffeurHistorique;
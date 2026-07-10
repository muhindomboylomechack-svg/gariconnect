import React, { useState, useEffect } from 'react';
import { 
    FaBus, FaRoute, FaTicketAlt, FaWallet, FaUserTie, 
    FaChartLine, FaPhone, FaTimes, FaWhatsapp, 
    FaSync, FaCheckCircle, FaBoxOpen,
    FaUserCheck, FaClock, FaFlagCheckered, FaBoxes, FaMailBulk, FaSearch
} from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';

// Configuration de l'icône du bus pour la carte
const busIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

const DashboardAgence = () => {
    // --- ÉTATS ---
    const [stats, setStats] = useState({
        busCount: 0,
        trajetCount: 0,
        chauffeurCount: 0,
        reservationCount: 0,
        revenuTotal: 0,
        chauffeursDisponibles: 0, 
        chauffeursEnCourse: 0,
        chauffeursTermines: 0,
        colisCount: 0,
        courrierCount: 0
    });
    
    const [graphData, setGraphData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [trajetsEnRoute, setTrajetsEnRoute] = useState([]);
    const [listeChauffeurs, setListeChauffeurs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // --- CHARGEMENT DES DONNÉES ---
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Récupération des statistiques générales
            try {
                const resStats = await api.get('/agences/stats');
                setStats(prev => ({
                    ...prev,
                    ...resStats.data,
                    chauffeursDisponibles: resStats.data.chauffeursDisponibles || 0,
                    chauffeursEnCourse: resStats.data.chauffeursEnCourse || 0,
                    chauffeursTermines: resStats.data.chauffeursTermines || 0
                }));
            } catch (err) {
                console.warn("Erreur Stats Générales:", err);
            }

            // 2. 🟢 RÉCUPÉRATION ET COMPTAGE DES COLIS ET COURRIERS
            try {
                const resCourriers = await api.get('/courriers');
                const listeLogistique = Array.isArray(resCourriers.data) ? resCourriers.data : [];
                
                // On filtre selon le type défini dans votre Backend (Courrier.java)
                const nbColis = listeLogistique.filter(c => c.type === 'COLIS').length;
                const nbCourriers = listeLogistique.filter(c => c.type === 'COURRIER').length;
                
                setStats(prev => ({
                    ...prev,
                    colisCount: nbColis,
                    courrierCount: nbCourriers
                }));
            } catch (err) {
                console.error("Erreur lors de la récupération des courriers:", err);
            }

            // 3. Récupération des données graphiques
            try {
                const resGraph = await api.get('/agences/stats-paiements-semaine');
                setGraphData(Array.isArray(resGraph.data) ? resGraph.data : []);
            } catch (graphErr) {
                console.warn("Erreur Graphique:", graphErr);
                setGraphData([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // --- SUIVI GPS ---
    useEffect(() => {
        let interval;
        if (showMap) {
            const updatePositions = async () => {
                try {
                    const response = await api.get('/trajets/en-route-agence');
                    setTrajetsEnRoute(Array.isArray(response.data) ? response.data : []);
                } catch (error) {
                    console.error("Erreur GPS:", error);
                }
            };
            updatePositions();
            interval = setInterval(updatePositions, 15000);
        }
        return () => clearInterval(interval);
    }, [showMap]);

    // --- GESTION CHAUFFEURS ---
    const handleOuvrirChauffeurs = async () => {
        try {
            const response = await api.get('/chauffeurs/mes-chauffeurs');
            setListeChauffeurs(response.data);
            setShowSupport(true);
        } catch (error) {
            console.error("Erreur chauffeurs:", error);
        }
    };

    const getStatusDetails = (statut) => {
        switch (statut) {
            case 'ACTIF':
            case 'DISPONIBLE':
                return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Disponible' };
            case 'EN_ROUTE':
                return { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'En mission' };
            default:
                return { color: 'text-slate-400', bg: 'bg-slate-800', label: 'Hors ligne' };
        }
    };

    if (loading && stats.busCount === 0 && stats.colisCount === 0) return (
        <div className="h-[60vh] flex flex-col justify-center items-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Synchronisation Agence...</p>
        </div>
    );

    return (
        <div className="space-y-8 p-4 lg:p-2 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Console Agence</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Supervision de la flotte et des flux</p>
                </div>
                <button 
                    onClick={fetchDashboardData} 
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:text-blue-600 transition-all shadow-sm active:scale-95"
                >
                    <FaSync className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Véhicules" value={stats.busCount} icon={<FaBus size={20} />} color="bg-blue-600" />
                <StatCard title="Trajets Actifs" value={stats.trajetCount} icon={<FaRoute size={20} />} color="bg-indigo-600" />
                <StatCard title="Réservations" value={stats.reservationCount} icon={<FaTicketAlt size={20} />} color="bg-purple-600" trend="Live" />
                <StatCard title="Revenu total (FC)" value={Number(stats.revenuTotal || 0).toLocaleString()} icon={<FaWallet size={20} />} color="bg-emerald-600" />
            </div>

            {/* --- SECTION ACTIONS & OPS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Validation Express & Suivi Chauffeurs */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                            <FaCheckCircle className="text-blue-500" /> Mes Chauffeurs
                        </h3>
                        
                        {/* États temps réel des chauffeurs */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-center">
                                <FaUserCheck className="text-emerald-500 mx-auto mb-1" size={14} />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Dispo / Livré</p>
                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{stats.chauffeursDisponibles}</span>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-center">
                                <FaClock className="text-blue-500 mx-auto mb-1" size={14} />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">En Course</p>
                                <span className="font-black text-blue-600 dark:text-blue-400 text-sm">{stats.chauffeursEnCourse}</span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                                <FaFlagCheckered className="text-slate-500 mx-auto mb-1" size={14} />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Terminé</p>
                                <span className="font-black text-slate-700 dark:text-slate-300 text-sm">{stats.chauffeursTermines}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. 🟢 Flux Colis & Courriers (Design Amélioré) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10">
                        <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                            <FaBoxOpen className="text-orange-500" /> Logistique & Messagerie
                        </h3>
                        <div className="space-y-4">
                            
                            {/* Carte Colis */}
                            <div className="p-5 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900 rounded-2xl flex justify-between items-center border border-orange-100 dark:border-orange-900/30 shadow-sm hover:scale-[1.02] transition-transform">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/30">
                                        <FaBoxes size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total Colis</span>
                                        <span className="font-black text-slate-800 dark:text-white text-2xl">{stats.colisCount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Carte Courrier */}
                            <div className="p-5 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-slate-900 rounded-2xl flex justify-between items-center border border-cyan-100 dark:border-cyan-900/30 shadow-sm hover:scale-[1.02] transition-transform">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-500/30">
                                        <FaMailBulk size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total Courriers</span>
                                        <span className="font-black text-slate-800 dark:text-white text-2xl">{stats.courrierCount}</span>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>

                {/* 3. Personnel & GPS */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <FaUserTie className="text-indigo-500" /> Mon Personnel
                    </h3>
                    <div className="space-y-4">
                        <button onClick={() => setShowMap(true)} className="w-full flex justify-between items-center p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 group transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40">
                            <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase italic">Géo-suivi</span>
                            <span className="font-black text-blue-700 dark:text-blue-400 group-hover:underline">Carte Live</span>
                        </button>
                        <button onClick={handleOuvrirChauffeurs} className="w-full p-5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-[0.98]">
                            Annuaire Chauffeurs
                        </button>
                    </div>
                </div>
            </div>

            {/* Section Graphique */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-2 italic uppercase text-xs tracking-widest">
                    <FaChartLine className="text-emerald-500" /> Analyse des réservations (7j)
                </h3>
                <div className="h-72 w-full">
                    {graphData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={graphData}>
                                <defs>
                                    <linearGradient id="colorServ" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis hide domain={[0, 'auto']} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} 
                                />
                                <Area type="monotone" dataKey={(v) => v.services || v.count || 0} stroke="#3b82f6" strokeWidth={4} fill="url(#colorServ)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
                            <FaTicketAlt size={30} className="mb-2 opacity-20" />
                            <p className="font-black uppercase text-[10px]">Aucune donnée disponible</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL CHAUFFEURS DIRECTEMENT INTÉGRÉ --- */}
            {showSupport && (
                <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">Annuaire du Personnel</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Équipe opérationnelle</p>
                            </div>
                            <button onClick={() => setShowSupport(false)} className="p-3 bg-white dark:bg-slate-800 hover:text-red-500 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
                                <FaTimes size={14} />
                            </button>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher un membre de l'équipe..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none font-medium text-xs text-slate-700 dark:text-slate-200 focus:border-blue-500 shadow-sm transition-all"
                                />
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-white dark:bg-slate-900">
                            {listeChauffeurs.filter(c => (c.nom || '').toLowerCase().includes(searchTerm.toLowerCase())).map((chauffeur) => {
                                const status = getStatusDetails(chauffeur.statut);
                                return (
                                    <div key={chauffeur.id} className="p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 text-xs italic border border-slate-200 dark:border-slate-600">
                                                {chauffeur.nom ? chauffeur.nom.substring(0, 2).toUpperCase() : 'CH'}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-tight">{chauffeur.nom || 'Chauffeur anonyme'}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${status.bg} ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{chauffeur.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {chauffeur.telephone && (
                                                <>
                                                    <a href={`tel:${chauffeur.telephone}`} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-blue-500 hover:text-white transition-all border border-slate-100 dark:border-slate-700">
                                                        <FaPhone size={12} />
                                                    </a>
                                                    <a href={`https://wa.me/${chauffeur.telephone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-slate-100 dark:border-slate-700">
                                                        <FaWhatsapp size={12} />
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CARTES GPS --- */}
            {showMap && (
                <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[75vh] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">Suivi Cartographique</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Position en direct de la flotte en route</p>
                            </div>
                            <button onClick={() => setShowMap(false)} className="p-3 bg-white dark:bg-slate-800 hover:text-red-500 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
                                <FaTimes size={14} />
                            </button>
                        </div>
                        <div className="flex-1 relative z-10">
                            <MapContainer center={[-2.5, 28.8]} zoom={6} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {trajetsEnRoute.filter(t => t.latitude && t.longitude).map((trajet) => (
                                    <Marker key={trajet.id} position={[trajet.latitude, trajet.longitude]} icon={busIcon}>
                                        <Popup>
                                            <div className="p-2 font-sans">
                                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">{trajet.depart} → {trajet.destination}</h4>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Chauffeur: {trajet.chauffeurNom || 'Assigné'}</p>
                                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Vitesse: {trajet.vitesse || 0} km/h</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 group transition-all hover:scale-[1.02]">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
                {icon}
            </div>
            {trend && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full uppercase">{trend}</span>}
        </div>
        <div className="mt-4">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white italic">{value}</h3>
        </div>
    </div>
);

export default DashboardAgence;
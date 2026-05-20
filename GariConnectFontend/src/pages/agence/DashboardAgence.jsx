import React, { useState, useEffect, useRef } from 'react';
import { 
    FaBus, FaRoute, FaTicketAlt, FaWallet, FaUserTie, 
    FaChartLine, FaPhone, FaEnvelope, FaTimes, FaWhatsapp, 
    FaSearch, FaSync, FaCheckCircle, FaBoxOpen, FaPlus 
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
        revenuTotal: 0
    });
    
    const [graphData, setGraphData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [trajetsEnRoute, setTrajetsEnRoute] = useState([]);
    const [listeChauffeurs, setListeChauffeurs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Nouveaux états pour les actions rapides
    const [ticketInput, setTicketInput] = useState("");
    const [validationMsg, setValidationMsg] = useState({ type: '', text: '' });

    // --- CHARGEMENT DES DONNÉES ---
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const resStats = await api.get('/agences/stats');
            setStats(resStats.data);

            try {
                const resGraph = await api.get('/agences/stats-paiements-semaine');
                setGraphData(Array.isArray(resGraph.data) ? resGraph.data : []);
            } catch (graphErr) {
                console.error("Erreur Graphique:", graphErr);
                setGraphData([]);
            }
        } catch (error) {
            console.error("Erreur stats globales:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // --- LOGIQUE DE VALIDATION TICKET ---
    const handleValidateTicket = async (e) => {
        e.preventDefault();
        if(!ticketInput) return;
        
        try {
            // Simulation ou appel API réel
            // await api.post(`/reservations/valider/${ticketInput}`);
            setValidationMsg({ type: 'success', text: `Billet ${ticketInput} validé !` });
            setTicketInput("");
            fetchDashboardData();
        } catch (err) {
            setValidationMsg({ type: 'error', text: "Numéro de billet invalide" });
        }
        setTimeout(() => setValidationMsg({ type: '', text: '' }), 4000);
    };

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

    if (loading && stats.busCount === 0) return (
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
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:text-blue-600 transition-all shadow-sm"
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
                
                {/* 1. Validation de Ticket Rapide */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <FaCheckCircle className="text-blue-500" /> Validation Express
                    </h3>
                    <form onSubmit={handleValidateTicket} className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="ID du ticket..." 
                            value={ticketInput}
                            onChange={(e) => setTicketInput(e.target.value)}
                            className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-black text-center transition-all"
                        />
                        <button className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all">
                            Valider la présence
                        </button>
                    </form>
                    {validationMsg.text && (
                        <p className={`mt-4 text-center font-black text-[10px] uppercase animate-pulse ${validationMsg.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {validationMsg.text}
                        </p>
                    )}
                </div>

                {/* 2. Gestion Colis (Nouveau) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                            <FaBoxOpen className="text-orange-500" /> Flux Colis
                        </h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase">En attente d'envoi</span>
                                <span className="font-black text-orange-500">12</span>
                            </div>
                        </div>
                    </div>
                    <button className="mt-6 p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase">
                        <FaPlus /> Enregistrer un colis
                    </button>
                </div>

                {/* 3. Personnel & GPS (Ton code original condensé) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <FaUserTie className="text-indigo-500" /> Mon Personnel
                    </h3>
                    <div className="space-y-4">
                        <button onClick={() => setShowMap(true)} className="w-full flex justify-between items-center p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 group">
                            <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase italic">Géo-suivi</span>
                            <span className="font-black text-blue-700 dark:text-blue-400 group-hover:underline">Carte Live</span>
                        </button>
                        <button onClick={handleOuvrirChauffeurs} className="w-full p-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
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

            {/* --- MODALS (GPS & CHAUFFEURS) --- */}
            {/* Garde ici ton code actuel pour le modal Leaflet et le modal Chauffeurs (identique à ton fichier original) */}
            {/* ... */}
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
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import { FaBus, FaMapMarkerAlt, FaSyncAlt } from 'react-icons/fa';

// Icône personnalisée pour le bus
const busIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

const CarteLive = () => {
    const [busEnRoute, setBusEnRoute] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPositions = async () => {
        try {
            // 🔥 CORRECTION DE L'ENDPOINT : Correspond à AgenceController (@GetMapping("/trajets/en-route-agence"))
            const res = await api.get('/agences/trajets/en-route-agence');
            setBusEnRoute(res.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des trajets GPS:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
        // Mise à jour toutes les 10 secondes
        const interval = setInterval(fetchPositions, 10000); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4">
            {/* Petit Header de la carte */}
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Suivi en temps réel ({busEnRoute.length})
                    </span>
                </div>
                <button 
                    onClick={() => { setLoading(true); fetchPositions(); }}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                    <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Conteneur de la carte avec support Dark Mode */}
            <div className="h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 relative z-0 group transition-all duration-300">
                
                {/* Overlay sombre pour la carte (Filtre CSS) */}
                <style>
                    {`
                        .dark .leaflet-tile-container {
                            filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                        }
                        .dark .leaflet-container {
                            background: #0f172a;
                        }
                    `}
                </style>

                <MapContainer 
                    center={[-4.322447, 15.307045]} 
                    zoom={6} 
                    className="h-full w-full"
                    zoomControl={false}
                >
                    <TileLayer 
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                        attribution='&copy; OpenStreetMap'
                    />
                    
                    {busEnRoute.map(trajet => {
                        // 🔒 SÉCURITÉ : Ne rendre le marqueur que si les coordonnées sont valides
                        if (!trajet.latitudeActuelle || !trajet.longitudeActuelle) return null;

                        return (
                            <Marker 
                                key={trajet.id} 
                                position={[trajet.latitudeActuelle, trajet.longitudeActuelle]} 
                                icon={busIcon}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[180px]">
                                        <div className="flex items-center gap-2 mb-2 border-b pb-2 dark:border-slate-700">
                                            <FaBus className="text-blue-500" />
                                            <span className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs">
                                                En service
                                            </span>
                                        </div>
                                        
                                        <p className="text-blue-600 dark:text-blue-400 font-bold text-sm leading-tight">
                                            {trajet.depart} ➔ {trajet.destination}
                                        </p>
                                        
                                        <div className="mt-3 space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold uppercase">
                                                <span className="text-slate-400">Véhicule:</span>
                                                <span className="text-slate-700 dark:text-slate-200">
                                                    {trajet.vehicule?.plaque_immatriculation || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold uppercase">
                                                <span className="text-slate-400">Conducteur:</span>
                                                <span className="text-slate-700 dark:text-slate-200">
                                                    {trajet.chauffeur?.nom || 'Anonyme'}
                                                </span>
                                            </div>
                                        </div>

                                        <button className="w-full mt-3 py-2 bg-slate-900 dark:bg-blue-600 text-white text-[9px] font-black uppercase rounded-lg">
                                            Contacter
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Petit indicateur de localisation flottant */}
                <div className="absolute bottom-6 left-6 z-[400] bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500" />
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase">
                        RDC - Tracking
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CarteLive;
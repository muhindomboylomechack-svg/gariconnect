import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const GpsEmitter = ({ trajetId, isEnRoute }) => {
    const [tracking, setTracking] = useState(false);
    const [lastPosition, setLastPosition] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        let intervalId = null;

        // Fonction pour récupérer la position GPS du téléphone et l'envoyer au serveur
        const sendCurrentPosition = () => {
            if (!navigator.geolocation) {
                setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, speed } = position.coords;
                    setLastPosition({ latitude, longitude });

                    try {
                        // Envoi de la position au backend vers l'URL PUT
                        await api.put(`/trajets/${trajetId}/localisation`, {
                            latitude: latitude,
                            longitude: longitude,
                            vitesse: speed ? Math.round(speed * 3.6) : 0 // Conversion m/s en km/h
                        });
                        console.log("📍 GPS mis à jour :", latitude, longitude);
                    } catch (err) {
                        console.error("Erreur lors de l'envoi de la position GPS :", err);
                    }
                },
                (err) => {
                    console.error("Erreur d'accès au GPS :", err.message);
                    setErrorMsg("Veuillez autoriser l'accès au GPS.");
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        };

        // L'émission ne démarre que si le trajet est démarré / "EN_ROUTE"
        if (isEnRoute && trajetId) {
            setTracking(true);
            sendCurrentPosition(); // Premier envoi immédiat

            // Envoi répétitif toutes les 30 secondes (30000 ms)
            intervalId = setInterval(sendCurrentPosition, 30000);
        } else {
            setTracking(false);
        }

        // Nettoyage de l'intervalle lorsque le composant est démonté ou le trajet terminé
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [trajetId, isEnRoute]);

    return (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${tracking ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {tracking ? "Suivi GPS Actif" : "Suivi GPS Inactif"}
                    </span>
                </div>
                {lastPosition && (
                    <span className="text-[10px] text-slate-400 font-mono">
                        {lastPosition.latitude.toFixed(4)}, {lastPosition.longitude.toFixed(4)}
                    </span>
                )}
            </div>
            {errorMsg && <p className="text-red-400 text-[10px] font-bold mt-2">{errorMsg}</p>}
        </div>
    );
};

export default GpsEmitter;
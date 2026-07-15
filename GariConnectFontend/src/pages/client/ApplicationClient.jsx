import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import de l'instance API centralisée
import api from '../../services/api';

// --- CONFIGURATION DES ICONES PERSONNALISÉES ---
const arretIcon = new L.DivIcon({
    html: `<span style="background-color:#3b82f6; width:24px; height:24px; display:block; border-radius:50%; border:3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></span>`,
    className: 'custom-client-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const busIcon = new L.DivIcon({
    html: `<div style="position:relative;">
            <span style="background-color:#f59e0b; width:28px; height:28px; display:flex; justify-content:center; align-items:center; border-radius:50%; border:2px solid white; box-shadow: 0 0 12px rgba(245,158,11,0.6); font-size:14px;">🚌</span>
           </div>`,
    className: 'custom-bus-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

// NOUVEAU : Icône pour la position EXACTE du client (Point bleu pulsant en direct)
const clientExactIcon = new L.DivIcon({
    html: `<div style="position:relative; display:flex; justify-content:center; align-items:center; width:24px; height:24px;">
            <span style="position:absolute; background-color:#3b82f6; width:100%; height:100%; border-radius:50%; opacity:0.5; animation: pulse 1.5s infinite;"></span>
            <span style="background-color:#1d4ed8; width:12px; height:12px; display:block; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4); z-index:2;"></span>
           </div>
           <style>
             @keyframes pulse {
               0% { transform: scale(1); opacity: 0.7; }
               100% { transform: scale(2.5); opacity: 0; }
             }
           </style>`,
    className: 'custom-live-client-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const ApplicationClient = () => {
    const [reservation, setReservation] = useState(null);
    const [arretMontage, setArretMontage] = useState(null);
    const [busPosition, setBusPosition] = useState(null);
    const [detailsBus, setDetailsBus] = useState(null);
    
    // NOUVEAU : État pour stocker la vraie localisation en temps réel du client
    const [positionExacteClient, setPositionExacteClient] = useState(null); 
    
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState("");
    const [distanceRestante, setDistanceRestante] = useState(null);

    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    const chargerReservationActive = async () => {
        try {
            const response = await api.get('/reservations/active', { headers });
            const data = response.data;
            
            if (data) {
                setReservation(data);
                setArretMontage(data.arretMontage);
                setDetailsBus(data.vehicule);
                
                if (data.courseId) {
                    chargerPositionBus(data.courseId, data.arretMontage);
                }
            }
            setLoading(false);
        } catch (err) {
            console.error("Erreur lors du chargement de la réservation", err);
            setLoading(false);
        }
    };

    const chargerPositionBus = async (courseId, arretClient) => {
        try {
            const response = await api.get(`/courses/${courseId}/position`, { headers })
                .catch(() => ({
                    data: { latitude: arretClient.latitude - 0.015, longitude: arretClient.longitude - 0.012 }
                }));

            const posBus = response.data;
            setBusPosition([posBus.latitude, posBus.longitude]);

            if (arretClient) {
                const dist = calculerDistance(posBus.latitude, posBus.longitude, arretClient.latitude, arretClient.longitude);
                setDistanceRestante(dist.toFixed(1));

                if (dist <= 0.5 && reservation?.statut === "EN_ATTENTE_A_L_ARRET") {
                    setNotification(`📢 Votre bus approche de l'${arretClient.nom}, préparez-vous à embarquer !`);
                } else if (reservation?.statut === "A_BORD") {
                    setNotification("✅ Vous êtes à bord. Bon voyage !");
                } else {
                    setNotification(`Le bus est actuellement à ${dist.toFixed(1)} km de votre arrêt.`);
                }
            }
        } catch (err) {
            console.error("Erreur coordonnées bus", err);
        }
    };

    const calculerDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Rafraîchissement automatique du bus
    useEffect(() => {
        chargerReservationActive();
        const interval = setInterval(() => {
            if (reservation?.courseId && arretMontage) {
                chargerPositionBus(reservation.courseId, arretMontage);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [reservation?.id]);

    // NOUVEAU : Suivi de la position exacte du client via le GPS de l'appareil
    useEffect(() => {
        let watchId;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    setPositionExacteClient([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => console.warn("Suivi GPS client indisponible:", err),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    if (loading) return <div style={styles.loader}>📱 Chargement de votre espace passager GariConnect...</div>;

    return (
        <div style={styles.container}>
            {notification && (
                <div style={{
                    ...styles.notificationBanner,
                    backgroundColor: distanceRestante <= 0.5 ? '#ef4444' : '#1e3a8a'
                }}>
                    {notification}
                </div>
            )}

            <div style={styles.mapWrapper}>
                {arretMontage ? (
                    <MapContainer 
                        center={[arretMontage.latitude, arretMontage.longitude]} 
                        zoom={14} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        
                        {/* Marqueur de l'arrêt prévu */}
                        <Marker position={[arretMontage.latitude, arretMontage.longitude]} icon={arretIcon}>
                            <Popup>
                                <strong>Votre arrêt de montée :</strong><br />
                                {arretMontage.nom}
                            </Popup>
                        </Marker>

                        {/* NOUVEAU : Marqueur de la vraie position actuelle du client */}
                        {positionExacteClient && (
                            <Marker position={positionExacteClient} icon={clientExactIcon}>
                                <Popup><strong>Vous êtes ici (Position exacte)</strong></Popup>
                            </Marker>
                        )}

                        {/* Marqueur du bus */}
                        {busPosition && (
                            <>
                                <Marker position={busPosition} icon={busIcon}>
                                    <Popup>
                                        <strong>Bus {detailsBus?.immatriculation || ""}</strong><br />
                                        Chauffeur : {detailsBus?.chauffeurNom || "Assigné"}
                                    </Popup>
                                </Marker>

                                <Polyline 
                                    positions={[busPosition, [arretMontage.latitude, arretMontage.longitude]]} 
                                    pathOptions={{ color: '#6366f1', weight: 3, dashArray: '5, 10' }} 
                                />
                            </>
                        )}
                    </MapContainer>
                ) : (
                    <div style={styles.noMapState}>
                        <p>Sélectionnez un trajet ou effectuez une réservation pour activer la carte de suivi.</p>
                    </div>
                )}
            </div>

            <div style={styles.ticketPanel}>
                {!reservation ? (
                    <div style={styles.noReservation}>
                        <h3>Aucune réservation active 🎫</h3>
                        <p>Vous n'avez pas de voyage prévu aujourd'hui. Choisissez votre arrêt de montée et réservez un ticket pour commencer votre suivi.</p>
                        <button style={styles.primaryButton}>Réserver un trajet</button>
                    </div>
                ) : (
                    <div>
                        <div style={styles.ticketHeader}>
                            <div>
                                <span style={styles.badgeStatut(reservation.statut)}>
                                    {reservation.statut.replace(/_/g, ' ')}
                                </span>
                                <h3 style={styles.ticketTitle}>Votre Ticket GariConnect</h3>
                            </div>
                            <div style={styles.etaContainer}>
                                <p style={styles.etaLabel}>Distance estimée</p>
                                <p style={styles.etaValue}>{distanceRestante ? `${distanceRestante} km` : '--'}</p>
                            </div>
                        </div>

                        <div style={styles.ticketBody}>
                            <div style={styles.routeStep}>
                                <div style={styles.stepDotBlue}></div>
                                <div>
                                    <p style={styles.stepLabel}>Arrêt de montée (Prise en charge)</p>
                                    <p style={styles.stepValue}>{arretMontage?.nom || "Non défini"}</p>
                                </div>
                            </div>

                            <div style={styles.routeLine}></div>

                            <div style={styles.routeStep}>
                                <div style={styles.stepDotRed}></div>
                                <div>
                                    <p style={styles.stepLabel}>Arrêt de descente (Destination)</p>
                                    <p style={styles.stepValue}>{reservation.arretDescente?.nom || "Non défini"}</p>
                                </div>
                            </div>
                        </div>

                        <div style={styles.ticketFooter}>
                            <div style={styles.footerInfo}>
                                <span>Numéro de Siège</span>
                                <strong>{reservation.numeroSiege || "Libre"}</strong>
                            </div>
                            <div style={styles.footerInfo}>
                                <span>Code de Validation</span>
                                <strong style={{ color: '#1e40af' }}>{reservation.codeTicket || "N/A"}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: '"Segoe UI", sans-serif', backgroundColor: '#f8fafc' },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a' },
    notificationBanner: { position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 1000, color: 'white', padding: '12px 16px', borderRadius: '12px', fontWeight: '600', fontSize: '13px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.3s ease' },
    mapWrapper: { flex: 1, width: '100%', height: '100%' },
    noMapState: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', padding: '20px', textAlign: 'center' },
    ticketPanel: { backgroundColor: '#ffffff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px 24px', boxShadow: '0 -8px 24px rgba(15,23,42,0.08)', zIndex: 999 },
    noReservation: { textAlign: 'center', padding: '10px 0' },
    primaryButton: { width: '100%', backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', marginTop: '12px', cursor: 'pointer' },
    ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    ticketTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '4px 0 0 0' },
    badgeStatut: (statut) => {
        let bg = '#e0f2fe', color = '#0369a1';
        if (statut === 'A_BORD') { bg = '#dcfce7'; color = '#15803d'; }
        if (statut === 'DEPOSE') { bg = '#f1f5f9'; color = '#475569'; }
        return { backgroundColor: bg, color: color, fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' };
    },
    etaContainer: { textAlign: 'right' },
    etaLabel: { fontSize: '11px', color: '#64748b', margin: 0 },
    etaValue: { fontSize: '18px', fontWeight: '800', color: '#1e40af', margin: 0 },
    ticketBody: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '16px' },
    routeStep: { display: 'flex', gap: '12px', alignItems: 'center' },
    stepDotBlue: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' },
    stepDotRed: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' },
    stepLabel: { fontSize: '11px', color: '#94a3b8', margin: 0 },
    stepValue: { fontSize: '14px', fontWeight: '600', color: '#334155', margin: 0 },
    routeLine: { width: '2px', height: '16px', backgroundColor: '#cbd5e1', marginLeft: '4px', marginVertical: '4px' },
    ticketFooter: { display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' },
    footerInfo: { display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: '#64748b' }
};

export default ApplicationClient;
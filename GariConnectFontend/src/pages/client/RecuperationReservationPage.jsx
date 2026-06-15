import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
    FaMoon, FaSun, FaChair, FaExclamationTriangle,
    FaHome, FaPaperPlane, FaChevronLeft
} from 'react-icons/fa';

import FormulaireRecuperation from './FormulaireRecuperation';

const RecuperationReservationPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();
    
    const [trajet, setTrajet] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialisation à true car on est explicitement sur la page de récupération VIP
    const [recuperationData, setRecuperationData] = useState({ voulaitRecuperation: true });
    const [darkMode, setDarkMode] = useState(localStorage.getItem('client-theme') === 'dark');

    useEffect(() => {
        const fetchTrajet = async () => {
            try {
                const res = await api.get('/trajets');
                const found = res.data.find(t => t.id === parseInt(id));
                
                if (found) {
                    setTrajet(found);
                    if (found.placesDisponibles > 0) {
                        setSelectedSeat('1');
                    }
                } else {
                    console.error("Trajet introuvable dans la liste renvoyée par le serveur.");
                }
            } catch (err) {
                console.error("Erreur chargement trajet :", err);
            } finally {
                if (loading) setLoading(false);
            }
        };
        fetchTrajet();
    }, [id]);

    const handleCotationSubmit = async () => {
        if (!user?.id) return alert(t('auth_error') || "Veuillez vous reconnecter.");
        if (!selectedSeat) return alert(t('select_seat_error') || "Veuillez choisir un siège.");
        
        // Vérification des coordonnées ou de l'adresse textuelle fournie par l'enfant
        if (!recuperationData.adresseTextuelle && (!recuperationData.latitudeClient || !recuperationData.longitudeClient)) {
            return alert("Veuillez vous localiser sur la carte ou fournir une adresse textuelle exacte pour le ramassage.");
        }

        setIsSubmitting(true);
        try {
            // 1. Création de la réservation avec le statut "EN_ATTENTE_COTATION"
            const reservationPayload = {
                trajet: { id: parseInt(id) },
                client: { id: user.id },
                numeroSiege: parseInt(selectedSeat),
                montantPaye: trajet.prix, 
                statut: "EN_ATTENTE_COTATION"
            };

            const resReservation = await api.post('/reservations', reservationPayload);
            const reservationId = resReservation.data.id;

            // 2. Envoi des données de récupération vers '/recuperations' en POST
            await api.post('/recuperations', {
                reservationId: reservationId,
                latitudeClient: recuperationData.latitudeClient,
                longitudeClient: recuperationData.longitudeClient,
                adresseTextuelle: recuperationData.adresseTextuelle
            });

            alert("✅ Demande envoyée avec succès ! L'agence va calculer vos frais kilométriques. Vous recevrez une notification pour payer le montant total (Billet + Course).");
            navigate('/client/dashboard'); 
        } catch (error) {
            console.error("Erreur Cotation:", error);
            alert("Une erreur est survenue lors de la soumission de votre demande. Vérifiez la console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('client-theme', newMode ? 'dark' : 'light');
    };

    if (loading) {
        return (
            <div className={`h-screen w-full flex items-center justify-center font-black animate-pulse transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
                Chargement...
            </div>
        );
    }

    if (!trajet) {
        return (
            <div className={`h-screen w-full flex flex-col items-center justify-center p-4 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
                <p className="text-center text-xl font-bold mb-4">Trajet introuvable</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2">
                    <FaChevronLeft /> Retour
                </button>
            </div>
        );
    }

    const isFull = !trajet.placesDisponibles || trajet.placesDisponibles <= 0;

    return (
        <div className={`min-h-screen w-full transition-colors duration-500 flex flex-col items-center justify-start md:justify-center p-4 sm:p-6 md:p-8 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            
            {/* Barre d'outils supérieure responsive */}
            <div className="w-full max-w-xl flex justify-between items-center mb-6 z-10 px-2">
                <button 
                    onClick={() => navigate(-1)} 
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-sm border text-sm transition-all active:scale-95 ${
                        darkMode 
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' 
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <FaChevronLeft size={12} />
                    <span>Retour</span>
                </button>

                <button 
                    onClick={toggleTheme} 
                    className={`p-3 rounded-xl shadow-sm border transition-all active:scale-95 ${
                        darkMode 
                            ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    {darkMode ? <FaSun size={18}/> : <FaMoon size={18}/>}
                </button>
            </div>

            {/* Conteneur principal de la Carte adaptatif */}
            <div className={`w-full max-w-xl rounded-3xl sm:rounded-[2.5rem] md:rounded-[3rem] shadow-xl overflow-hidden border transition-all duration-300 ${
                darkMode 
                    ? 'bg-slate-900 border-slate-800/80 shadow-black/40' 
                    : 'bg-white border-slate-100 shadow-slate-200/60'
            }`}>
                
                {/* Header VIP/Domicile - Responsive Padding */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 sm:p-8 md:p-10 text-white text-center relative overflow-hidden">
                    <FaHome className="absolute -top-6 -right-6 text-emerald-500/20 text-8xl sm:text-9xl pointer-events-none" />
                    <span className="relative z-10 text-[10px] sm:text-xs font-black uppercase bg-black/20 px-4 py-1 rounded-full mb-3 inline-block tracking-widest">
                        {trajet?.agence?.nom || "Agence GariConnect"}
                    </span>
                    <h2 className="relative z-10 text-xl sm:text-2xl font-black tracking-tight">Récupération VIP à Domicile</h2>
                    <p className="relative z-10 text-emerald-100 text-xs sm:text-sm mt-1.5 font-semibold bg-emerald-700/30 inline-block px-4 py-1 rounded-full">
                        {trajet?.depart} <span className="text-emerald-300 mx-1">➔</span> {trajet?.destination}
                    </p>
                </div>

                {/* Corps du formulaire - Adaptatif sur mobile */}
                <div className="p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
                    
                    {/* Section Sélection Siège */}
                    <div>
                        <label className={`block text-[11px] font-black uppercase mb-2.5 ml-1 tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <FaChair className="inline mr-1.5 text-emerald-500 mb-0.5"/> {t('seat_number') || "Numéro de Siège"}
                        </label>
                        
                        {isFull ? (
                            <div className="w-full p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2">
                                <FaExclamationTriangle /> {t('bus_full') || "Autobus Complet"}
                            </div>
                        ) : (
                            <div className="relative">
                                <select 
                                    className={`w-full p-4 sm:p-5 rounded-2xl outline-none font-black text-lg sm:text-xl text-center border-2 appearance-none transition-all cursor-pointer ${
                                        darkMode 
                                            ? 'bg-slate-950 text-white border-slate-800 focus:border-emerald-500' 
                                            : 'bg-slate-50 text-slate-800 border-slate-200 focus:border-emerald-400'
                                    }`}
                                    value={selectedSeat}
                                    onChange={(e) => setSelectedSeat(e.target.value)}
                                >
                                    {[...Array(trajet.placesDisponibles).keys()].map(i => (
                                        <option key={i + 1} value={i + 1} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}>
                                            {t('seat') || "Siège"} {i + 1}
                                        </option>
                                    ))}
                                </select>
                                {/* Indicateur visuel personnalisé pour le sélecteur */}
                                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 sm:px-5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    ▼
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Encadré Prix de base (Billet) réactif */}
                    <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border text-center transition-colors ${
                        darkMode 
                            ? 'bg-emerald-950/10 border-emerald-950/40' 
                            : 'bg-emerald-50/50 border-emerald-100'
                    }`}>
                        <p className={`text-[10px] font-black uppercase mb-1 tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            Prix de base du billet
                        </p>
                        <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                            {trajet?.prix?.toLocaleString()} <span className="text-sm font-bold">FC</span>
                        </p>
                        <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 mt-2.5 uppercase tracking-wide bg-rose-500/10 dark:bg-rose-500/20 inline-block px-3 py-1 rounded-lg">
                            + Frais kilométriques de ramassage après cotation
                        </p>
                    </div>

                    {/* Injection du Formulaire Enfant de récupération */}
                    <div className={`rounded-2xl border transition-colors ${darkMode ? 'border-slate-800/60' : 'border-slate-100'}`}>
                        <FormulaireRecuperation 
                            reservationId={parseInt(id)} 
                            onDataChange={(data) => setRecuperationData(prev => ({ ...prev, ...data }))} 
                        />
                    </div>

                    {/* Bouton d'action principal adaptatif */}
                    <button 
                        onClick={handleCotationSubmit}
                        disabled={isFull || !selectedSeat || isSubmitting}
                        className={`w-full font-black py-4 sm:py-5 rounded-2xl sm:rounded-3xl uppercase text-xs tracking-widest transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1 shadow-lg ${
                            (isFull || !selectedSeat) 
                                ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none' 
                                : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-emerald-500/20 dark:hover:bg-emerald-500'
                        }`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2 animate-pulse">Traitement en cours...</span>
                        ) : isFull ? (
                            "AUTOBUS COMPLET"
                        ) : (
                            <>
                                <span className="flex items-center gap-2 text-sm">
                                    <FaPaperPlane size={13} /> Demander une cotation
                                </span>
                                <span className={`text-[9px] font-medium normal-case ${darkMode ? 'text-emerald-300' : 'text-emerald-100'}`}>
                                    Aucun paiement immédiat requis — validation de l'itinéraire d'abord
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecuperationReservationPage;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
    FaMoon, FaSun, FaChair, FaExclamationTriangle,
    FaHome, FaPaperPlane
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

    // État local pour le formulaire de récupération
    const [recuperationData, setRecuperationData] = useState({ voulaitRecuperation: false });
    const [darkMode, setDarkMode] = useState(localStorage.getItem('client-theme') === 'dark');

    useEffect(() => {
        const fetchTrajet = async () => {
            try {
                // 🔥 CORRECTION DÉFINITIVE : On appelle l'URL exacte définie dans votre TrajetController
                const res = await api.get('/trajets');
                
                // On cherche le trajet spécifique dans la liste renvoyée par le backend
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
                setLoading(false);
            }
        };
        fetchTrajet();
    }, [id]);

    const handleCotationSubmit = async () => {
        if (!user?.id) return alert(t('auth_error') || "Veuillez vous reconnecter.");
        if (!selectedSeat) return alert(t('select_seat_error') || "Veuillez choisir un siège.");
        
        if (!recuperationData.voulaitRecuperation) {
            return alert("Veuillez cocher l'option de récupération et remplir vos informations de localisation.");
        }

        if (!recuperationData.latitudeClient && !recuperationData.adresseTextuelle) {
            return alert("Veuillez vous localiser sur la carte ou fournir une adresse textuelle exacte.");
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

            // 2. Envoi des coordonnées GPS à l'agence
            await api.post('/recuperations/demande', {
                reservationId: reservationId,
                latitudeClient: recuperationData.latitudeClient,
                longitudeClient: recuperationData.longitudeClient,
                adresseTextuelle: recuperationData.adresseTextuelle
            });

            alert("✅ Demande envoyée avec succès ! L'agence va calculer vos frais kilométriques. Vous recevrez une notification pour payer le montant total (Billet + Course).");
            navigate('/client/dashboard'); 
        } catch (error) {
            console.error("Erreur Cotation:", error);
            alert("Une erreur est survenue lors de la soumission de votre demande.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('client-theme', newMode ? 'dark' : 'light');
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">Chargement...</div>;
    if (!trajet) return <div className="text-center p-10 font-bold">Trajet introuvable</div>;

    const isFull = !trajet.placesDisponibles || trajet.placesDisponibles <= 0;

    return (
        <div className={`min-h-screen transition-colors duration-500 flex flex-col items-center justify-center p-4 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            
            <button onClick={toggleTheme} className={`fixed top-6 right-6 p-4 rounded-2xl shadow-lg border transition-all z-10 ${darkMode ? 'bg-slate-900 border-slate-800 text-yellow-400' : 'bg-white border-slate-200 text-slate-400'}`}>
                {darkMode ? <FaSun size={20}/> : <FaMoon size={20}/>}
            </button>

            <div className={`max-w-md w-full rounded-[3rem] shadow-2xl overflow-hidden border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-slate-100'}`}>
                
                {/* Header VIP/Domicile */}
                <div className="bg-emerald-600 p-10 text-white text-center relative overflow-hidden">
                    <FaHome className="absolute -top-4 -right-4 text-emerald-500/30 text-9xl" />
                    <span className="relative z-10 text-[10px] font-black uppercase bg-black/20 px-4 py-1 rounded-full mb-4 inline-block tracking-widest">
                        {trajet?.agence?.nom || "Agence GariConnect"}
                    </span>
                    <h2 className="relative z-10 text-2xl font-black tracking-tighter">Récupération VIP</h2>
                    <p className="relative z-10 text-emerald-100 text-sm mt-2 font-bold">{trajet?.depart} ➔ {trajet?.destination}</p>
                </div>

                <div className="p-10">
                    <div className="mb-8">
                        <label className={`block text-[10px] font-black uppercase mb-3 ml-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <FaChair className="inline mr-2 text-emerald-500"/> {t('seat_number')}
                        </label>
                        
                        {isFull ? (
                            <div className="w-full p-5 rounded-[1.5rem] bg-red-500/10 border-2 border-red-500/30 text-red-500 font-bold text-sm flex items-center justify-center gap-2">
                                <FaExclamationTriangle /> {t('bus_full') || "Complet"}
                            </div>
                        ) : (
                            <>
                                <select 
                                    className={`w-full p-5 rounded-[1.5rem] outline-none font-black text-xl text-center border-2 appearance-none transition-all cursor-pointer ${darkMode ? 'bg-slate-950 text-white border-slate-800 focus:border-emerald-500' : 'bg-slate-50 text-slate-800 border-slate-100 focus:border-emerald-300'}`}
                                    value={selectedSeat}
                                    onChange={(e) => setSelectedSeat(e.target.value)}
                                >
                                    {[...Array(trajet.placesDisponibles).keys()].map(i => (
                                        <option key={i + 1} value={i + 1} className={`${darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-800'}`}>
                                            {t('seat') || "Siège"} {i + 1}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>

                    <div className={`p-8 rounded-[2rem] border-2 mb-6 text-center ${darkMode ? 'bg-emerald-900/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className="text-[10px] font-black uppercase mb-1 text-emerald-500 tracking-widest">Prix de base (Billet)</p>
                        <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                            {trajet?.prix?.toLocaleString()} <span className="text-sm font-bold">FC</span>
                        </p>
                        <p className="text-[9px] font-bold text-rose-500 mt-2 uppercase tracking-wide bg-rose-500/10 inline-block px-3 py-1 rounded-lg">
                            + Frais kilométriques à coter
                        </p>
                    </div>

                    <div className="mb-8">
                        <FormulaireRecuperation 
                            reservationId={parseInt(id)} 
                            onDataChange={(data) => setRecuperationData(data)} 
                        />
                    </div>

                    <button 
                        onClick={handleCotationSubmit}
                        disabled={isFull || !selectedSeat || isSubmitting}
                        className={`w-full font-black py-5 rounded-[1.8rem] uppercase text-xs tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${
                            (isFull || !selectedSeat) 
                            ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-500/20'
                        }`}
                    >
                        {isSubmitting ? (
                            "Traitement..."
                        ) : isFull ? (
                            "COMPLET"
                        ) : (
                            <>
                                <span className="flex items-center gap-2"><FaPaperPlane /> Demander une cotation</span>
                                <span className="text-[9px] text-emerald-200 font-medium normal-case">Aucun paiement immédiat requis</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecuperationReservationPage;
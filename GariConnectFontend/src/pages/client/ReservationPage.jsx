import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
    FaMoon, FaSun, FaTimes, FaChair, 
    FaCheck, FaMoneyBillWave, FaHome, FaTicketAlt, FaPaperPlane
} from 'react-icons/fa';

// Importation du composant enfant pour le ramassage à domicile
import FormulaireRecuperation from './FormulaireRecuperation';

const ReservationPage = () => {
    const { id } = useParams(); // 🔥 Représente l'ID du TRAJET sélectionné
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();
    
    // États du Trajet et de l'Interface
    const [trajet, setTrajet] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState('');
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('client-theme') === 'dark');
    
    // États du Processus de Réservation et Modals
    const [showModal, setShowModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Choix explicite du type de voyage (Standard vs Ramassage à domicile VIP)
    const [isVip, setIsVip] = useState(false);
    const [recuperationData, setRecuperationData] = useState(null);

    const [paymentData, setPaymentData] = useState({ 
        modePaiement: 'M-PESA', 
        referenceTransaction: '' 
    });

    // Écouteur pour appliquer la classe "dark" globalement pour Tailwind
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        const fetchTrajet = async () => {
            try {
                // Appel optimisé pour récupérer les détails du trajet
                const res = await api.get(`/trajets/${id}?t=${Date.now()}`);
                setTrajet(res.data);
                
                // Présélection automatique de la première place disponible
                if (res.data && res.data.placesDisponibles > 0) {
                    setSelectedSeat('1');
                }
            } catch (err) {
                console.error("Erreur lors du chargement du trajet :", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrajet();
    }, [id]);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('client-theme', newMode ? 'dark' : 'light');
    };

    // ====================================================================
    // SOUMISSION METIER : ENCHAÎNEMENT DES ACTIONS 
    // ====================================================================
    
    // ACTION 1 : Clic sur le bouton principal (Standard ou VIP)
    const handleInitialSubmit = () => {
        if (!user?.id) return alert(t('auth_error') || "Veuillez vous reconnecter.");
        
        if (!isVip) {
            // Mode STANDARD : On doit choisir un siège et on passe au paiement
            if (!selectedSeat) return alert(t('select_seat_error') || "Veuillez choisir un siège.");
            setShowModal(true);
            setPaymentStep(1);
        } else {
            // Mode VIP : Pas de siège à choisir immédiatement, pas de paiement. On lance la création directe.
            if (!recuperationData || !recuperationData.adresseTextuelle) {
                return alert("Veuillez valider votre adresse sur la carte avant de continuer.");
            }
            creerReservationVIP();
        }
    };

    // ACTION 2-VIP : Création de la réservation + Demande VIP (SANS PAIEMENT)
    const creerReservationVIP = async () => {
        setIsSubmitting(true);
        try {
            // 1. Création de la réservation de base (sans numéro de siège strict pour l'instant)
            const reservationPayload = {
                trajet: { id: parseInt(id) },
                numeroSiege: 0, 
                montantPaye: trajet?.prix || 0,
                statut: "ATTENTE_PAIEMENT" 
            };

            const resReservation = await api.post('/reservations/creer', reservationPayload);
            const nouvelleReservationId = resReservation.data.id;

            if (!nouvelleReservationId) throw new Error("Erreur de génération du billet.");

            // 2. Lancement de la demande VIP avec le VRAI identifiant généré
            await api.post('/recuperations/creer', {
                reservationId: nouvelleReservationId,
                latitudeClient: parseFloat(recuperationData.latitudeClient) || 0.0,
                longitudeClient: parseFloat(recuperationData.longitudeClient) || 0.0,
                adresseTextuelle: recuperationData.adresseTextuelle
            });

            alert("Succès ! Votre demande de ramassage a été envoyée. L'agence va calculer votre tarif kilométrique.");
            navigate('/client/historique');

        } catch (error) {
            console.error("Erreur cycle VIP :", error);
            const errorMessage = error.response?.data?.message || "Erreur de connexion.";
            alert("Échec de la demande : " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ACTION 2-STANDARD : Finalisation du paiement (Déclenché depuis la Modale)
    const handleFinalizePaymentStandard = async (isCash = false) => {
        if (!isCash && !paymentData.referenceTransaction) return alert(t('transaction_id_error') || "L'ID de transaction est requis.");
        
        setIsSubmitting(true);
        try {
            // 1. Création de la réservation
            const reservationPayload = {
                trajet: { id: parseInt(id) },
                numeroSiege: parseInt(selectedSeat),
                montantPaye: trajet?.prix || 0,
                statut: "ATTENTE_PAIEMENT"
            };
            const resReservation = await api.post('/reservations/creer', reservationPayload);
            const reservationId = resReservation.data.id;

            // 2. Finalisation du paiement
            const mode = isCash ? "CASH" : paymentData.modePaiement;
            const ref = isCash ? "CAISSE" : paymentData.referenceTransaction;

            await api.patch(`/reservations/${reservationId}/finaliser`, {
                modePaiement: mode,
                referenceTransaction: ref
            });
            
            alert(isCash ? "Réservation en attente (Paiement physique à valider à l'agence)" : "Réservation validée et confirmée avec succès !");
            setShowModal(false);
            navigate('/client/historique'); 
            
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Erreur lors du paiement.";
            alert("Échec de la réservation : " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className={`h-screen w-full flex items-center justify-center font-black text-center p-4 animate-pulse transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-indigo-400' : 'bg-slate-50 text-indigo-600'}`}>
            CHARGEMENT DU TRAJET...
        </div>
    );

    if (!trajet) return (
        <div className={`h-screen w-full flex items-center justify-center font-bold p-10 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            Trajet introuvable.
        </div>
    );
    
    const isFull = !trajet.placesDisponibles || trajet.placesDisponibles <= 0;

    return (
        <div className={`min-h-screen w-full transition-colors duration-500 flex flex-col items-center justify-center py-6 px-4 md:py-12 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            
            {/* Bouton Theme dark/light */}
            <button 
                onClick={toggleTheme} 
                className={`fixed top-4 right-4 md:top-6 md:right-6 p-3 md:p-4 rounded-2xl shadow-lg border z-10 transition-all active:scale-[0.95] ${darkMode ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
                {darkMode ? <FaSun size={20}/> : <FaMoon size={20}/>}
            </button>

            {/* Conteneur principal Responsive adaptif */}
            <div className={`w-full max-w-md md:max-w-2xl lg:max-w-4xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border transition-all duration-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                
                {/* Structure en Grille Responsive : 1 colonne sur Mobile, multi-colonnes sur grand écran */}
                <div className="lg:grid lg:grid-cols-12 min-h-[500px]">
                    
                    {/* Header Ticket (Bandeau du haut ou colonne latérale sur grand écran) */}
                    <div className="bg-indigo-600 p-6 md:p-10 text-white text-center flex flex-col justify-center items-center lg:col-span-4 transition-colors duration-500">
                        <span className="text-[10px] font-black uppercase bg-black/20 px-4 py-1 rounded-full mb-3 inline-block tracking-wider">
                            {trajet?.agence?.nom || "Agence Partenaire"}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Réservation</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base font-medium break-words w-full px-2">
                            {trajet?.depart} ➔ {trajet?.destination}
                        </p>
                    </div>

                    {/* Section Formulaires / Actions */}
                    <div className="p-6 md:p-10 lg:col-span-8 flex flex-col justify-between">
                        <div>
                            {/* CHOIX DU TYPE DE VOYAGE (STANDARD VS VIP) */}
                            <div className="mb-6 md:mb-8">
                                <label className={`block text-[10px] font-black uppercase mb-3 tracking-wider transition-colors duration-500 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Type de voyage
                                </label>
                                <div className={`flex p-1.5 rounded-2xl transition-all duration-500 ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                                    <button 
                                        type="button"
                                        onClick={() => setIsVip(false)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs transition-all ${!isVip ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        <FaTicketAlt size={14} /> Standard
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsVip(true)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs transition-all ${isVip ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        <FaHome size={14} /> Ramassage VIP
                                    </button>
                                </div>
                            </div>

                            {/* CONDITION CONDITIONNELLE : Choix du siège uniquement si Standard */}
                            {!isVip ? (
                                <div className="mb-6 md:mb-8">
                                    <label className={`block text-[10px] font-black uppercase mb-3 tracking-wider transition-colors duration-500 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <FaChair className="inline mr-2 text-indigo-500" size={12}/> Choix du siège
                                    </label>
                                    {isFull ? (
                                        <div className="w-full p-4 rounded-2xl bg-red-500/10 text-red-500 font-black text-sm text-center tracking-widest border border-red-500/20 animate-pulse">
                                            COMPLET
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select 
                                                className={`w-full p-4 rounded-2xl outline-none font-black text-lg md:text-xl text-center border-2 appearance-none cursor-pointer transition-all duration-500 focus:ring-4 focus:ring-indigo-500/10 ${darkMode ? 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500' : 'bg-slate-50 text-slate-800 border-slate-200 focus:border-indigo-400'}`}
                                                value={selectedSeat}
                                                onChange={(e) => setSelectedSeat(e.target.value)}
                                            >
                                                {[...Array(trajet.placesDisponibles).keys()].map(i => (
                                                    <option key={i + 1} value={i + 1} className="text-slate-900 dark:text-white bg-white dark:bg-slate-950 font-bold">
                                                        Siège N° {i + 1}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Si c'est VIP, formulaire de ramassage */
                                <div className={`mb-6 md:mb-8 p-4 md:p-6 border-2 rounded-2xl transition-all duration-500 w-full overflow-hidden ${darkMode ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-500/30 bg-emerald-50/30'}`}>
                                    <h3 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 mb-4 tracking-wider flex items-center gap-2">
                                        📍 Où devons-nous vous chercher ?
                                    </h3>
                                    <FormulaireRecuperation 
                                        onDataChange={(data) => setRecuperationData(data)} 
                                    />
                                </div>
                            )}

                            {/* AFFICHAGE DU PRIX TOTAL DU BILLET */}
                            <div className={`p-5 md:p-6 rounded-3xl border-2 mb-6 text-center transition-all duration-500 ${darkMode ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50/50 border-indigo-100'}`}>
                                <p className={`text-[10px] font-black uppercase mb-1 tracking-wider ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Montant du Billet</p>
                                <p className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                    {trajet?.prix?.toLocaleString()} <span className="text-sm font-bold">FC</span>
                                </p>
                                {isVip && (
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 animate-pulse">
                                        ⏳ + Frais de ramassage (À coter par l'agence)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* BOUTON D'ACTION DYNAMIQUE */}
                        <button 
                            onClick={handleInitialSubmit}
                            disabled={isFull || isSubmitting || (!isVip && !selectedSeat)}
                            className={`w-full font-black py-4 md:py-5 rounded-2xl uppercase text-xs transition-all shadow-lg flex items-center justify-center gap-2 tracking-wider active:scale-[0.99] ${isFull ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none' : (isVip ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20')}`}
                        >
                            {isSubmitting ? "Traitement..." : (isVip ? <><FaPaperPlane /> Envoyer demande de ramassage</> : "Procéder au paiement")}
                        </button>

                    </div>
                </div>
            </div>

            {/* FENÊTRE DIALOGUE (MODAL) DU PAIEMENT MOBILE MONEY (Réservée au mode Standard) */}
            {showModal && !isVip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
                    <div className={`w-full max-w-sm rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative shadow-2xl transition-all duration-500 border ${darkMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-100'}`}>
                        
                        {/* Bouton de fermeture */}
                        <button 
                            onClick={() => setShowModal(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <FaTimes size={20}/>
                        </button>

                        {/* Étape Écran 1 : Résumé des montants */}
                        {paymentStep === 1 ? (
                            <div className="text-center py-2">
                                <h3 className="text-xl font-black mb-4 md:mb-6 tracking-tight">Résumé</h3>
                                <div className={`p-5 rounded-2xl mb-6 space-y-4 transition-all duration-500 border ${darkMode ? 'bg-slate-950 border-slate-800/60' : 'bg-slate-50 border-slate-200/60'}`}>
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Type de Voyage</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">Standard</span>
                                    </div>
                                    <div className={`flex justify-between items-center text-xs font-bold uppercase tracking-wider border-t pt-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Total Billet</span>
                                        <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                                            {trajet?.prix?.toLocaleString()} FC
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setPaymentStep(2)} 
                                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-500 transition-colors text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                                >
                                    Choisir le paiement
                                </button>
                            </div>
                        ) : (
                            /* Étape Écran 2 : Sélection de la passerelle de règlement */
                            <div className="space-y-4 md:space-y-5 py-2">
                                <h3 className="text-xl font-black text-center mb-2 tracking-tight">Paiement</h3>
                                
                                <button 
                                    onClick={() => handleFinalizePaymentStandard(true)} 
                                    disabled={isSubmitting} 
                                    className={`w-full p-4 rounded-xl font-black text-xs border-2 flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${darkMode ? 'border-slate-800 text-white hover:bg-slate-950' : 'border-slate-200 text-slate-800 hover:bg-slate-50'}`}
                                >
                                    <FaMoneyBillWave className="text-emerald-500 flex-shrink-0" size={16}/> PAYER À L'AGENCE (CASH)
                                </button>
                                
                                <div className={`pt-4 border-t space-y-3 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                    <div className="relative">
                                        <select 
                                            className={`w-full p-4 rounded-xl font-bold border-2 bg-transparent outline-none appearance-none transition-all duration-500 cursor-pointer ${darkMode ? 'border-slate-800 text-white focus:border-indigo-500 bg-slate-950' : 'border-slate-200 text-slate-800 focus:border-indigo-400 bg-white'}`}
                                            onChange={(e) => setPaymentData({...paymentData, modePaiement: e.target.value})}
                                            value={paymentData.modePaiement}
                                        >
                                            <option value="M-PESA" className="text-slate-900 dark:bg-slate-950 dark:text-white font-bold">M-PESA</option>
                                            <option value="ORANGE_MONEY" className="text-slate-900 dark:bg-slate-950 dark:text-white font-bold">ORANGE MONEY</option>
                                        </select>
                                    </div>
                                    
                                    <input 
                                        type="text" 
                                        placeholder="ID Transaction Mobile Money" 
                                        className={`w-full p-4 rounded-xl font-bold border-2 bg-transparent outline-none transition-all duration-500 ${darkMode ? 'border-slate-800 text-white focus:border-indigo-500 placeholder-slate-600' : 'border-slate-200 text-slate-800 focus:border-indigo-400 placeholder-slate-400'}`}
                                        onChange={(e) => setPaymentData({...paymentData, referenceTransaction: e.target.value})} 
                                        value={paymentData.referenceTransaction}
                                    />
                                </div>

                                <button 
                                    onClick={() => handleFinalizePaymentStandard(false)} 
                                    disabled={!paymentData.referenceTransaction || isSubmitting} 
                                    className={`w-full font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all text-xs tracking-wider active:scale-[0.98] ${!paymentData.referenceTransaction || isSubmitting ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'}`}
                                >
                                    {isSubmitting ? "Traitement..." : <><FaCheck size={12}/> CONFIRMER LE PAIEMENT</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationPage;
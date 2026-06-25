import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
    FaMoon, FaSun, FaTimes, FaChair, 
    FaCheck, FaMoneyBillWave, FaHome, FaTicketAlt, FaPaperPlane, FaMapMarkerAlt
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
    const [arretsDisponibles, setArretsDisponibles] = useState([]); // 📍 Liste de tous les arrêts affichables
    const [selectedSeat, setSelectedSeat] = useState('');
    const [selectedArret, setSelectedArret] = useState(''); // 📍 Arrêt sélectionné par le client
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

    // Fonction isolée pour charger les données du trajet ET la liste des arrêts
    const fetchInitialData = async () => {
        try {
            // 🛠️ MODIFICATION LIGNE 57 : Récupération du trajet et appel de la route par ID trajet
            const [resTrajet, resArrets] = await Promise.all([
                api.get(`/trajets/${id}?t=${Date.now()}`),
                api.get(`/arrets/trajet/${id}`).catch(() => ({ data: [] })) // Appelle les arrêts spécifiques à ce trajet
            ]);
            
            setTrajet(resTrajet.data);
            
            // 🟢 LOGIQUE DES ARRÊTS : On prend en priorité les arrêts retournés par la route par trajet dédiée
            const listeArrets = (resArrets.data && resArrets.data.length > 0) 
                ? resArrets.data 
                : (resTrajet.data.arrets && resTrajet.data.arrets.length > 0 ? resTrajet.data.arrets : []);
            
            setArretsDisponibles(listeArrets);

            // Présélection du premier arrêt de la liste
            if (listeArrets.length > 0) {
                setSelectedArret(listeArrets[0].id.toString());
            }
            
            // Présélection automatique de la première place disponible
            if (resTrajet.data && resTrajet.data.placesDisponibles > 0) {
                setSelectedSeat('1');
            } else {
                setSelectedSeat('');
            }

        } catch (err) {
            console.error("Erreur lors du chargement des données :", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchInitialData();
        }
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
        
        // Sécurité Frontend : On revérifie l'état actuel des places chargées
        if (trajet?.placesDisponibles <= 0) {
            return alert("Désolé, ce trajet vient d'être complété entre-temps.");
        }

        // Sécurité commune : Peu importe le mode, un siège doit être choisi
        if (!selectedSeat) return alert(t('select_seat_error') || "Veuillez choisir un siège.");

        // Sécurité Arrêt : Un arrêt doit être sélectionné si des arrêts sont disponibles en Standard
        if (!isVip && arretsDisponibles.length > 0 && !selectedArret) {
            return alert("Veuillez sélectionner un arrêt de bus pour votre montée.");
        }

        if (!isVip) {
            // Mode STANDARD : On passe à l'affichage de la modale de paiement direct
            setShowModal(true);
            setPaymentStep(1);
        } else {
            // Mode VIP : Validation de l'adresse requise avant envoi de la demande
            if (!recuperationData || !recuperationData.adresseTextuelle) {
                return alert("Veuillez valider votre adresse sur la carte avant de continuer.");
            }
            creerReservationVIP();
        }
    };

    // ACTION 2-VIP : Création de la réservation + Demande VIP (SANS PAIEMENT IMMEDIAT)
    const creerReservationVIP = async () => {
        setIsSubmitting(true);
        try {
            // 1. Création de la réservation de base
            const reservationPayload = {
                trajet: { id: parseInt(id) },
                numeroSiege: parseInt(selectedSeat)
                // En mode VIP, l'arrêt physique n'est pas obligatoire car le chauffeur vient à domicile
            };

            const resReservation = await api.post('/reservations/creer', reservationPayload);
            const nouvelleReservationId = resReservation.data.id;

            if (!nouvelleReservationId) throw new Error("Erreur de génération du billet.");

            // 2. Lancement de la demande VIP liée à la réservation
            await api.post('/recuperations/creer', {
                reservationId: nouvelleReservationId,
                latitudeClient: parseFloat(recuperationData.latitudeClient) || 0.0,
                longitudeClient: parseFloat(recuperationData.longitudeClient) || 0.0,
                adresseTextuelle: recuperationData.adresseTextuelle
            });

            alert("Succès ! Votre place a été bloquée et votre demande de ramassage a été envoyée. L'agence va calculer votre tarif kilométrique.");
            navigate('/client/historique');

        } catch (error) {
            console.error("Erreur cycle VIP :", error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || "Erreur de connexion.";
            alert("Échec de la demande : " + errorMessage);
            fetchInitialData(); 
        } finally {
            setIsSubmitting(false);
        }
    };

    // ACTION 2-STANDARD : Finalisation du paiement (Déclenché depuis la Modale)
    const handleFinalizePaymentStandard = async (isCash = false) => {
        if (!isCash && !paymentData.referenceTransaction) return alert(t('transaction_id_error') || "L'ID de transaction est requis.");
        
        setIsSubmitting(true);
        try {
            // 1. Création de la réservation avec l'arrêt choisi
            const reservationPayload = {
                trajet: { id: parseInt(id) },
                numeroSiege: parseInt(selectedSeat),
                // 🟢 Envoi de l'arretMontage formaté pour la base de données
                arretMontage: selectedArret ? { id: parseInt(selectedArret) } : null
            };
            
            const resReservation = await api.post('/reservations/creer', reservationPayload);
            const reservationId = resReservation.data.id;

            // 2. Finalisation classique par Mobile Money ou Cash
            const mode = isCash ? "CASH" : paymentData.modePaiement;
            const ref = isCash ? "CAISSE" : paymentData.referenceTransaction;

            await api.put(`/reservations/${reservationId}/finaliser`, {
                modePaiement: mode,
                referenceTransaction: ref
            });
            
            alert(isCash ? "Réservation en attente (Paiement physique à valider à l'agence)" : "Réservation validée et confirmée avec succès !");
            setShowModal(false);
            navigate('/client/historique'); 
            
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || "Erreur lors de la procédure.";
            alert("Échec de la réservation : " + errorMessage);
            fetchInitialData(); 
            setShowModal(false);
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
                
                {/* Structure en Grille Responsive */}
                <div className="lg:grid lg:grid-cols-12 min-h-[500px]">
                    
                    {/* Header Ticket */}
                    <div className="bg-indigo-600 p-6 md:p-10 text-white text-center flex flex-col justify-center items-center lg:col-span-4 transition-colors duration-500">
                        <span className="text-[10px] font-black uppercase bg-black/20 px-4 py-1 rounded-full mb-3 inline-block tracking-wider">
                            {trajet?.agence?.nom || "Agence Partenaire"}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Réservation</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base font-medium break-words w-full px-2">
                            {trajet?.depart} ➔ {trajet?.destination}
                        </p>
                        <span className="text-xs font-bold mt-4 bg-white/20 px-3 py-1 rounded-lg">
                            🎫 {trajet?.placesDisponibles} places restantes
                        </span>
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

                            {/* 🟢 LISTE DES ARRÊTS DE MONTÉE FILTRÉS PAR LE TRAJET */}
                            {!isVip && arretsDisponibles.length > 0 && (
                                <div className="mb-6 md:mb-8">
                                    <label className={`block text-[10px] font-black uppercase mb-3 tracking-wider transition-colors duration-500 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <FaMapMarkerAlt className="inline mr-2 text-indigo-500" size={12}/> Arrêt de montée
                                    </label>
                                    <div className="relative">
                                        <select 
                                            className={`w-full p-4 rounded-2xl outline-none font-bold text-sm border-2 appearance-none cursor-pointer transition-all duration-500 focus:ring-4 focus:ring-indigo-500/10 ${darkMode ? 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500' : 'bg-slate-50 text-slate-800 border-slate-200 focus:border-indigo-400'}`}
                                            value={selectedArret}
                                            onChange={(e) => setSelectedArret(e.target.value)}
                                        >
                                            {arretsDisponibles.map((arr) => (
                                                <option key={arr.id} value={arr.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-950">
                                                    {arr.nom} {arr.reperes ? `(${arr.reperes})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* SÉLECTION DE LA PLACE */}
                            <div className="mb-6 md:mb-8">
                                <label className={`block text-[10px] font-black uppercase mb-3 tracking-wider transition-colors duration-500 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <FaChair className="inline mr-2 text-indigo-500" size={12}/> Sélection de la place
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
                                                    Réserver {i + 1} {i + 1 > 1 ? 'places' : 'place'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* FORMULAIRE CONDITIONNEL DU RAMASSAGE VIP */}
                            {isVip && (
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
                            disabled={isFull || isSubmitting || !selectedSeat}
                            className={`w-full font-black py-4 md:py-5 rounded-2xl uppercase text-xs transition-all shadow-lg flex items-center justify-center gap-2 tracking-wider active:scale-[0.99] ${isFull || !selectedSeat ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none' : (isVip ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20')}`}
                        >
                            {isSubmitting ? "Traitement..." : (isVip ? <><FaPaperPlane /> Envoyer demande de ramassage VIP</> : "Procéder au paiement")}
                        </button>

                    </div>
                </div>
            </div>

            {/* FENÊTRE DIALOGUE (MODAL) DU PAIEMENT MOBILE MONEY */}
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
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Siège Sélectionné</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">N° {selectedSeat}</span>
                                    </div>
                                    {selectedArret && arretsDisponibles && (
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                                            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Arrêt Choisi</span>
                                            <span className="text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">
                                                {arretsDisponibles.find(a => a.id.toString() === selectedArret)?.nom || "Sélectionné"}
                                            </span>
                                        </div>
                                    )}
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
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
    FaMoon, FaSun, FaTimes, FaUsers, 
    FaCheck, FaMoneyBillWave, FaHome, FaTicketAlt, FaPaperPlane, FaMapMarkerAlt,
    FaMinus, FaPlus
} from 'react-icons/fa';
import FormulaireRecuperation from './FormulaireRecuperation';

const ReservationPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();
    
    const [trajet, setTrajet] = useState(null);
    const [arretsDisponibles, setArretsDisponibles] = useState([]);
    const [nombrePlaces, setNombrePlaces] = useState(1);
    const [selectedArret, setSelectedArret] = useState('');
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('client-theme') === 'dark');
    
    const [showModal, setShowModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isVip, setIsVip] = useState(false);
    const [recuperationData, setRecuperationData] = useState(null);
    const [paymentData, setPaymentData] = useState({ 
        modePaiement: 'M-PESA', 
        referenceTransaction: '' 
    });

    const placesDisponibles = trajet?.placesDisponibles ?? trajet?.places_disponible ?? trajet?.places_dispombles ?? 0;
    const isFull = placesDisponibles <= 0;
    const prixUnitaire = trajet?.prix || 0;
    const prixTotalBillet = prixUnitaire * nombrePlaces;

    // Fonction utilitaire pour extraire l'ID peu importe la structure renvoyée par Spring Boot
    const getReservationId = (response) => {
        if (!response || !response.data) return null;
        return response.data.id || 
               response.data.data?.id || 
               response.data.body?.id || 
               response.data.reservation?.id ||
               null;
    };

    useEffect(() => {
        const handleSyncTheme = (e) => {
            if (e.key === 'client-theme') {
                setDarkMode(e.newValue === 'dark');
            }
        };
        window.addEventListener('storage', handleSyncTheme);
        return () => window.removeEventListener('storage', handleSyncTheme);
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            
            const resTrajet = await api.get(`/trajets/${id}?t=${Date.now()}`, config);
            
            let listArrets = [];
            try {
                 const resArrets = await api.get(`/arrets/trajet/${id}`, config);
                 listArrets = resArrets.data || [];
            } catch (errArret) {
                 console.warn("Impossible de charger les arrêts spécifiques via la route dédiée :", errArret);
            }
            
            const fetchedTrajet = resTrajet.data;
            setTrajet(fetchedTrajet);
            
            const arretsDefinitifs = (listArrets.length > 0) 
                ? listArrets 
                : (fetchedTrajet?.arrets && fetchedTrajet.arrets.length > 0 ? fetchedTrajet.arrets : []);
            
            setArretsDisponibles(arretsDefinitifs);
            if (arretsDefinitifs.length > 0) {
                setSelectedArret(arretsDefinitifs[0].id.toString());
            }
            
            const initialAvailable = fetchedTrajet?.placesDisponibles ?? fetchedTrajet?.places_disponible ?? fetchedTrajet?.places_disponibles ?? 0;
            if (initialAvailable > 0) {
                setNombrePlaces(1);
            } else {
                setNombrePlaces(0);
            }
        } catch (err) {
            console.error("Erreur lors du chargement des données :", err);
            if (err.response && (err.response.status === 404 || err.response.status === 405 || err.response.status === 403)) {
                alert("Ce trajet n'est plus accessible ou vous n'avez pas les permissions requises.");
                navigate('/');
            }
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

    const incrementPlaces = () => {
        const maxPlaces = placesDisponibles ? Math.min(placesDisponibles, 10) : 10;
        if (nombrePlaces < maxPlaces) {
            setNombrePlaces(prev => prev + 1);
        }
    };

    const decrementPlaces = () => {
        if (nombrePlaces > 1) {
            setNombrePlaces(prev => prev - 1);
        }
    };

    const handleInitialSubmit = () => {
        if (!user?.id && !localStorage.getItem('token')) {
             return alert(t('auth_error') || "Veuillez vous connecter pour effectuer une réservation.");
        }
        
        if (isFull) {
            return alert("Désolé, ce trajet vient d'être complété entre-temps.");
        }
        if (nombrePlaces <= 0 || nombrePlaces > placesDisponibles) {
            return alert("Veuillez choisir une quantité de places valide.");
        }
        if (!isVip && arretsDisponibles.length > 0 && !selectedArret) {
            return alert("Veuillez sélectionner un arrêt de bus pour votre montée.");
        }
        if (!isVip) {
            setShowModal(true);
            setPaymentStep(1);
        } else {
            if (!recuperationData || !recuperationData.adresseTextuelle) {
                return alert("Veuillez valider votre adresse sur la carte avant de continuer.");
            }
            creerReservationVIP();
        }
    };

    const creerReservationVIP = async () => {
        setIsSubmitting(true);
        try {
            const reservationPayload = {
                trajet: { id: parseInt(id) },
                nombrePlaces: parseInt(nombrePlaces),
                typeReservation: "VIP",
                estPaye: false,
                adresseRecuperation: recuperationData.adresseTextuelle,
                latitude: parseFloat(recuperationData.latitudeClient) || 0.0,
                longitude: parseFloat(recuperationData.longitudeClient) || 0.0,
                coutRecuperation: parseFloat(recuperationData.coutRecuperation) || 0.0
            };

            console.log("🚀 Payload envoyé au Backend (VIP) :", reservationPayload);
            const resReservation = await api.post('/reservations/creer', reservationPayload);
            
            console.log("🔍 Réponse brute du serveur (VIP) :", resReservation.data);
            const reservationId = getReservationId(resReservation);

            if (!reservationId) {
                throw new Error("Le serveur Spring Boot n'a pas renvoyé d'identifiant (ID) de réservation valide.");
            }

            alert("Succès ! Vos places ont été bloquées (En attente de paiement) et vos coordonnées de récupération GPS ont bien été enregistrées.");
            navigate('/client/historique');
        } catch (error) {
            console.error("Erreur cycle VIP :", error);
            const errorMessage = error.response?.data?.erreur || error.response?.data?.message || error.message || "Erreur de connexion avec le serveur.";
            alert("Échec de la demande VIP : " + errorMessage);
            fetchInitialData(); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalizePaymentStandard = async (isCash = false) => {
        if (!isCash && !paymentData.referenceTransaction) {
            return alert(t('transaction_id_error') || "L'ID de transaction est requis.");
        }
        
        setIsSubmitting(true);
        try {
            const reservationPayload = {
                trajet: { id: parseInt(id) },
                nombrePlaces: parseInt(nombrePlaces),
                typeReservation: "STANDARD",
                estPaye: false 
            };
            
            if (selectedArret) {
                 reservationPayload.arretMontage = { id: parseInt(selectedArret) };
            }
            
            console.log("🚀 Payload envoyé au Backend (STANDARD) :", reservationPayload);
            const resReservation = await api.post('/reservations/creer', reservationPayload);
            
            console.log("🔍 Réponse brute du serveur (STANDARD) :", resReservation.data);
            const reservationId = getReservationId(resReservation);
            
            if (!reservationId) {
                throw new Error("Le serveur Spring Boot n'a pas renvoyé d'identifiant (ID) de réservation valide.");
            }

            if (isCash) {
                await api.post(`/reservations/${reservationId}/intention-cash`, {
                    modePaiement: "CASH"
                });
                alert("Réservation enregistrée avec succès !");
            } else {
                await api.put(`/reservations/${reservationId}/finaliser`, {
                    modePaiement: paymentData.modePaiement,
                    referenceTransaction: paymentData.referenceTransaction
                });
                alert("Réservation validée et confirmée avec succès !");
            }
            
            setShowModal(false);
            navigate('/client/historique'); 
            
        } catch (error) {
            console.error("Détails de l'erreur:", error.response || error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Erreur lors de la procédure.";
            let alertMsg = errorMessage;
            if (typeof errorMessage === 'object') {
                 alertMsg = JSON.stringify(errorMessage);
            }
            alert("Échec de la réservation : " + alertMsg);
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
            Trajet introuvable ou indisponible actuellement.
        </div>
    );

    return (
        <div className={`min-h-screen w-full transition-colors duration-500 flex flex-col items-center justify-center py-6 px-4 md:py-12 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            
            <button 
                onClick={toggleTheme} 
                className={`fixed top-4 right-4 md:top-6 md:right-6 p-3 md:p-4 rounded-2xl shadow-lg border z-10 transition-all active:scale-[0.95] ${darkMode ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
                {darkMode ? <FaSun size={20}/> : <FaMoon size={20}/>}
            </button>

            <div className={`w-full max-w-md md:max-w-2xl lg:max-w-4xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border transition-all duration-500 ${darkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-100'}`}>
                <div className="lg:grid lg:grid-cols-12 min-h-[500px]">
                    
                    <div className="bg-indigo-600 p-6 md:p-10 text-white text-center flex flex-col justify-center items-center lg:col-span-4 transition-colors duration-500">
                        <span className="text-[10px] font-black uppercase bg-black/20 px-4 py-1 rounded-full mb-3 inline-block tracking-wider">
                            {trajet?.agence?.nom || "Agence Partenaire"}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Réservation</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base font-medium break-words w-full px-2">
                            {trajet?.depart} ➔ {trajet?.destination}
                        </p>
                        <span className={`text-xs font-bold mt-4 px-3 py-1 rounded-lg ${isFull ? 'bg-red-500/80' : 'bg-white/20'}`}>
                            {isFull ? '❌ Complet' : `🎫 ${placesDisponibles} places restantes`}
                        </span>
                    </div>

                    <div className="p-6 md:p-10 lg:col-span-8 flex flex-col justify-between">
                        <div>
                            <div className="mb-6 md:mb-8">
                                <label className={`block text-[10px] font-black uppercase mb-3 tracking-wider transition-colors duration-500 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Type de voyage
                                </label>
                                <div className={`flex p-1.5 rounded-2xl transition-all duration-500 ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                                    <button 
                                        type="button"
                                        onClick={() => setIsVip(false)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs transition-all ${!isVip ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                                    >
                                        <FaTicketAlt size={14} /> Standard
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsVip(true)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs transition-all ${isVip ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                                    >
                                        <FaHome size={14} /> Ramassage VIP
                                    </button>
                                </div>
                            </div>

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

                            <div className="mb-6 md:mb-8">
                                <label className={`block text-[10px] font-black uppercase mb-3 tracking-wider transition-colors duration-500 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <FaUsers className="inline mr-2 text-indigo-500" size={12}/> Nombre de places à réserver
                                </label>
                                {isFull ? (
                                    <div className="w-full p-4 rounded-2xl bg-red-500/10 text-red-500 font-black text-sm text-center tracking-widest border border-red-500/20 animate-pulse">
                                        COMPLET
                                    </div>
                                ) : (
                                    <div className={`flex items-center justify-between p-2 rounded-2xl border-2 transition-all duration-500 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <button
                                            type="button"
                                            onClick={decrementPlaces}
                                            disabled={nombrePlaces <= 1}
                                            className={`p-4 rounded-xl flex items-center justify-center transition-all ${nombrePlaces <= 1 ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'}`}
                                        >
                                            <FaMinus size={14} />
                                        </button>
                                        
                                        <div className="text-center">
                                            <span className="text-xl md:text-2xl font-black block">
                                                {nombrePlaces}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                                                {nombrePlaces > 1 ? 'Places sélectionnées' : 'Place sélectionnée'}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={incrementPlaces}
                                            disabled={nombrePlaces >= Math.min(placesDisponibles, 10)}
                                            className={`p-4 rounded-xl flex items-center justify-center transition-all ${nombrePlaces >= Math.min(placesDisponibles, 10) ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'}`}
                                        >
                                            <FaPlus size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

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

                            <div className={`p-5 md:p-6 rounded-3xl border-2 mb-6 text-center transition-all duration-500 ${darkMode ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50/50 border-indigo-100'}`}>
                                <p className={`text-[10px] font-black uppercase mb-1 tracking-wider ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Total Billet(s)</p>
                                <p className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                    {prixTotalBillet.toLocaleString()} <span className="text-sm font-bold">FC</span>
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                    ({prixUnitaire.toLocaleString()} FC x {nombrePlaces})
                                </p>
                                {isVip && (
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                                        ⏳ + Frais de ramassage (À fixer par l'agence)
                                    </p>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={handleInitialSubmit}
                            disabled={isFull || isSubmitting || nombrePlaces <= 0}
                            className={`w-full font-black py-4 md:py-5 rounded-2xl uppercase text-xs transition-all shadow-lg flex items-center justify-center gap-2 tracking-wider active:scale-[0.99] ${isFull || nombrePlaces <= 0 ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none' : (isVip ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20')}`}
                        >
                            {isSubmitting ? "Traitement..." : (isVip ? <><FaPaperPlane /> Envoyer demande de ramassage VIP</> : "Procéder au paiement")}
                        </button>
                    </div>
                </div>
            </div>

            {showModal && !isVip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
                    <div className={`w-full max-w-sm rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative shadow-2xl transition-all duration-500 border ${darkMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-100'}`}>
                        
                        <button 
                            onClick={() => setShowModal(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <FaTimes size={20}/>
                        </button>

                        {paymentStep === 1 ? (
                            <div className="text-center py-2">
                                <h3 className="text-xl font-black mb-4 md:mb-6 tracking-tight">Résumé</h3>
                                <div className={`p-5 rounded-2xl mb-6 space-y-4 transition-all duration-500 border ${darkMode ? 'bg-slate-950 border-slate-800/60' : 'bg-slate-50 border-slate-200/60'}`}>
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Type de Voyage</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">Standard</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Places choisies</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">{nombrePlaces}</span>
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
                                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Total à payer</span>
                                        <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                                            {prixTotalBillet.toLocaleString()} FC
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
                            <div className="space-y-4 md:space-y-5 py-2">
                                <h3 className="text-xl font-black text-center mb-2 tracking-tight">Paiement</h3>
                                
                                <button 
                                    type="button"
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
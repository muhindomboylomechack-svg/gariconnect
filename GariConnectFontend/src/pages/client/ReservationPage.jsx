import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Import de l'instance API centralisée
import api from '../../services/api';
import { useTranslation } from 'react-i18next'; // Hook pour les langues
import { useAuth } from '../../context/AuthContext';
import { 
    FaMoon, FaSun, FaTimes, FaChair, FaInfoCircle, 
    FaCheck, FaMoneyBillWave, FaExclamationTriangle
} from 'react-icons/fa';

// Importation du composant de récupération à domicile créé à l'étape 2
import FormulaireRecuperation from './FormulaireRecuperation';

const ReservationPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation(); // Initialisation de la traduction
    
    const [trajet, setTrajet] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentData, setPaymentData] = useState({ 
        modePaiement: 'M-PESA', 
        referenceTransaction: '' 
    });

    // État local pour stocker les données du formulaire de récupération à domicile
    const [recuperationData, setRecuperationData] = useState({ voulaitRecuperation: false });

    const [darkMode, setDarkMode] = useState(localStorage.getItem('client-theme') === 'dark');

    useEffect(() => {
        const fetchTrajet = async () => {
            try {
                // Utilisation de l'instance api centralisée
                const res = await api.get('/trajets/tous');
                const found = res.data.find(t => t.id === parseInt(id));
                setTrajet(found);
                
                // Présélectionner automatiquement le premier siège disponible si possible
                if (found && found.placesDisponibles > 0) {
                    setSelectedSeat('1');
                }
            } catch (err) {
                console.error("Erreur chargement trajet", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrajet();
    }, [id]);

    const handleFinalSubmit = async (isCash = false) => {
        
        if (!user?.id) return alert(t('auth_error') || "Reconnectez-vous.");
        if (!selectedSeat) return alert(t('select_seat_error') || "Choisissez un siège.");
        if (!isCash && !paymentData.referenceTransaction) return alert(t('transaction_id_error') || "ID Transaction requis.");

        setIsSubmitting(true);

        try {
            const reservationPayload = {
                trajet: { id: parseInt(id) },
                client: { id: user.id },
                numeroSiege: parseInt(selectedSeat),
                montantPaye: trajet.prix,
                statut: "ATTENTE_PAIEMENT"
            };

            // 1. Enregistrement de la réservation initiale du billet
            const resReservation = await api.post('/reservations', reservationPayload);
            const reservationId = resReservation.data.id;

            // 2. AJOUT : Si le voyageur a coché l'option de récupération, on envoie la demande au backend
            if (recuperationData.voulaitRecuperation) {
                await api.post('/recuperations/demande', {
                    reservationId: reservationId,
                    latitudeClient: recuperationData.latitudeClient,
                    longitudeClient: recuperationData.longitudeClient,
                    adresseTextuelle: recuperationData.adresseTextuelle
                });
            }

            const mode = isCash ? "CASH" : paymentData.modePaiement;
            const ref = isCash ? "CAISSE" : paymentData.referenceTransaction;

            // 3. Enregistrement du paiement lié
            await api.post(`/paiements/payer/${reservationId}?mode=${mode}&reference=${ref}`, {});
            
            alert(isCash ? t('success_cash') : t('success_mobile'));
            navigate('/client/dashboard');
        } catch (error) {
            console.error("Erreur:", error);
            alert(t('generic_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('client-theme', newMode ? 'dark' : 'light');
    };

    if (loading) return (
        <div className={`h-screen flex items-center justify-center font-black animate-pulse ${darkMode ? 'bg-slate-950 text-indigo-500' : 'bg-slate-50 text-indigo-600'}`}>
            {t('loading_trip').toUpperCase()}...
        </div>
    );

    if (!trajet) return <div className="text-center p-10 font-bold">{t('trip_not_found')}</div>;

    // Vérifier si le trajet est complet
    const isFull = !trajet.placesDisponibles || trajet.placesDisponibles <= 0;

    return (
        <div className={`min-h-screen transition-colors duration-500 flex flex-col items-center justify-center p-4 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            
            {/* Bouton Theme */}
            <button onClick={toggleTheme} className={`fixed top-6 right-6 p-4 rounded-2xl shadow-lg border transition-all z-10 ${darkMode ? 'bg-slate-900 border-slate-800 text-yellow-400' : 'bg-white border-slate-200 text-slate-400'}`}>
                {darkMode ? <FaSun size={20}/> : <FaMoon size={20}/>}
            </button>

            <div className={`max-w-md w-full rounded-[3rem] shadow-2xl overflow-hidden border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-black/50' : 'bg-white border-slate-100'}`}>
                
                {/* Header (Indigo Style) */}
                <div className="bg-indigo-600 p-10 text-white text-center">
                    <span className="text-[10px] font-black uppercase bg-black/20 px-4 py-1 rounded-full mb-4 inline-block tracking-widest">
                        {trajet?.agence?.nom || "Agence GariConnect"}
                    </span>
                    <h2 className="text-3xl font-black tracking-tighter">{t('book_ticket')}</h2>
                    <p className="text-indigo-100 text-sm mt-2 opacity-80">{trajet?.depart} ➔ {trajet?.destination}</p>
                </div>

                <div className="p-10">
                    {/* Sélection Siège Dynamique avec support Sombre/Clair parfait */}
                    <div className="mb-8">
                        <label className={`block text-[10px] font-black uppercase mb-3 ml-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <FaChair className="inline mr-2 text-indigo-500"/> {t('seat_number')}
                        </label>
                        
                        {isFull ? (
                            <div className="w-full p-5 rounded-[1.5rem] bg-red-500/10 border-2 border-red-500/30 text-red-500 font-bold text-sm flex items-center justify-center gap-2">
                                <FaExclamationTriangle /> {t('bus_full') || "Désolé, ce trajet est complet !"}
                            </div>
                        ) : (
                            <>
                                <select 
                                    className={`w-full p-5 rounded-[1.5rem] outline-none font-black text-xl text-center border-2 appearance-none transition-all cursor-pointer ${
                                        darkMode 
                                        ? 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500' 
                                        : 'bg-slate-50 text-slate-800 border-slate-100 focus:border-indigo-300'
                                    }`}
                                    value={selectedSeat}
                                    onChange={(e) => setSelectedSeat(e.target.value)}
                                >
                                    {[...Array(trajet.placesDisponibles).keys()].map(i => (
                                        <option 
                                            key={i + 1} 
                                            value={i + 1}
                                            className={`${darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-800'}`}
                                        >
                                            {t('seat') || "Siège"} {i + 1}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs font-bold text-emerald-500 mt-2 ml-2">
                                    🟢 {trajet.placesDisponibles} {t('available_seats') || "places encore disponibles"}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Affichage Prix */}
                    <div className={`p-8 rounded-[2rem] border-2 mb-6 text-center ${darkMode ? 'bg-indigo-900/20 border-indigo-900/40' : 'bg-indigo-50 border-indigo-100'}`}>
                        <p className="text-[10px] font-black uppercase mb-1 text-indigo-400 tracking-widest">{t('amount_to_pay')}</p>
                        <p className="text-4xl font-black text-indigo-500 dark:text-indigo-400">
                            {trajet?.prix?.toLocaleString()} <span className="text-sm font-bold">FC</span>
                        </p>
                    </div>

                    {/* INTEGRATION DE L'ETAPE 2 : Insertion du module de géolocalisation à domicile */}
                    <div className="mb-8">
                        <FormulaireRecuperation 
                            reservationId={parseInt(id)} 
                            onDataChange={(data) => setRecuperationData(data)} 
                        />
                    </div>

                    <button 
                        onClick={() => { setShowModal(true); setPaymentStep(1); }}
                        disabled={isFull || !selectedSeat || isSubmitting}
                        className={`w-full font-black py-5 rounded-[1.8rem] uppercase text-xs tracking-widest transition-all active:scale-95 ${
                            (isFull || !selectedSeat) 
                            ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20'
                        }`}
                    >
                        {isSubmitting ? t('processing') : (isFull ? (t('sold_out') || "COMPLET") : t('continue_to_payment'))}
                    </button>
                </div>
            </div>

            {/* MODAL DE PAIEMENT */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                    <div className={`w-full max-w-sm rounded-[3rem] p-8 relative shadow-2xl animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900'}`}>
                        
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
                            <FaTimes size={24}/>
                        </button>

                        {paymentStep === 1 ? (
                            <div className="text-center py-4">
                                <h3 className="text-xl font-black mb-6">{t('summary')}</h3>
                                <div className={`p-6 rounded-3xl mb-8 space-y-4 ${darkMode ? 'bg-slate-950/50' : 'bg-slate-50 border border-slate-100'}`}>
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-slate-400 uppercase text-[10px]">{t('seat_number')}</span>
                                        <span className="text-indigo-500 px-3 py-1 bg-indigo-500/10 rounded-lg font-black">№ {selectedSeat}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200 dark:border-slate-800 pt-4">
                                        <span className="text-slate-400 uppercase text-[10px]">Total</span>
                                        <span className="text-2xl font-black">{trajet?.prix?.toLocaleString()} FC</span>
                                    </div>
                                </div>
                                <button onClick={() => setPaymentStep(2)} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl uppercase text-[11px] shadow-lg shadow-indigo-500/30">
                                    {t('choose_payment_method')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5 py-4">
                                <h3 className="text-xl font-black text-center mb-2">{t('payment_method')}</h3>
                                
                                {/* INFOS MARCHAND */}
                                <div className={`p-5 rounded-3xl border-2 ${darkMode ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                                    <p className="text-[9px] font-black uppercase text-emerald-500 mb-2 flex items-center gap-2">
                                        <FaInfoCircle/> {t('agency_info')}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{t('contact')}</span>
                                        <span className="text-sm font-black text-emerald-500">{trajet?.agence?.telephone || "N/A"}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* Option Cash */}
                                    <button 
                                        onClick={() => handleFinalSubmit(true)} 
                                        disabled={isSubmitting}
                                        className={`w-full p-4 rounded-2xl font-black text-[10px] border-2 transition-all flex items-center justify-center gap-2 ${darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <FaMoneyBillWave className="text-emerald-500"/> {t('pay_later_cash').toUpperCase()}
                                    </button>
                                    
                                    <div className="pt-2 space-y-3 border-t border-slate-200 dark:border-slate-800">
                                        <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest">{t('or_mobile_payment')}</p>
                                        
                                        <select 
                                            className={`w-full p-4 rounded-2xl font-bold outline-none border-2 appearance-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'}`}
                                            onChange={(e) => setPaymentData({...paymentData, modePaiement: e.target.value})}
                                        >
                                            <option value="M-PESA" className={`${darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-800'}`}>M-PESA</option>
                                            <option value="ORANGE_MONEY" className={`${darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-800'}`}>ORANGE MONEY</option>
                                            <option value="AIRTEL_MONEY" className={`${darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-800'}`}>AIRTEL MONEY</option>
                                        </select>
                                        
                                        <input 
                                            type="text" 
                                            placeholder={t('transaction_id_placeholder') || "ID Transaction"} 
                                            className={`w-full p-4 rounded-2xl font-bold border-2 outline-none focus:border-indigo-500 transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'}`}
                                            onChange={(e) => setPaymentData({...paymentData, referenceTransaction: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleFinalSubmit(false)} 
                                    disabled={!paymentData.referenceTransaction || isSubmitting}
                                    className={`w-full font-black py-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${(!paymentData.referenceTransaction || isSubmitting) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}
                                >
                                    {isSubmitting ? t('sending') : <><FaCheck/> {t('confirm_payment').toUpperCase()}</>}
                                </button>
                                
                                <p className="text-[9px] text-center text-slate-500 font-bold italic px-4">
                                    {t('agency_verification_note')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationPage;
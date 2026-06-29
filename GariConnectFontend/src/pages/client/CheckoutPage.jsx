import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Import de l'instance API centralisée
import api from '../../services/api'; 
import { useTranslation } from 'react-i18next';
import { 
    FaChair, FaMobileAlt, FaMoneyBillWave, FaUniversity, 
    FaCheckCircle, FaMapMarkerAlt, FaPlus, FaMinus 
} from 'react-icons/fa';

const CheckoutPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [reservation, setReservation] = useState(null);
    const [nombrePlaces, setNombrePlaces] = useState(1); // Logique de quantité par défaut à 1
    const [selectedArret, setSelectedArret] = useState(""); // État pour l'arrêt de bus standard
    const [modePaiement, setModePaiement] = useState("");
    const [paymentCategory, setPaymentCategory] = useState(""); 

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Utilisation de api.get (le token est injecté automatiquement)
                const res = await api.get(`/reservations/${id}`);
                setReservation(res.data);
                
                // Si un nombre de places est déjà défini dans la réservation initiale
                if (res.data.nombrePlaces) {
                    setNombrePlaces(res.data.nombrePlaces);
                }
                
                // 🛠️ INITIALISATION DE L'ARRÊT SÉLECTIONNÉ
                if (res.data.arretMontage && res.data.arretMontage.id) {
                    setSelectedArret(res.data.arretMontage.id.toString());
                } else if (res.data.arretBus && res.data.arretBus.id) {
                    setSelectedArret(res.data.arretBus.id.toString());
                } else if (res.data.trajet?.arrets && res.data.trajet.arrets.length > 0) {
                    // Par défaut, on sélectionne le premier arrêt disponible sur le trajet
                    setSelectedArret(res.data.trajet.arrets[0].id.toString());
                }
            } catch (error) {
                console.error("Erreur lors de la récupération :", error);
                alert(t('checkout.error_load') || "Erreur de chargement de la réservation.");
            }
        };
        fetchDetails();
    }, [id, t]);

    const handleFinaliser = async () => {
        // Validation : Si ce n'est pas une récupération VIP, un arrêt doit être sélectionné
        const isVip = reservation?.statut === "EN_ATTENTE_COTATION";
        if (!isVip && !selectedArret) {
            return alert("Veuillez sélectionner un arrêt de bus pour votre prise en charge.");
        }
        if (!nombrePlaces || nombrePlaces < 1) {
            return alert("Veuillez sélectionner au moins 1 place.");
        }

        try {
            // Payload enrichi transmis au backend
            await api.patch(`/reservations/${id}/finaliser`, { 
                nombrePlaces: nombrePlaces, 
                modePaiement: modePaiement,
                arretBusId: isVip ? null : parseInt(selectedArret, 10)
            });
            
            if (modePaiement === "CASH") {
                alert(t('checkout.success_cash') || "Réservation enregistrée ! Veuillez payer au guichet.");
            } else {
                alert(t('checkout.success_digital') || "Paiement mobile enregistré avec succès !");
            }

            navigate('/client/mes-tickets');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || t('checkout.error_confirm') || "Une erreur est survenue.");
        }
    };

    if (!reservation) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    const agence = reservation.trajet?.agence;
    const isVipMode = reservation.statut === "EN_ATTENTE_COTATION";
    const arretsDuTrajet = reservation.trajet?.arrets || [];
    
    // Détermination du nombre maximal de places disponibles
    const maxPlacesDisponibles = reservation.trajet?.placesDisponibles || 0;
    const maxSelectionnable = Math.min(maxPlacesDisponibles, 10);

    // Fonctions d'incrémentation et décrémentation
    const incrementerPlaces = () => {
        if (nombrePlaces < maxSelectionnable) {
            setNombrePlaces(prev => prev + 1);
        }
    };

    const decrementerPlaces = () => {
        if (nombrePlaces > 1) {
            setNombrePlaces(prev => prev - 1);
        }
    };

    // Calcul du prix total en fonction du nombre de places actuel
    const prixUnitaire = reservation.trajet?.prix || 0;
    const montantCalcule = prixUnitaire * nombrePlaces;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <header className="text-center md:text-left">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                    {t('checkout.title') || "Finaliser mon paiement"}
                </h1>
                <p className="text-slate-500 font-medium">
                    {isVipMode ? "Validation finale de votre trajet VIP à Domicile" : t('checkout.subtitle') || "Ajustez vos places et choisissez votre mode de paiement"}
                </p>
            </header>
            
            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* SECTION 1 : LOGIQUE D'INCRÉMENTATION & ARRÊT */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-6">
                    <div className="space-y-6">
                        {/* Compteur de Places avec Boutons +/- */}
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                                    <FaChair className="text-blue-600 text-xl" />
                                </div>
                                <h2 className="text-xl font-bold dark:text-white">Nombre de places</h2>
                            </div>
                            <p className="text-sm text-slate-500 mb-4 italic">
                                {t('checkout.available_seats', { count: maxPlacesDisponibles }) || `${maxPlacesDisponibles} places disponibles`}
                            </p>
                            
                            {maxPlacesDisponibles > 0 ? (
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                                    {/* Bouton Moins */}
                                    <button
                                        type="button"
                                        onClick={decrementerPlaces}
                                        disabled={nombrePlaces <= 1}
                                        className="p-4 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-white shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-all"
                                    >
                                        <FaMinus className="text-xs" />
                                    </button>

                                    {/* Chiffre de la quantité */}
                                    <span className="text-xl font-black text-slate-800 dark:text-white">
                                        {nombrePlaces} {nombrePlaces > 1 ? "places" : "place"}
                                    </span>

                                    {/* Bouton Plus */}
                                    <button
                                        type="button"
                                        onClick={incrementerPlaces}
                                        disabled={nombrePlaces >= maxSelectionnable}
                                        className="p-4 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-white shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-30 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-all"
                                    >
                                        <FaPlus className="text-xs" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600 font-bold text-center border-2 border-red-200">
                                    🚌 COMPLET
                                </div>
                            )}
                        </div>

                        {/* Choix de l'arrêt de bus (Standard uniquement) */}
                        {!isVipMode && (
                            <div className="pt-2">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                                        <FaMapMarkerAlt className="text-emerald-600 text-xl" />
                                    </div>
                                    <h2 className="text-xl font-bold dark:text-white">Lieu de montée</h2>
                                </div>
                                <p className="text-sm text-slate-500 mb-3 italic">
                                    Sélectionnez votre arrêt de prise en charge parmi ceux desservis par ce trajet
                                </p>
                                <select 
                                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all font-bold outline-none cursor-pointer"
                                    value={selectedArret}
                                    onChange={(e) => setSelectedArret(e.target.value)}
                                >
                                    <option value="">-- Sélectionner votre arrêt --</option>
                                    {arretsDuTrajet.length > 0 ? (
                                        arretsDuTrajet.map((arret) => (
                                            <option key={arret.id} value={arret.id.toString()}>
                                                🚏 {arret.nom} {arret.reperes ? `(${arret.reperes})` : ''}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">Gare Principale (Pas d'arrêts intermédiaires)</option>
                                    )}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {/* Tarification Dynamique Mis à jour */}
                    <div className="p-4 bg-slate-900 rounded-2xl text-white mt-4">
                        <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">{t('checkout.total_to_pay') || "Total à régler"}</p>
                        <p className="text-2xl font-black">
                            {montantCalcule.toLocaleString()} FC
                        </p>
                        {isVipMode && (
                            <p className="text-[9px] text-amber-400 font-bold mt-1 uppercase">
                                Prix inclus frais de ramassage à domicile
                            </p>
                        )}
                    </div>
                </div>

                {/* SECTION 2 : MODES DE PAIEMENT */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                            <FaMobileAlt className="text-emerald-600 text-xl" />
                        </div>
                        <h2 className="text-xl font-bold dark:text-white">{t('checkout.payment_method') || "Moyen de paiement"}</h2>
                    </div>
                    
                    <div className="space-y-4">
                        {/* 1. OPTION CASH */}
                        <div 
                            onClick={() => { setPaymentCategory("CASH"); setModePaiement("CASH"); }}
                            className={`p-5 rounded-[1.8rem] border-2 cursor-pointer transition-all flex items-center gap-5 ${paymentCategory === 'CASH' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                        >
                            <FaMoneyBillWave className={`text-2xl ${paymentCategory === 'CASH' ? 'text-blue-600' : 'text-slate-400'}`} />
                            <div>
                                <p className="font-black text-slate-800 dark:text-white">{t('checkout.pay_cash') || "Payer Cash au Guichet"}</p>
                                <p className="text-xs text-orange-600 uppercase font-bold italic">{t('checkout.manual_validation') || "Validation manuelle par l'agent"}</p>
                            </div>
                        </div>

                        {/* 2. OPTION VIREMENT */}
                        <div 
                            onClick={() => { setPaymentCategory("VIREMENT"); setModePaiement("BANQUE"); }}
                            className={`p-5 rounded-[1.8rem] border-2 cursor-pointer transition-all flex flex-col gap-3 ${paymentCategory === 'VIREMENT' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                        >
                            <div className="flex items-center gap-5">
                                <FaUniversity className={`text-2xl ${paymentCategory === 'VIREMENT' ? 'text-blue-600' : 'text-slate-400'}`} />
                                <div>
                                    <p className="font-black text-slate-800 dark:text-white">{t('checkout.bank_transfer') || "Virement Bancaire"}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('checkout.bank_rib') || "N° Compte (RIB)"} : <span className="font-bold text-blue-600">{agence?.numeroCompteBancaire || t('checkout.see_counter') || "Voir au comptoir"}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 3. OPTION MOBILE MONEY */}
                        <div className={`p-5 rounded-[1.8rem] border-2 transition-all ${paymentCategory === 'MOBILE' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                            <div className="flex items-center gap-5 cursor-pointer" onClick={() => setPaymentCategory("MOBILE")}>
                                <FaMobileAlt className={`text-2xl ${paymentCategory === 'MOBILE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <div>
                                    <p className="font-black text-slate-800 dark:text-white">{t('checkout.mobile_money') || "Mobile Money"}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('checkout.mobile_instant') || "Paiement direct et instantané"}</p>
                                </div>
                            </div>

                            {paymentCategory === "MOBILE" && (
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div onClick={() => setModePaiement("MPESA")} className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all ${modePaiement === 'MPESA' ? 'bg-white dark:bg-slate-800 border-red-600 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'}`}>
                                        <p className="text-[10px] font-black uppercase text-red-600">M-Pesa</p>
                                        <p className="text-xs font-bold dark:text-white">{agence?.numeroMpesa || "N/A"}</p>
                                    </div>
                                    <div onClick={() => setModePaiement("AIRTEL")} className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all ${modePaiement === 'AIRTEL' ? 'bg-white dark:bg-slate-800 border-red-500 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'}`}>
                                        <p className="text-[10px] font-black uppercase text-red-500">Airtel Money</p>
                                        <p className="text-xs font-bold dark:text-white">{agence?.numeroAirtel || "N/A"}</p>
                                    </div>
                                    <div onClick={() => setModePaiement("ORANGE")} className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all ${modePaiement === 'ORANGE' ? 'bg-white dark:bg-slate-800 border-orange-500 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'}`}>
                                        <p className="text-[10px] font-black uppercase text-orange-500">Orange Money</p>
                                        <p className="text-xs font-bold dark:text-white">{agence?.numeroOrange || "N/A"}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BOUTON D'ACTION */}
            <div className="flex justify-center">
                <button 
                    onClick={handleFinaliser}
                    disabled={maxPlacesDisponibles === 0 || !modePaiement || (!isVipMode && !selectedArret)}
                    className="group relative flex items-center justify-center gap-4 w-full md:w-2/3 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-20 transition-all duration-500 shadow-2xl"
                >
                    <span className="relative z-10">{t('checkout.confirm_button') || "Confirmer le paiement"}</span>
                    <FaCheckCircle className="text-xl" />
                </button>
            </div>
        </div>
    );
};

export default CheckoutPage;
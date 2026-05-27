import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Import de l'instance API centralisée
import api from '../../services/api'; 
import { useTranslation } from 'react-i18next';
import { FaChair, FaMobileAlt, FaMoneyBillWave, FaUniversity, FaCheckCircle } from 'react-icons/fa';

const CheckoutPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [reservation, setReservation] = useState(null);
    const [selectedSiege, setSelectedSiege] = useState("");
    const [modePaiement, setModePaiement] = useState("");
    const [paymentCategory, setPaymentCategory] = useState(""); 

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Utilisation de api.get (le token est injecté automatiquement)
                const res = await api.get(`/reservations/${id}`);
                setReservation(res.data);
            } catch (error) {
                console.error("Erreur lors de la récupération :", error);
                alert(t('checkout.error_load'));
            }
        };
        fetchDetails();
    }, [id, t]);

    const handleFinaliser = async () => {
        try {
            // Utilisation de api.patch (le token est injecté automatiquement)
            await api.patch(`/reservations/${id}/finaliser`, { 
                siege: selectedSiege, 
                modePaiement: modePaiement 
            });
            
            if (modePaiement === "CASH") {
                alert(t('checkout.success_cash'));
            } else {
                alert(t('checkout.success_digital'));
            }

            navigate('/client/mes-tickets');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || t('checkout.error_confirm'));
        }
    };

    if (!reservation) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    const agence = reservation.trajet.agence;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <header className="text-center md:text-left">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                    {t('checkout.title')}
                </h1>
                <p className="text-slate-500 font-medium">{t('checkout.subtitle')}</p>
            </header>
            
            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* SECTION 1 : CHOIX DU SIÈGE */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                                <FaChair className="text-blue-600 text-xl" />
                            </div>
                            <h2 className="text-xl font-bold dark:text-white">{t('checkout.your_seat')}</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4 italic">
                            {t('checkout.available_seats', { count: reservation.trajet.placesDisponibles })}
                        </p>
                        <select 
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all font-bold outline-none"
                            value={selectedSiege}
                            onChange={(e) => setSelectedSiege(e.target.value)}
                        >
                            <option value="">{t('checkout.select_seat_placeholder')}</option>
                            {[...Array(reservation.trajet.placesDisponibles)].map((_, i) => (
                                <option key={i} value={i + 1}>{t('checkout.seat_number', { num: i + 1 })}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="mt-8 p-4 bg-slate-900 rounded-2xl text-white">
                        <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">{t('checkout.total_to_pay')}</p>
                        <p className="text-2xl font-black">{reservation.trajet.prix} USD</p>
                    </div>
                </div>

                {/* SECTION 2 : MODES DE PAIEMENT */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                            <FaMobileAlt className="text-emerald-600 text-xl" />
                        </div>
                        <h2 className="text-xl font-bold dark:text-white">{t('checkout.payment_method')}</h2>
                    </div>
                    
                    <div className="space-y-4">
                        
                        {/* 1. OPTION CASH */}
                        <div 
                            onClick={() => { setPaymentCategory("CASH"); setModePaiement("CASH"); }}
                            className={`p-5 rounded-[1.8rem] border-2 cursor-pointer transition-all flex items-center gap-5 ${paymentCategory === 'CASH' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                        >
                            <FaMoneyBillWave className={`text-2xl ${paymentCategory === 'CASH' ? 'text-blue-600' : 'text-slate-400'}`} />
                            <div>
                                <p className="font-black text-slate-800 dark:text-white">{t('checkout.pay_cash')}</p>
                                <p className="text-xs text-orange-600 uppercase font-bold italic">{t('checkout.manual_validation')}</p>
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
                                    <p className="font-black text-slate-800 dark:text-white">{t('checkout.bank_transfer')}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('checkout.bank_rib')} : <span className="font-bold text-blue-600">{agence.numeroCompteBancaire || t('checkout.see_counter')}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 3. OPTION MOBILE MONEY */}
                        <div className={`p-5 rounded-[1.8rem] border-2 transition-all ${paymentCategory === 'MOBILE' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
                            <div className="flex items-center gap-5 cursor-pointer" onClick={() => setPaymentCategory("MOBILE")}>
                                <FaMobileAlt className={`text-2xl ${paymentCategory === 'MOBILE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <div>
                                    <p className="font-black text-slate-800 dark:text-white">{t('checkout.mobile_money')}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('checkout.mobile_instant')}</p>
                                </div>
                            </div>

                            {paymentCategory === "MOBILE" && (
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div onClick={() => setModePaiement("MPESA")} className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all ${modePaiement === 'MPESA' ? 'bg-white dark:bg-slate-800 border-red-600 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'}`}>
                                        <p className="text-[10px] font-black uppercase text-red-600">M-Pesa</p>
                                        <p className="text-xs font-bold dark:text-white">{agence.numeroMpesa || "N/A"}</p>
                                    </div>
                                    <div onClick={() => setModePaiement("AIRTEL")} className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all ${modePaiement === 'AIRTEL' ? 'bg-white dark:bg-slate-800 border-red-500 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'}`}>
                                        <p className="text-[10px] font-black uppercase text-red-500">Airtel</p>
                                        <p className="text-xs font-bold dark:text-white">{agence.numeroAirtel || "N/A"}</p>
                                    </div>
                                    <div onClick={() => setModePaiement("ORANGE")} className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all ${modePaiement === 'ORANGE' ? 'bg-white dark:bg-slate-800 border-orange-500 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'}`}>
                                        <p className="text-[10px] font-black uppercase text-orange-500">Orange</p>
                                        <p className="text-xs font-bold dark:text-white">{agence.numeroOrange || "N/A"}</p>
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
                    disabled={!selectedSiege || !modePaiement}
                    className="group relative flex items-center justify-center gap-4 w-full md:w-2/3 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-600 disabled:opacity-20 transition-all duration-500 shadow-2xl"
                >
                    <span className="relative z-10">{t('checkout.confirm_button')}</span>
                    <FaCheckCircle className="text-xl" />
                </button>
            </div>
        </div>
    );
};

export default CheckoutPage;
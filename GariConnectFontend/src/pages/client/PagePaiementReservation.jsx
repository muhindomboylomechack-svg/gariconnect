import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, FaReceipt, FaMoneyBillWave, FaMobileAlt, 
    FaCheckCircle, FaSpinner, FaCar, FaTicketAlt
} from 'react-icons/fa';

// Import de l'instance API centralisée
import api from '../../services/api';

const PaiementDemande = ({ onPaymentSuccess }) => {
  // Récupération de l'ID de la réservation passé dans l'URL
  const { reservationId } = useParams();
  const navigate = useNavigate();

  // États pour stocker les données récupérées du backend
  const [reservation, setReservation] = useState(null);
  const [demandeRecuperation, setDemandeRecuperation] = useState(null);
  
  // États de l'interface
  const [darkMode, setDarkMode] = useState(localStorage.getItem('client-theme') === 'dark');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  // États du formulaire
  const [modePaiement, setModePaiement] = useState('M-PESA');
  const [referenceTransaction, setReferenceTransaction] = useState('');

  // Gestion du Dark Mode Tailwind sur la racine absolue du site
  useEffect(() => {
    if (darkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-slate-950');
        document.body.classList.remove('bg-slate-50');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.add('bg-slate-50');
        document.body.classList.remove('bg-slate-950');
    }
  }, [darkMode]);

  // Chargement automatique des données de la facture
  useEffect(() => {
    const chargerDetailsPaiement = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Non connecté");

        // 1. Récupérer les détails de la réservation principale
        const resResponse = await api.get(`/reservations/${reservationId}`);
        setReservation(resResponse.data);

        // 2. Tenter de récupérer la demande de ramassage associée
        try {
            const reqResponse = await api.get(`/recuperations/reservation/${reservationId}`);
            setDemandeRecuperation(reqResponse.data);
        } catch (reqError) {
            console.log("Trajet standard (Aucune demande VIP associée).");
        }

      } catch (error) {
        setIsError(true);
        setMessage("Impossible de charger les détails de cette facture.");
      } finally {
        setLoading(false);
      }
    };

    if (reservationId) {
        chargerDetailsPaiement();
    }
  }, [reservationId]);

  // Sécurité : Écran de chargement couvrant tout l'écran
  if (loading && !reservation) {
    return (
      <div className={`fixed inset-0 w-screen h-screen flex items-center justify-center font-black animate-pulse transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-indigo-400' : 'bg-slate-50 text-indigo-600'}`}>
        <FaSpinner className="animate-spin mr-2" /> CALCUL DE VOTRE FACTURE...
      </div>
    );
  }

  // Si on n'a pas pu charger la réservation
  if (!loading && !reservation) {
     return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <p className="text-red-500 font-bold mb-4 text-center">❌ Impossible de trouver la facture N°{reservationId}.</p>
        <button onClick={() => navigate('/client/historique')} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20">Retour à l'historique</button>
      </div>
     );
  }

  // Calculs financiers dynamiques
  const prixBillet = reservation.trajet?.prix || reservation.montantPaye || 0;
  const isVip = demandeRecuperation !== null && demandeRecuperation !== undefined;
  const supplementRamassage = demandeRecuperation?.prixSupplementaire || 0;
  const totalGeneral = prixBillet + supplementRamassage;

  const handlePaiement = async (e) => {
    e.preventDefault();
    
    // Validation du numéro de téléphone
    if (modePaiement !== 'CASH' && !referenceTransaction.trim()) {
      setIsError(true);
      setMessage("Veuillez saisir le numéro de téléphone utilisé pour le paiement Mobile Money.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      // Construction du payload pour l'endpoint global (Billet + VIP)
      const payload = {
        modePaiement: modePaiement === 'CASH' ? 'AGENCE' : modePaiement,
        referenceTransaction: modePaiement === 'CASH' ? 'CASH_ATTENTE' : referenceTransaction,
        montantTotal: totalGeneral
      };

      // 🟢 CORRECTION ICI : api.put au lieu de api.patch pour correspondre au @PutMapping du backend
      const response = await api.put(`/reservations/${reservation.id}/finaliser`, payload);

      setIsError(false);
      
      const messageSucces = modePaiement === 'CASH'
        ? "💵 Demande enregistrée ! Veuillez vous rendre au guichet pour finaliser le paiement cash."
        : "🎉 Paiement mobile enregistré avec succès ! Votre billet et votre ramassage sont validés.";
      
      setMessage(response.data?.message || messageSucces);
      
      if (onPaymentSuccess) {
        onPaymentSuccess(response.data);
      } else {
        setTimeout(() => navigate('/client/historique'), 3000);
      }
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message || error.response?.data?.error || 
        "Une erreur est survenue lors de la communication avec le serveur de paiement."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen w-full p-4 sm:p-6 md:p-10 transition-colors duration-500 flex flex-col items-center ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="w-full max-w-md md:max-w-4xl">
          
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold mb-6 transition-colors text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400">
            <FaArrowLeft /> Retour
        </button>

        <h1 className="text-2xl sm:text-3xl font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white">
            <FaReceipt className="text-indigo-500 dark:text-indigo-400" /> Caisse Virtuelle
        </h1>

        {/* Conteneur responsive : Stack sur mobile, Côte à côte sur tablette/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* --- CARTE 1 : LE REÇU DÉTAILLÉ (FACTURE) --- */}
          <div className={`p-5 sm:p-6 rounded-[2rem] shadow-xl border transition-all duration-500 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <h2 className="text-xs font-black uppercase mb-6 tracking-widest border-b pb-4 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800">
                  Détails de facturation
              </h2>
              
              <div className="space-y-4">
                  {/* Ligne 1 : Billet Standard */}
                  <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                          <FaTicketAlt className="text-indigo-500 dark:text-indigo-400" /> Billet Standard
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">{prixBillet.toLocaleString()} FC</span>
                  </div>

                  {/* Ligne 2 : Frais VIP (Conditionnelle) */}
                  {isVip && (
                      <div className="flex justify-between items-center p-3 rounded-xl border transition-all duration-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30">
                          <span className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              <FaCar className="text-emerald-500 dark:text-emerald-400" /> Frais Ramassage Domicile
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                              {supplementRamassage > 0 ? `+ ${supplementRamassage.toLocaleString()} FC` : 'En attente...'}
                          </span>
                      </div>
                  )}
              </div>

              {/* Total à Payer */}
              <div className="mt-6 pt-6 border-t-2 border-dashed flex justify-between items-end border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total</span>
                  <div className="text-right">
                      <span className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">{totalGeneral.toLocaleString()}</span>
                      <span className="text-sm font-bold ml-1 text-slate-500 dark:text-slate-400">FC</span>
                  </div>
              </div>
          </div>

          {/* --- CARTE 2 : LE FORMULAIRE DE PAIEMENT --- */}
          <form onSubmit={handlePaiement} className={`p-5 sm:p-6 rounded-[2rem] shadow-xl border transition-all duration-500 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <h2 className="text-xs font-black uppercase mb-6 tracking-widest text-slate-400 dark:text-slate-500">
                  Méthode de paiement
              </h2>

              {/* Sélecteur de méthode (Tabs) */}
              <div className="flex p-1 rounded-2xl mb-6 bg-slate-100 dark:bg-slate-950 transition-colors duration-500">
                  <button 
                      type="button"
                      onClick={() => { setModePaiement('M-PESA'); setReferenceTransaction(''); setIsError(false); }}
                      className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all duration-300 ${modePaiement !== 'CASH' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                      <FaMobileAlt /> Mobile
                  </button>
                  <button 
                      type="button"
                      onClick={() => { setModePaiement('CASH'); setReferenceTransaction(''); setIsError(false); }}
                      className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all duration-300 ${modePaiement === 'CASH' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                      <FaMoneyBillWave /> Guichet
                  </button>
              </div>

              {/* Champs dynamiques */}
              {modePaiement !== 'CASH' ? (
                  <div className="space-y-4 animate-fadeIn">
                      <div>
                          <label className="block text-[10px] font-black uppercase mb-2 text-slate-400 dark:text-slate-500">Réseau</label>
                          <select 
                              className={`w-full p-4 rounded-xl font-bold border-2 outline-none transition-all duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-400'}`}
                              value={modePaiement}
                              onChange={(e) => setModePaiement(e.target.value)}
                          >
                              <option value="M-PESA">Vodacom M-PESA</option>
                              <option value="ORANGE_MONEY">Orange Money</option>
                              <option value="AIRTEL_MONEY">Airtel Money</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black uppercase mb-2 text-slate-400 dark:text-slate-500">Numéro de téléphone</label>
                          <input 
                              type="text" 
                              placeholder="Ex: 0812345678" 
                              className={`w-full p-4 rounded-xl font-bold border-2 outline-none transition-all duration-500 tracking-wider ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 placeholder-slate-700' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-400 placeholder-slate-400'}`}
                              value={referenceTransaction}
                              onChange={(e) => setReferenceTransaction(e.target.value)}
                          />
                      </div>
                  </div>
              ) : (
                  <div className="p-4 border rounded-xl text-center animate-fadeIn transition-all duration-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30">
                      <p className="text-xs font-bold leading-relaxed text-emerald-700 dark:text-emerald-400">
                          Votre place est réservée. Veuillez vous présenter au guichet de l'agence pour finaliser le règlement en espèces avant l'embarquement.
                      </p>
                  </div>
              )}

              {/* Messages d'erreur ou de succès */}
              {message && (
                  <div className={`mt-4 p-4 rounded-xl text-sm font-bold text-center animate-fadeIn border transition-all duration-500 ${isError ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'}`}>
                      {message}
                  </div>
              )}

              <button 
                  type="submit"
                  disabled={isSubmitting || (isVip && supplementRamassage === 0)}
                  className={`mt-6 w-full py-5 flex items-center justify-center gap-2 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-300 ${isSubmitting || (isVip && supplementRamassage === 0) ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 dark:shadow-indigo-950/30'}`}
              >
                  {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {isSubmitting ? "Validation..." : `Payer ${totalGeneral.toLocaleString()} FC`}
              </button>
              
              {/* 🛡️ SÉCURITÉ : Alerte bloquante si le VIP n'a pas été coté par l'agence */}
              {isVip && supplementRamassage === 0 && (
                  <p className="text-[10px] font-bold mt-3 text-center text-rose-500 dark:text-rose-400">
                      Paiement bloqué : L'agence n'a pas encore fixé le tarif kilométrique de votre ramassage.
                  </p>
              )}
          </form>

        </div>
      </div>
    </div>
  );
};

export default PaiementDemande;
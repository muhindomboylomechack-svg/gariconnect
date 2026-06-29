import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaReceipt, FaMoneyBillWave, FaMobileAlt, 
  FaCheckCircle, FaSpinner, FaCar, FaTicketAlt, FaUsers
} from 'react-icons/fa';

import api from '../../services/api';

const PaiementDemande = ({ onPaymentSuccess }) => {
  const { reservationId } = useParams();
  const navigate = useNavigate();

  // États des données backend
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
  
  // État pour gérer le nombre de places
  const [nombrePlaces, setNombrePlaces] = useState(1);

  // Gestion du Dark Mode Tailwind
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

  // Chargement des données de la facture
  useEffect(() => {
    const chargerDetailsPaiement = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Non connecté");

        // 1. Charger la réservation principale
        const resResponse = await api.get(`/reservations/${reservationId}`);
        setReservation(resResponse.data);
        
        if (resResponse.data.nombrePlaces) {
            setNombrePlaces(resResponse.data.nombrePlaces);
        }

        // 2. Tenter de charger le surplus de récupération
        try {
            const reqResponse = await api.get(`/recuperations/reservation/${reservationId}`);
            // Sécurité : on s'assure que la donnée reçue n'est pas vide
            if (reqResponse.data && Object.keys(reqResponse.data).length > 0) {
                setDemandeRecuperation(reqResponse.data);
            } else {
                setDemandeRecuperation(null);
            }
        } catch (reqError) {
            console.log("Trajet standard (Aucune demande VIP associée).");
            setDemandeRecuperation(null);
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

  if (loading && !reservation) {
    return (
      <div className={`fixed inset-0 w-screen h-screen flex items-center justify-center font-black animate-pulse transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-indigo-400' : 'bg-slate-50 text-indigo-600'}`}>
        <FaSpinner className="animate-spin mr-2" /> CALCUL DE VOTRE FACTURE...
      </div>
    );
  }

  if (!loading && !reservation) {
     return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <p className="text-red-500 font-bold mb-4 text-center">❌ Impossible de trouver la facture N°{reservationId}.</p>
        <button onClick={() => navigate('/client/historique')} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20">Retour à l'historique</button>
      </div>
     );
  }

  // 🟢 LA CORRECTION EST ICI : On vérifie STRICTEMENT le type de réservation depuis la base de données
  const isVip = reservation?.typeReservation === 'VIP' || reservation?.typeReservation === 'VID';

  // Calcul dynamique basé sur le nombre de places
  const prixUnitaire = reservation.trajet?.prix || reservation.montantTotal || reservation.montantPaye || 0;
  const totalBillets = prixUnitaire * nombrePlaces;
  
  const supplementRamassage = isVip && demandeRecuperation ? (demandeRecuperation.prixSupplementaire || 0) : 0; 
  const totalGeneral = totalBillets + supplementRamassage;

  const handlePaiement = async (e) => {
    e.preventDefault();
    
    if (modePaiement !== 'CASH' && !referenceTransaction.trim()) {
      setIsError(true);
      setMessage("Veuillez saisir le numéro de téléphone utilisé pour le paiement Mobile Money.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      if (modePaiement === 'CASH') {
        await api.post(`/reservations/${reservation.id}/intention-cash`, {
            montantTotal: totalGeneral,
            nombrePlaces: nombrePlaces
        });

        setIsError(false);
        setMessage("💵 Choix enregistré ! Veuillez vous rendre au guichet d'une agence pour payer. Votre réservation sera validée par l'agent de comptoir après réception des fonds.");
        setTimeout(() => navigate('/client/historique'), 5000);

      } else {
        const payload = {
          reservationId: reservation.id,
          reference: referenceTransaction,
          montant: totalGeneral,
          mode: modePaiement,
          nombrePlaces: nombrePlaces 
        };
        
        await api.post(`/paiements/encaisser`, payload);
        
        setIsError(false);
        setMessage("🎉 Paiement mobile encaissé avec succès ! Vos reçus ont été générés.");
        setTimeout(() => navigate('/client/historique'), 3000);
      }

    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message || error.response?.data?.error || 
        "Une erreur est survenue lors du traitement."
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* --- FACTURE --- */}
          <div className={`p-5 sm:p-6 rounded-[2rem] shadow-xl border transition-all duration-500 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <h2 className="text-xs font-black uppercase mb-6 tracking-widest border-b pb-4 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800">
                  Détails de facturation
              </h2>
              
              <div className="space-y-4">
                  {/* Sélection du nombre de places */}
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                          <FaUsers className="text-indigo-500 dark:text-indigo-400" /> Nombre de places
                      </span>
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                          <button 
                              type="button" 
                              onClick={() => setNombrePlaces(Math.max(1, nombrePlaces - 1))} 
                              className="w-8 h-8 flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 font-black hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >-</button>
                          <span className="font-black text-slate-900 dark:text-white w-4 text-center">{nombrePlaces}</span>
                          <button 
                              type="button" 
                              onClick={() => setNombrePlaces(nombrePlaces + 1)} 
                              className="w-8 h-8 flex items-center justify-center rounded-md text-slate-700 dark:text-slate-300 font-black hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >+</button>
                      </div>
                  </div>

                  <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                          <FaTicketAlt className="text-indigo-500 dark:text-indigo-400" /> Billet Standard <span className="text-xs text-slate-400 font-normal">({prixUnitaire} FC)</span>
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">{totalBillets.toLocaleString()} FC</span>
                  </div>

                  {/* Bloc VIP : Strictement affiché que si la réservation est du type VIP/VID */}
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

              <div className="mt-6 pt-6 border-t-2 border-dashed flex justify-between items-end border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total</span>
                  <div className="text-right">
                      <span className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">{totalGeneral.toLocaleString()}</span>
                      <span className="text-sm font-bold ml-1 text-slate-500 dark:text-slate-400">FC</span>
                  </div>
              </div>
          </div>

          {/* --- CHOIX DU MODE --- */}
          <form onSubmit={handlePaiement} className={`p-5 sm:p-6 rounded-[2rem] shadow-xl border transition-all duration-500 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <h2 className="text-xs font-black uppercase mb-6 tracking-widest text-slate-400 dark:text-slate-500">
                  Méthode de paiement
              </h2>

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
                      <FaMoneyBillWave /> Guichet (Cash)
                  </button>
              </div>

              {modePaiement !== 'CASH' ? (
                  <div className="space-y-4">
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
                  <div className="p-4 border rounded-xl text-center bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30">
                      <p className="text-xs font-bold leading-relaxed text-emerald-700 dark:text-emerald-400">
                          Vous déclarez vouloir payer en espèces. Présentez-vous à l'agence pour régler votre facture. Un <strong>Agent de comptoir</strong> validera votre ticket dès réception de l'argent.
                      </p>
                  </div>
              )}

              {message && (
                  <div className={`mt-4 p-4 rounded-xl text-sm font-bold text-center border transition-all duration-500 ${isError ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'}`}>
                      {message}
                  </div>
              )}

              <button 
                  type="submit"
                  disabled={isSubmitting || (isVip && supplementRamassage === 0)}
                  className={`mt-6 w-full py-5 flex items-center justify-center gap-2 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-300 ${isSubmitting || (isVip && supplementRamassage === 0) ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 dark:shadow-indigo-950/30'}`}
              >
                  {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {isSubmitting ? "Traitement..." : modePaiement === 'CASH' ? "Confirmer mon passage au guichet" : `Soumettre mon paiement`}
              </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default PaiementDemande;
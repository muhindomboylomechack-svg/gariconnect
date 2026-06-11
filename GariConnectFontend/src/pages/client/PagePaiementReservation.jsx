import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // 🆕 Imports ajoutés
import axios from 'axios';

const PaiementDemande = ({ onPaymentSuccess }) => {
  // 🆕 Récupération de l'ID de la réservation passé dans l'URL (ex: /paiement-reservation/4)
  const { reservationId } = useParams();
  const navigate = useNavigate();

  // États pour stocker les données récupérées du backend
  const [reservation, setReservation] = useState(null);
  const [demandeRecuperation, setDemandeRecuperation] = useState(null);
  
  // États du formulaire
  const [modePaiement, setModePaiement] = useState('M-PESA');
  const [referenceTransaction, setReferenceTransaction] = useState('');
  const [loading, setLoading] = useState(true); // Passe à true par défaut pour le chargement initial
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  // 🆕 Chargement automatique des données de la réservation dès l'arrivée sur la page
  useEffect(() => {
    const chargerDetailsPaiement = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Non connecté");

        // 1. Récupérer les détails de la réservation
        const resResponse = await axios.get(`http://localhost:8080/api/reservations/${reservationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReservation(resResponse.data);

        // 2. Tenter de récupérer la demande de récupération associée (s'il y en a une)
        try {
            const reqResponse = await axios.get(`http://localhost:8080/api/recuperations/reservation/${reservationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDemandeRecuperation(reqResponse.data);
        } catch (reqError) {
            console.log("Aucune demande de récupération à domicile associée, ou erreur mineure :", reqError.message);
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

  // 🛡️ Sécurité : Écran de chargement pendant que les données arrivent du serveur
  if (loading && !reservation) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 text-center text-gray-500 border border-gray-100 mt-10">
        <div className="animate-pulse">⏳ Calcul de votre facture en cours...</div>
      </div>
    );
  }

  // Si on n'a pas pu charger la réservation après le chargement
  if (!loading && !reservation) {
     return (
        <div className="max-w-md mx-auto bg-red-50 text-red-600 rounded-xl shadow-md p-6 text-center border border-red-200 mt-10 font-bold">
            ❌ Impossible de trouver la facture N°{reservationId}.
        </div>
     );
  }

  // Calcul des montants basés sur ton modèle backend (avec fallbacks sécurisés)
  const prixBillet = reservation.trajet?.prix || 0;
  const supplementRamassage = demandeRecuperation?.prixSupplementaire || 0;
  const totalGeneral = prixBillet + supplementRamassage;

  const handlePaiement = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);

    // Récupération du token JWT stocké lors de la connexion
    const token = localStorage.getItem('token'); 

    if (!token) {
      setIsError(true);
      setMessage("🔒 Vous devez être connecté pour valider ce paiement.");
      setLoading(false);
      return;
    }

    try {
      // 1. Appel à l'API d'encaissement globale (PaiementController)
      const response = await axios.post(
        `http://localhost:8080/api/paiements/payer/${reservation.id}`,
        null, 
        {
          params: {
            mode: modePaiement,
            referenceClient: modePaiement === 'CASH' ? 'A_PAYER_A_L_AGENCE' : referenceTransaction
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // 2. Si le paiement mobile est un succès et qu'il y a une demande de récupération,
      // on déclenche la validation automatique du ramassage à domicile
      if (demandeRecuperation?.id && modePaiement !== 'CASH') {
        await axios.put(
          `http://localhost:8080/api/recuperations/${demandeRecuperation.id}/valider-paiement`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setIsError(false);
      
      // Récupération du message backend s'il existe, sinon message par défaut
      const messageSucces = modePaiement === 'CASH'
        ? "💵 Demande enregistrée ! Veuillez vous rendre au guichet pour finaliser le paiement cash."
        : "🎉 Paiement mobile enregistré avec succès ! Votre billet et votre ramassage sont validés.";
      
      setMessage(response.data?.message || messageSucces);
      
      if (onPaymentSuccess) {
        onPaymentSuccess(response.data);
      } else {
        // Redirection vers le tableau de bord après 3 secondes si pas de handler parent
        setTimeout(() => navigate('/client/historique'), 3000);
      }
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message || 
        "Une erreur est survenue lors de la communication avec le serveur de paiement."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6 border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">💳 Finaliser votre paiement</h2>
      
      {/* Récapitulatif financier */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Prix du billet de voyage :</span>
          <span className="font-semibold">{prixBillet.toLocaleString()} CDF</span>
        </div>
        
        {supplementRamassage > 0 && (
          <div className="flex justify-between text-orange-600 border-t border-gray-200 pt-2 mt-2">
            <span>Supplément Ramassage Domicile :</span>
            <span className="font-semibold text-orange-600">+{supplementRamassage.toLocaleString()} CDF</span>
          </div>
        )}
        
        <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between text-lg font-black text-gray-900">
          <span>Montant Total à payer :</span>
          <span className="text-emerald-600">{totalGeneral.toLocaleString()} CDF</span>
        </div>
      </div>

      {/* Formulaire de paiement */}
      <form onSubmit={handlePaiement} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sélectionnez votre mode de paiement
          </label>
          <select
            value={modePaiement}
            onChange={(e) => {
              setModePaiement(e.target.value);
              setReferenceTransaction(''); // Reset la référence si le mode change
            }}
            className="w-full p-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="M-PESA">M-Pesa 🇨🇩</option>
            <option value="ORANGE_MONEY">Orange Money 🇨🇩</option>
            <option value="AIRTEL_MONEY">Airtel Money 🇨🇩</option>
            <option value="CASH">Payer Cash au Guichet 💵</option>
          </select>
        </div>

        {/* N'afficher le champ référence que si ce n'est pas du Cash */}
        {modePaiement !== 'CASH' && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de téléphone Mobile Money
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 08XXXXXXXX ou +243XXXXXXXXX"
              value={referenceTransaction}
              onChange={(e) => setReferenceTransaction(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-[11px] text-gray-500 mt-1 font-medium">
              Veuillez entrer le numéro qui validera la transaction.
            </p>
          </div>
        )}

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-4 rounded-xl text-white font-black tracking-wide transition-all ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-[0.98]'
          }`}
        >
          {loading ? 'Traitement en cours...' : `Confirmer le paiement de ${totalGeneral.toLocaleString()} CDF`}
        </button>
      </form>

      {/* Retours d'information graphiques */}
      {message && (
        <div className={`mt-6 p-4 rounded-xl text-sm font-medium ${
          isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default PaiementDemande;
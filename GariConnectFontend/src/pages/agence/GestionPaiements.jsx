import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaCreditCard, FaSearch, FaMoneyBillWave, 
  FaMobileAlt, FaWallet, FaClock, 
  FaTimes, FaCashRegister, FaInfoCircle, FaCheckDouble, FaPlusCircle, FaCar, FaCrown
} from 'react-icons/fa';
import api from '../../services/api';

const GestionPaiements = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCashForm, setShowCashForm] = useState(false);
  const [detteCommission, setDetteCommission] = useState(0);
  
  // 🚀 NOUVEAU : État pour stocker le profil de l'agence (pour vérifier l'abonnement et le rôle)
  const [agenceProfile, setAgenceProfile] = useState(null);

  // Formulaire pour nouveau paiement cash au guichet
  const [cashPayload, setCashPayload] = useState({ reservationId: "", montant: "" });

  useEffect(() => {
    fetchInitialData();
    fetchCommissionEtNotifs();
    fetchAgenceProfile(); // 🚀 NOUVEAU : On charge le profil au montage
  }, []);

  // 🚀 NOUVEAU : Fonction pour récupérer le profil et le type d'abonnement
  const fetchAgenceProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/agences/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgenceProfile(res.data);
    } catch (error) {
      console.error("Erreur lors de la récupération du profil agence :", error);
    }
  };

  // Récupère la liste des réservations via l'URL globale
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const resReservations = await api.get('/reservations', {
        headers: { Authorization: `Bearer ${token}` }
      }); 
      
      let rawData = [];
      if (Array.isArray(resReservations.data)) {
        rawData = resReservations.data;
      } else if (resReservations.data && Array.isArray(resReservations.data.content)) {
        rawData = resReservations.data.content;
      } else if (resReservations.data && Array.isArray(resReservations.data.reservations)) {
        rawData = resReservations.data.reservations;
      }

      console.log("Réservations chargées pour l'agence :", rawData);
      setReservations(rawData);
    } catch (error) {
      console.error("Erreur chargement données de paiements/reservations:", error);
    } finally {
      loading && setLoading(false);
    }
  };

  const fetchCommissionEtNotifs = async () => {
    try {
      const token = localStorage.getItem('token');
      const resDette = await api.get('/agences/ma-commission', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { montantDu: 0 } })); 
      setDetteCommission(resDette.data.montantDu || 0);
    } catch (error) {
      console.error("Erreur récup commission:", error);
    }
  };

  // Filtrer les réservations en attente de versement (Standard ou Surplus VID)
  const reservationsEnAttente = useMemo(() => {
    return reservations.filter(r => 
      r?.statut === 'ATTENTE_PAIEMENT' || 
      r?.statut === 'EN_ATTENTE_AGENCE' || 
      r?.statut === 'EN_ATTENTE' ||
      r?.statut === 'ATTENTE_PAIEMENT_SURPLUS'
    );
  }, [reservations]);

  // 🛠️ Fonction utilitaire sécurisée pour obtenir le total exact d'une réservation
  const getMontantTotalSecurise = (r) => {
    if (r.montant_total) return r.montant_total;
    const base = r.montantPaye || r.trajet?.prix || 0;
    const surplus = r.demande_recuperation?.prixSupplementaire || 0;
    return base + surplus;
  };

  // ENCAISSEMENT VIA LE FORMULAIRE DE SELECTION
  const handleDirectCashPaiement = async (e) => {
    e.preventDefault();
    const selectedRes = reservationsEnAttente.find(r => r.id.toString() === cashPayload.reservationId);
    
    if (!selectedRes) return alert("Veuillez sélectionner une réservation valide");

    const totalAEncaisser = getMontantTotalSecurise(selectedRes);

    if (!window.confirm(`Confirmer l'encaissement physique de ${totalAEncaisser.toLocaleString('fr-FR')} FC au guichet ?`)) return;

    try {
      const token = localStorage.getItem('token');
      
      await api.post(`/paiements/encaisser-guichet`, {
        reservationId: selectedRes.id,
        modePaiement: "CASH",
        reference: "CASH-GUICHET"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`Paiement encaissé avec succès ! Le statut est passé à validé et le montant total a été versé.`);
      setShowCashForm(false);
      setCashPayload({ reservationId: "", montant: "" });
      fetchInitialData();
      fetchCommissionEtNotifs();
    } catch (error) {
      console.error("Erreur Backend lors de l'encaissement :", error.response?.data);
      alert(error.response?.data?.message || "Erreur lors de la validation du paiement au guichet.");
    }
  };

  // ENCAISSEMENT RAPIDE VIA LE BOUTON DE LA LIGNE DU TABLEAU
  const handleEncaisserPaiementRapide = async (reservation) => {
    const totalAEncaisser = getMontantTotalSecurise(reservation);

    if (!window.confirm(`Confirmer la réception des espèces de ${totalAEncaisser.toLocaleString('fr-FR')} FC pour la réservation de ${reservation.client?.nom || 'ce client'} ?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await api.post(`/paiements/encaisser-guichet`, { 
        reservationId: reservation.id,
        modePaiement: "CASH",
        reference: "CASH-GUICHET"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Caisse mise à jour et transactions financières enregistrées avec succès !");
      fetchInitialData(); 
      fetchCommissionEtNotifs();
    } catch (error) {
      console.error("Erreur d'encaissement rapide :", error.response?.data);
      alert(error.response?.data?.message || "Impossible d'encaisser cette réservation.");
    }
  };

  // 📊 CALCUL DES STATISTIQUES COHÉRENTES
  const stats = useMemo(() => {
    const payes = reservations.filter(r => r?.statut === 'PAYE' || r?.statut === 'CONFIRMEE' || r?.statut === 'VALIDEE' || r?.statut === 'EMBARQUE');
    
    return {
      total: payes.reduce((sum, r) => sum + getMontantTotalSecurise(r), 0),
      mobile: payes.filter(r => r.modePaiement && r.modePaiement !== 'CASH').reduce((sum, r) => sum + getMontantTotalSecurise(r), 0),
      cash: payes.filter(r => r.modePaiement === 'CASH' || !r.modePaiement).reduce((sum, r) => sum + getMontantTotalSecurise(r), 0),
      pending: reservationsEnAttente.length
    };
  }, [reservations, reservationsEnAttente]);

  // RECHERCHE FILTRÉE
  const reservationsFiltrées = useMemo(() => {
    return reservations.filter(r => {
      const clientObj = r?.client;
      const nomClient = clientObj ? `${clientObj.nom || ""} ${clientObj.prenom || ""}` : "";
      return nomClient.toLowerCase().includes(searchTerm.toLowerCase()) || (r.codeTicket && r.codeTicket.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [reservations, searchTerm]);

  // 🚀 NOUVEAU : Vérification de la condition d'exemption
  const isAbonnementDefinitif = agenceProfile?.role === 'AGENCY_ADMIN' && agenceProfile?.typeAbonnement === 'DEFINITIF';

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* BANNIÈRE COMMISSION OU ABONNEMENT DEFINITIF */}
      {isAbonnementDefinitif ? (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center animate-fadeIn">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center">
                  <FaCrown size={24} />
              </div>
              <div>
                  <h4 className="text-white font-black uppercase text-[10px] tracking-widest">Licence Premium Active</h4>
                  <p className="text-amber-100 text-xs font-bold">Votre agence est exemptée des commissions de la plateforme.</p>
              </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border-l-8 border-emerald-500 rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center">
                  <FaInfoCircle size={24} />
              </div>
              <div>
                  <h4 className="text-white font-black uppercase text-[10px] tracking-widest">Dette Commission</h4>
                  <p className="text-slate-400 text-xs font-bold">À reverser à la plateforme GariConnect</p>
              </div>
          </div>
          <div className="text-right text-white">
              <span className="text-3xl font-black italic">{detteCommission?.toLocaleString('fr-FR')}</span>
              <span className="ml-2 text-emerald-400 font-black text-sm uppercase">FC</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <h1 className="text-3xl font-black flex items-center gap-4">
          <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-lg shadow-blue-500/30">
            <FaCreditCard className="text-white" />
          </div>
          Gestion de la Caisse
        </h1>
        
        <button 
          onClick={() => setShowCashForm(!showCashForm)}
          className="bg-emerald-600 text-white px-6 py-4 rounded-[1.5rem] font-black flex items-center gap-2 shadow-lg transition-transform hover:scale-105 border-0 cursor-pointer"
        >
          {showCashForm ? <FaTimes/> : <FaPlusCircle/>} Nouveau Paiement Cash
        </button>
      </div>

      {/* FORMULAIRE CASH ENCAISSEMENT */}
      {showCashForm && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-emerald-500/20 shadow-xl animate-fadeIn">
          <h3 className="text-emerald-600 font-black uppercase text-xs mb-6 flex items-center gap-2">
            <FaCashRegister/> Encaisser des espèces au guichet agence
          </h3>
          <form onSubmit={handleDirectCashPaiement} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <select 
              className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none font-bold text-sm border border-transparent focus:border-emerald-500 text-slate-800 dark:text-slate-100"
              value={cashPayload.reservationId}
              onChange={(e) => {
                const resId = e.target.value;
                const selected = reservationsEnAttente.find(r => r.id.toString() === resId);
                if (selected) {
                  const total = getMontantTotalSecurise(selected);
                  setCashPayload({ 
                    reservationId: resId, 
                    montant: total
                  });
                } else {
                  setCashPayload({ reservationId: "", montant: "" });
                }
              }}
              required
            >
              <option value="">Sélectionner le dossier client en attente...</option>
              {reservationsEnAttente.map(res => {
                const total = getMontantTotalSecurise(res);
                return (
                  <option key={res.id} value={res.id}>
                    Code: {res.codeTicket || `ID-${res.id}`} — {res.client?.nom?.toUpperCase()} ({total.toLocaleString('fr-FR')} FC)
                  </option>
                );
              })}
            </select>

            <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Montant total à percevoir"
                className="p-4 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 outline-none font-black text-sm border border-transparent text-slate-900 dark:text-white"
                value={cashPayload.montant ? `${parseFloat(cashPayload.montant).toLocaleString('fr-FR')} FC` : ""}
                disabled
                required
              />
            </div>

            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg transition-all text-xs tracking-wider border-0 cursor-pointer">
              VALIDER ET ENREGISTRER L'ENCAISSEMENT
            </button>
          </form>
        </div>
      )}
      
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Recette Totale" value={stats.total} icon={<FaWallet />} color="emerald" unit="FC" />
        <StatCard title="Mobile Money" value={stats.mobile} icon={<FaMobileAlt />} color="blue" unit="FC" />
        <StatCard title="Espèces Guichet" value={stats.cash} icon={<FaMoneyBillWave />} color="amber" unit="FC" />
        <StatCard title="Dossiers en Attente" value={stats.pending} icon={<FaClock />} color="rose" isCount />
      </div>

      {/* RECHERCHE */}
      <div className="relative">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom de voyageur, passager ou code billet..."
            className="w-full bg-white dark:bg-slate-900 pl-14 pr-6 py-5 rounded-[1.8rem] outline-none border border-slate-200 dark:border-slate-800 font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      {/* TABLEAU DES FLUX FINANCIERS COMPLET */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left bg-transparent">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <tr>
                        <th className="px-8 py-6 font-black">N° Billet / Référence</th>
                        <th className="px-8 py-6 font-black">Nom du Client</th>
                        <th className="px-8 py-6 font-black">Type & Option</th>
                        <th className="px-8 py-6 font-black">Mode de Règlement</th>
                        <th className="px-8 py-6 font-black text-right">Frais de Voyage Total</th>
                        <th className="px-8 py-6 font-black text-center">Statut Transaction</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-sm">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="p-16 text-center text-blue-500 font-black animate-pulse">
                                Synchronisation avec le livre de caisse en cours...
                            </td>
                        </tr>
                    ) : reservationsFiltrées.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="p-10 text-center text-slate-400 font-bold">
                                Aucun flux ou réservation trouvé dans le registre de cette agence.
                            </td>
                        </tr>
                    ) : reservationsFiltrées.map(r => {
                        const prixTotalGlobal = getMontantTotalSecurise(r);
                        const surplusRamassage = r.demande_recuperation?.prixSupplementaire || 0;
                        const coutDeBase = prixTotalGlobal - surplusRamassage;

                        const aUnSurplus = surplusRamassage > 0;

                        return (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-8 py-6 font-mono font-bold text-blue-600">
                                {r.codeTicket || `RES-00${r.id}`}
                            </td>
                            <td className="px-8 py-6 font-black uppercase text-xs">
                                {r.client?.nom ? `${r.client.nom} ${r.client.prenom || ""}` : "Passager Anonyme"}
                            </td>
                            <td className="px-8 py-6 text-xs">
                                {aUnSurplus ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 rounded-lg font-extrabold uppercase text-[10px]">
                                    <FaCar size={10}/> VID + Ramassage
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">Standard</span>
                                )}
                            </td>
                            <td className="px-8 py-6 italic text-xs text-slate-500">
                                {r.statut === 'PAYE' || r.statut === 'CONFIRMEE' || r.statut === 'VALIDEE' || r.statut === 'EMBARQUE' 
                                  ? (r.modePaiement || 'CASH') 
                                  : r.statut === 'ATTENTE_PAIEMENT_SURPLUS' ? 'SURPLUS COMPLÉMENTAIRE' : 'A RÉGLER AU GUICHET'}
                            </td>
                            <td className="px-8 py-6 text-right md:text-right">
                                <div className="text-slate-900 dark:text-white font-black text-sm">
                                    {prixTotalGlobal.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-400">FC</span>
                                </div>
                                {aUnSurplus && (
                                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                    (Billet: {coutDeBase.toLocaleString('fr-FR')} + Hors-murs: {surplusRamassage.toLocaleString('fr-FR')})
                                  </div>
                                )}
                            </td>
                            <td className="px-8 py-6 text-center">
                                {r.statut === 'PAYE' || r.statut === 'CONFIRMEE' || r.statut === 'VALIDEE' || r.statut === 'EMBARQUE' ? (
                                    <span className="text-emerald-500 font-black text-[10px] uppercase flex items-center justify-center gap-1 bg-emerald-500/10 py-2 px-3 rounded-full mx-auto w-max">
                                        <FaCheckDouble/> Encaissé & Validé
                                    </span>
                                ) : (
                                    <button 
                                        onClick={() => handleEncaisserPaiementRapide(r)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-black text-[10px] tracking-wider transition-colors shadow-sm shadow-blue-500/20 border-0 cursor-pointer"
                                    >
                                        {r.statut === 'ATTENTE_PAIEMENT_SURPLUS' ? "ENCAISSER SURPLUS" : "PERCEVOIR CASH"}
                                    </button>
                                )}
                            </td>
                        </tr>
                      );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, unit, isCount }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-5 shadow-sm">
    <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center text-xl ${
      color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
    }`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
        {(value || 0).toLocaleString('fr-FR')} {!isCount && <span className="text-[10px] text-slate-400 font-bold">{unit}</span>}
      </p>
    </div>
  </div>
);

export default GestionPaiements;
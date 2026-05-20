import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaCreditCard, FaSearch, FaMoneyBillWave, 
  FaMobileAlt, FaWallet, FaHistory, FaClock, 
  FaUser, FaCog, FaTimes, FaCashRegister, FaBell, FaInfoCircle, FaCheckDouble, FaPlusCircle
} from 'react-icons/fa';
import api from '../../services/api';

const GestionPaiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("Tous");
  const [showCashForm, setShowCashForm] = useState(false);
  const [detteCommission, setDetteCommission] = useState(0);

  // Formulaire pour nouveau paiement cash
  const [cashPayload, setCashPayload] = useState({ reservationId: "", montant: "" });

  useEffect(() => {
    fetchInitialData();
    fetchCommissionEtNotifs();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // 1. Appel de l'URL globale corrigée
      const resPaiements = await api.get('/reservations', {
        headers: { Authorization: `Bearer ${token}` }
      }); 
      
      // 2. Extraction sécurisée des données selon le format de Spring Boot
      let rawData = [];
      if (Array.isArray(resPaiements.data)) {
        rawData = resPaiements.data;
      } else if (resPaiements.data && Array.isArray(resPaiements.data.content)) {
        rawData = resPaiements.data.content;
      } else if (resPaiements.data && Array.isArray(resPaiements.data.reservations)) {
        rawData = resPaiements.data.reservations;
      }

      console.log("Données reçues de l'API (Paiements):", rawData);
      setPaiements(rawData);
    } catch (error) {
      console.error("Erreur chargement données de paiements:", error);
    } finally {
      setLoading(false);
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

  const reservationsEnAttente = useMemo(() => {
    return paiements.filter(p => p?.statut === 'EN_ATTENTE_AGENCE' || p?.statut === 'EN_ATTENTE');
  }, [paiements]);

  /**
   * SOLUTION DÉFINITIVE : Extraction de l'ID de paiement réel
   * Cette fonction cherche l'ID du paiement peu importe son nom dans votre DB
   */
  const getPaiementId = (item) => {
    return item?.paiementId || (item?.paiement && item.paiement.id) || item?.id_paiement || item?.id;
  };

  const handleDirectCashPaiement = async (e) => {
    e.preventDefault();
    const selectedRes = reservationsEnAttente.find(r => r.id.toString() === cashPayload.reservationId);
    
    if(!selectedRes) return alert("Veuillez sélectionner une réservation");

    // On récupère l'ID du paiement (et non de la réservation)
    const targetId = getPaiementId(selectedRes);

    if (!window.confirm(`Confirmer l'encaissement de ${cashPayload.montant} FC ?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/paiements/${targetId}/encaisser`, {
        montant: parseFloat(cashPayload.montant)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`Paiement réussi ! Ticket généré.`);
      setShowCashForm(false);
      setCashPayload({ reservationId: "", montant: "" });
      fetchInitialData();
      fetchCommissionEtNotifs();
    } catch (error) {
      console.error("Erreur Backend:", error.response?.data);
      alert(error.response?.data?.message || "Erreur : L'ID envoyé ne correspond à aucun paiement existant.");
    }
  };

  const handleEncaisserPaiementRapide = async (p) => {
    const targetId = getPaiementId(p);

    if (!window.confirm("Confirmer la réception de ce montant ?")) return;
    try {
      const token = localStorage.getItem('token');
      await api.post(`/paiements/${targetId}/encaisser`, { 
        montant: parseFloat(p.montantPaye || p.prixTotal) 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Caisse mise à jour avec succès !");
      fetchInitialData(); 
      fetchCommissionEtNotifs();
    } catch (error) {
      alert(error.response?.data?.message || "Erreur d'encaissement.");
    }
  };

  const stats = useMemo(() => {
    const valid = paiements.filter(p => p?.statut === 'CONFIRMEE');
    return {
      total: valid.reduce((sum, p) => sum + (p.montantPaye || 0), 0),
      mobile: valid.filter(p => p.modePaiement !== 'CASH').reduce((sum, p) => sum + (p.montantPaye || 0), 0),
      cash: valid.filter(p => p.modePaiement === 'CASH').reduce((sum, p) => sum + (p.montantPaye || 0), 0),
      pending: reservationsEnAttente.length
    };
  }, [paiements, reservationsEnAttente]);

  const paiementsFiltrés = useMemo(() => {
    return paiements.filter(p => {
      const clientObj = p?.client || p?.reservation?.client;
      const nomClient = clientObj ? `${clientObj.nom || ""} ${clientObj.prenom || ""}` : "";
      return nomClient.toLowerCase().includes(searchTerm.toLowerCase()) &&
             (filterMode === "Tous" || p?.modePaiement === filterMode);
    });
  }, [paiements, searchTerm, filterMode]);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* BANNIÈRE COMMISSION */}
      <div className="bg-slate-900 border-l-8 border-emerald-500 rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center">
                <FaInfoCircle size={24} />
            </div>
            <div>
                <h4 className="text-white font-black uppercase text-[10px] tracking-widest">Dette Commission</h4>
                <p className="text-slate-400 text-xs font-bold">À reverser à la plateforme</p>
            </div>
        </div>
        <div className="text-right text-white">
            <span className="text-3xl font-black italic">{detteCommission?.toLocaleString()}</span>
            <span className="ml-2 text-emerald-400 font-black text-sm uppercase">FC</span>
        </div>
      </div>

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
          className="bg-emerald-600 text-white px-6 py-4 rounded-[1.5rem] font-black flex items-center gap-2 shadow-lg"
        >
          {showCashForm ? <FaTimes/> : <FaPlusCircle/>} Nouveau Paiement Cash
        </button>
      </div>

      {/* FORMULAIRE CASH */}
      {showCashForm && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-emerald-500/20 shadow-xl">
          <h3 className="text-emerald-600 font-black uppercase text-xs mb-6 flex items-center gap-2">
            <FaCashRegister/> Encaisser des espèces
          </h3>
          <form onSubmit={handleDirectCashPaiement} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <select 
              className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none font-bold"
              value={cashPayload.reservationId}
              onChange={(e) => {
                const resId = e.target.value;
                const selected = reservationsEnAttente.find(r => r.id.toString() === resId);
                setCashPayload({ 
                  reservationId: resId, 
                  montant: selected ? (selected.montantPaye || selected.prixTotal) : "" 
                });
              }}
              required
            >
              <option value="">Choisir la réservation...</option>
              {reservationsEnAttente.map(res => (
                <option key={res.id} value={res.id}>
                  {res.client?.nom} - {(res.montantPaye || res.prixTotal || 0).toLocaleString()} FC
                </option>
              ))}
            </select>

            <input 
              type="number" 
              placeholder="Montant perçu"
              className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none font-bold"
              value={cashPayload.montant}
              onChange={(e) => setCashPayload({...cashPayload, montant: e.target.value})}
              required
            />

            <button type="submit" className="bg-emerald-500 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-600 transition-all">
              VALIDER L'ENCAISSEMENT
            </button>
          </form>
        </div>
      )}
      
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Recette Totale" value={stats.total} icon={<FaWallet />} color="emerald" unit="FC" />
        <StatCard title="Mobile Money" value={stats.mobile} icon={<FaMobileAlt />} color="blue" unit="FC" />
        <StatCard title="Espèces" value={stats.cash} icon={<FaMoneyBillWave />} color="amber" unit="FC" />
        <StatCard title="Attentes" value={stats.pending} icon={<FaClock />} color="rose" isCount />
      </div>

      {/* RECHERCHE */}
      <div className="relative">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un client..."
            className="w-full bg-white dark:bg-slate-900 pl-14 pr-6 py-5 rounded-[1.8rem] outline-none border border-slate-100 dark:border-slate-800 font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      {/* TABLEAU DES FLUX */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase tracking-widest">
                    <tr>
                        <th className="px-8 py-6 font-black">Ticket</th>
                        <th className="px-8 py-6 font-black">Client</th>
                        <th className="px-8 py-6 font-black">Mode</th>
                        <th className="px-8 py-6 font-black text-right">Montant</th>
                        <th className="px-8 py-6 font-black text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="p-16 text-center text-blue-500 font-black animate-pulse">
                                Chargement des transactions...
                            </td>
                        </tr>
                    ) : paiementsFiltrés.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="p-10 text-center text-slate-400 font-bold">
                                Aucun paiement trouvé.
                            </td>
                        </tr>
                    ) : paiementsFiltrés.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6 font-mono font-bold text-blue-600">
                                {p.codeTicket || `RES-${p.id}`}
                            </td>
                            <td className="px-8 py-6 font-black uppercase">
                                {p.client?.nom || p.reservation?.client?.nom || "Client Inconnu"}
                            </td>
                            <td className="px-8 py-6 italic text-xs">
                                {p.modePaiement || 'NON DÉFINI'}
                            </td>
                            <td className="px-8 py-6 text-right font-black">
                                {(p.montantPaye || p.prixTotal || 0).toLocaleString()} FC
                            </td>
                            <td className="px-8 py-6 text-center">
                                {p.statut === 'CONFIRMEE' ? (
                                    <span className="text-emerald-500 font-black text-[10px] uppercase flex items-center justify-center gap-1">
                                        <FaCheckDouble/> Encaissé
                                    </span>
                                ) : (
                                    <button 
                                        onClick={() => handleEncaisserPaiementRapide(p)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-black text-[10px]"
                                    >
                                        ENCAISSER
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, unit, isCount }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center text-xl ${
      color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
    }`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black">
        {(value || 0).toLocaleString()} {!isCount && <span className="text-[10px] text-slate-400">{unit}</span>}
      </p>
    </div>
  </div>
);

export default GestionPaiements;
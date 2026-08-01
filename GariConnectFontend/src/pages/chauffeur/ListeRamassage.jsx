import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import ScannerTicket from './ScannerTicket'; // 🟢 Import du scanner
import { AnimatePresence } from 'framer-motion';

const ListeRamassage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const arret = location.state?.arret;
  const trajet = location.state?.trajet;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 États pour le contrôle du scanner QR
  const [scanOuvert, setScanOuvert] = useState(false);
  const [clientEnCours, setClientEnCours] = useState(null);

  useEffect(() => {
    if (!arret) {
      navigate('/chauffeur/course-actuelle');
      return;
    }

    const fetchPassagers = async () => {
      try {
        const response = await api.get(`/arrets/${arret.id}/clients`);
        const passagersFormates = response.data.map(item => ({
            id: item.id,
            nom: item.client?.nom || "Client inconnu",
            siege: item.numeroSiege ? `Place ${item.numeroSiege}` : "Place libre",
            codeTicket: item.codeTicket,
            embarque: item.statutEmbarquement === "A_BORD"
        }));
        setClients(passagersFormates);
      } catch (error) {
        console.error("Erreur de récupération des clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPassagers();
  }, [arret, navigate]);

  // 🟢 1. Clic sur le bouton : Sélectionne le client et ouvre la caméra
  const handleOuvrirScanner = (client) => {
    setClientEnCours(client);
    setScanOuvert(true);
  };

  // 🟢 2. Traitement du scan une fois le QR Code détecté
  const handleScanSucces = async (codeScanne) => {
    if (!clientEnCours) return;

    // Vérification du ticket scanné
    if (codeScanne.trim() === clientEnCours.codeTicket.trim()) {
      try {
        // Validation côté Backend si l'endpoint existe
        await api.put(`/reservations/${clientEnCours.id}/statut?statut=A_BORD`);
      } catch (err) {
        console.warn("Serveur non synchronisé, validation locale uniquement.", err);
      }

      // Validation côté UI
      setClients(prevClients =>
        prevClients.map(c =>
          c.id === clientEnCours.id ? { ...c, embarque: true } : c
        )
      );

      alert(`✅ Passager ${clientEnCours.nom} validé avec succès !`);
      setScanOuvert(false);
      setClientEnCours(null);
    } else {
      alert(`❌ Ticket invalide !\nCode attendu : ${clientEnCours.codeTicket}\nCode scanné : ${codeScanne}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col p-4 font-sans selection:bg-indigo-500 transition-colors">
      
      {/* Header avec bouton Retour */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-md transition-colors">
        <button 
          onClick={() => navigate('/chauffeur/course-actuelle', { state: { trajet } })}
          className="p-2 -ml-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-right">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pick-up List</h1>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">{arret?.nom}</p>
        </div>
      </div>

      {/* Liste des passagers */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-6">
        {loading ? (
          <p className="text-center text-slate-500 dark:text-slate-400 mt-10">Recherche des passagers...</p>
        ) : clients.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 mt-10">Aucun passager en attente à cet arrêt.</p>
        ) : (
          clients.map((client) => (
            <div 
              key={client.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                client.embarque 
                  ? 'bg-slate-100/60 dark:bg-slate-900/40 border-emerald-500/30 opacity-60' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-black/20'
              }`}
            >
              {/* Infos Passager */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">{client.nom}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">TICKET: {client.codeTicket}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700">
                    {client.siege}
                  </span>
                  {client.embarque && (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                      ✓ À bord
                    </span>
                  )}
                </div>
              </div>

              {/* Bouton d'action */}
              <div>
                {client.embarque ? (
                  <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  /* 🟢 CLIC POUR LANCER LE SCANNER */
                  <button
                    onClick={() => handleOuvrirScanner(client)}
                    className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white text-sm font-bold h-12 px-5 rounded-xl shadow-lg shadow-emerald-600/20 whitespace-nowrap flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Embarquer
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Résumé de fin de liste */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-600 dark:text-slate-400 transition-colors shadow-sm">
        Embarqués : {clients.filter(c => c.embarque).length} / {clients.length} passagers
      </div>

      {/* 🟢 MODAL DU SCANNER QR CODE */}
      <AnimatePresence>
        {scanOuvert && (
          <ScannerTicket 
            onFermer={() => {
              setScanOuvert(false);
              setClientEnCours(null);
            }}
            onScanSuccess={handleScanSucces} 
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default ListeRamassage;
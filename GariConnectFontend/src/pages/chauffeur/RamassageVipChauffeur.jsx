import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaMapMarkerAlt, FaPhoneAlt, 
  FaDirections, FaUserTie, FaTicketAlt, FaSpinner, FaCheckCircle, FaCarSide 
} from 'react-icons/fa';

import api from '../../services/api';

const RamassageVipChauffeur = () => {
  const { trajetId } = useParams(); 
  const navigate = useNavigate();

  const [vipList, setVipList] = useState([]);
  const [trajetActif, setTrajetActif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const loadVipData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        let targetTrajetId = trajetId;
        let currentTrajet = null;

        // 1. Si on arrive depuis le menu (sans ID dans l'URL), on cherche le trajet du jour
        if (!targetTrajetId) {
            const resTrajets = await api.get('/trajets/mon-historique/aujourdhui', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const trajetsDuJour = resTrajets.data;
            
            if (!trajetsDuJour || trajetsDuJour.length === 0) {
                setLoading(false);
                setError("Vous n'avez aucun trajet programmé pour aujourd'hui. Impossible de trouver des passagers VIP.");
                return;
            }

            // On privilégie le trajet EN_ROUTE, sinon le premier PROGRAMME
            currentTrajet = trajetsDuJour.find(t => t.statut === 'EN_ROUTE') 
                         || trajetsDuJour.find(t => t.statut === 'PROGRAMME') 
                         || trajetsDuJour[0];
            
            targetTrajetId = currentTrajet.id;
        }

        setTrajetActif(currentTrajet);

        // 2. Appel de l'endpoint des passagers VIP
        const response = await api.get(`/recuperations/trajet/${targetTrajetId}/vip`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setVipList(response.data);

      } catch (err) {
        console.error("Erreur lors de la récupération des VIP:", err);
        setError("Impossible de charger la liste des ramassages. Vérifiez votre connexion.");
      } finally {
        setLoading(false);
      }
    };

    loadVipData();
  }, [trajetId]);

  // 🛠️ FONCTION DE NAVIGATION OPTIMISÉE (Utilise la donnée préparée par le backend)
  const openGPS = (vip) => {
    // On vérifie que l'objet vip et l'URL générée par le backend existent
    if (vip && vip.googleMapsUrl) {
      // Ouvre directement Google Maps (App native sur mobile, ou nouvel onglet sur PC)
      window.open(vip.googleMapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert("Aucun itinéraire ou adresse n'est disponible pour ce client.");
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-slate-950 text-indigo-400' : 'bg-slate-50 text-indigo-600'}`}>
        <FaSpinner className="animate-spin text-4xl mb-4" />
        <p className="font-black animate-pulse">Recherche des passagers VIP...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full p-4 md:p-8 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <div className="max-w-3xl mx-auto mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-sm font-bold mb-6 text-slate-500 hover:text-indigo-500 transition-colors"
        >
          <FaArrowLeft /> Retour
        </button>
        
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/30 text-white">
            <FaMapMarkerAlt />
          </div>
          Mission de Ramassage VIP
        </h1>
        
        {trajetActif && (
            <div className="mt-4 inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">
                <FaCarSide /> Trajet : {trajetActif.depart} ➔ {trajetActif.destination}
            </div>
        )}
        
        <p className="text-sm font-bold text-slate-500 mt-3">
          {vipList.length} passager(s) à récupérer à domicile pour ce voyage.
        </p>
      </div>

      {/* GESTION DES ERREURS & LISTE VIDE */}
      <div className="max-w-3xl mx-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {!loading && !error && vipList.length === 0 && (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <FaCheckCircle className="text-5xl text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">Aucun VIP à récupérer</h3>
            <p className="text-slate-500 mt-2 font-medium">Vous pouvez vous rendre directement à l'agence pour le départ standard.</p>
          </div>
        )}

        {/* LISTE DES PASSAGERS VIP */}
        {vipList.map((vip, index) => (
          <div 
            key={vip.demandeId} 
            className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col gap-5"
          >
            {/* Infos Client */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                    VIP {index + 1}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                    <FaTicketAlt /> {vip.codeTicket}
                  </span>
                </div>
                <h2 className="text-xl font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                  <FaUserTie className="text-indigo-500" /> {vip.clientNom}
                </h2>
                {vip.numeroSiege && vip.numeroSiege !== "N/A" && (
                  <p className="text-sm font-bold text-indigo-500 mt-1">Siège N° {vip.numeroSiege}</p>
                )}
              </div>
            </div>

            {/* Infos Adresse */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                <span className="text-slate-400 uppercase text-[10px] block tracking-widest mb-1">Adresse indiquée</span>
                {vip.adresseTextuelle || "Aucune adresse textuelle fournie"}
              </p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed">
                <span className="text-emerald-600/50 dark:text-emerald-500/50 uppercase text-[10px] block tracking-widest mb-1">Point de repère Agence</span>
                📍 {vip.pointRepere}
              </p>
            </div>

            {/* Boutons d'Action */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <a 
                href={`tel:${vip.clientTelephone}`}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white py-3 sm:py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors"
              >
                <FaPhoneAlt className="text-lg sm:text-base text-blue-500" /> 
                <span className="hidden sm:inline">Appeler</span>
              </a>

              <button 
                onClick={() => openGPS(vip)}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 sm:py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-transform active:scale-[0.98]"
              >
                <FaDirections className="text-xl sm:text-base" /> 
                <span className="hidden sm:inline">Y aller</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RamassageVipChauffeur;
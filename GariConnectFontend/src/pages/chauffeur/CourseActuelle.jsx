import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { FaMapMarkerAlt, FaChevronRight, FaSpinner, FaExchangeAlt } from 'react-icons/fa';

const CourseActuelle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const trajetInitial = location.state?.trajet;

  const [trajet, setTrajet] = useState(trajetInitial || null);
  const [arrets, setArrets] = useState([]);
  const [arretActuel, setArretActuel] = useState(null);
  const [nbPassagers, setNbPassagers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si l'utilisateur rafraîchit la page sans state de navigation
    if (!trajetInitial) {
      api.get('/trajets/mon-historique/aujourdhui')
        .then(res => {
          const actif = res.data.find(t => t.statut === 'EN_ROUTE');
          if (actif) {
            setTrajet(actif);
            chargerArretsEtClients(actif.id);
          } else {
            setError("Aucun trajet en cours trouvé.");
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Erreur de récupération du trajet:", err);
          setError("Impossible de charger le trajet en cours.");
          setLoading(false);
        });
    } else {
      chargerArretsEtClients(trajetInitial.id);
    }
  }, [trajetInitial]);

  const chargerArretsEtClients = async (trajetId) => {
    setLoading(true);
    try {
      // 1. Récupération des vrais arrêts depuis la BDD
      const resArrets = await api.get(`/arrets/trajet/${trajetId}`);
      const listeArrets = resArrets.data || [];
      setArrets(listeArrets);

      if (listeArrets.length > 0) {
        const premierArret = listeArrets[0];
        setArretActuel(premierArret);

        // 2. Récupération du nombre réel de clients à cet arrêt
        const resClients = await api.get(`/arrets/${premierArret.id}/clients`);
        setNbPassagers(resClients.data ? resClients.data.length : 0);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données BDD:", err);
      setError("Erreur de connexion avec le serveur backend.");
    } finally {
      setLoading(false);
    }
  };

  const changerArret = async (nouvelArret) => {
    setArretActuel(nouvelArret);
    try {
      const resClients = await api.get(`/arrets/${nouvelArret.id}/clients`);
      setNbPassagers(resClients.data ? resClients.data.length : 0);
    } catch (err) {
      console.error("Erreur lors de la mise à jour des passagers:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white flex flex-col items-center justify-center p-4 transition-colors">
        <FaSpinner className="animate-spin text-indigo-600 dark:text-indigo-500 mb-4" size={40} />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Chargement des arrêts depuis la BDD...</p>
      </div>
    );
  }

  if (error || !arretActuel) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white flex flex-col items-center justify-center p-6 text-center transition-colors">
        <p className="text-rose-600 dark:text-rose-400 font-semibold mb-4">{error || "Aucun arrêt configuré pour ce trajet dans la BDD."}</p>
        <button 
          onClick={() => navigate('/chauffeur')} 
          className="px-6 py-3 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col p-6 font-sans transition-colors">
      
      {/* Badge statut */}
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
          Course en cours
        </span>
      </div>

      <h1 className="text-center text-xl font-black mb-2 text-slate-800 dark:text-slate-100">
        Gariconnect Chauffeur
      </h1>

      {/* Affichage de la ligne du trajet */}
      {trajet && (
        <p className="text-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-6">
          Ligne : {trajet.depart} → {trajet.destination}
        </p>
      )}

      {/* Carte Prochain Arrêt */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-6 flex flex-col items-center text-center shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-colors">
        <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
          <FaMapMarkerAlt size={28} />
        </div>

        <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">
          Prochain Arrêt
        </p>

        {/* Nom de l'arrêt */}
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
          {arretActuel.nom || trajet?.destination || "Arrêt inconnu"}
        </h2>

        {/* Bloc Nombre de clients */}
        <div className="w-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 mt-4 transition-colors">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Nombre de clients à récupérer :</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {nbPassagers} {nbPassagers > 1 ? 'passagers' : 'passager'}
          </p>
        </div>
      </div>

      {/* Bouton vers la liste de ramassage */}
      <button
        onClick={() => navigate('/chauffeur/liste-ramassage', { state: { arret: arretActuel, trajet } })}
        className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/30 text-base mb-6"
      >
        <span>Voir la liste de ramassage</span>
        <FaChevronRight size={16} />
      </button>

      {/* Selecteur / Liste si le trajet possède plusieurs arrêts */}
      {arrets.length > 1 && (
        <div className="mt-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            <FaExchangeAlt size={12} />
            <span>Sélectionner un autre arrêt de la ligne :</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {arrets.map((a) => (
              <button
                key={a.id}
                onClick={() => changerArret(a)}
                className={`w-full p-3 rounded-xl border text-left flex justify-between items-center text-xs font-bold transition-all ${
                  arretActuel.id === a.id 
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{a.nom}</span>
                {arretActuel.id === a.id && (
                  <span className="text-[10px] bg-indigo-600 dark:bg-indigo-500 text-white px-2 py-0.5 rounded">
                    Actuel
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseActuelle;
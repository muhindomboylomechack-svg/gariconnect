import React, { useState, useEffect, useRef } from 'react';
import { Bell, MapPin, DollarSign, Navigation, CheckCircle, AlertTriangle, Calculator, Coins, History, Clock, Search, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../services/api';

// 📍 Coordonnées de référence de votre Agence (Kinshasa par exemple)
const COORDONNEES_AGENCE = { lat: -4.325, lng: 15.322 }; 

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Calcul de la distance géodésique (Haversine)
const calculerDistanceKilometrique = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

// Composant de recentrage automatique de la carte
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 14);
    }
  }, [lat, lng, map]);
  return null;
};

const InterfaceCotationAgent = () => {
  const [demandes, setDemandes] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [activeTab, setActiveTab] = useState('ATTENTE'); // 'ATTENTE' ou 'TRAITEES'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAlert, setNewAlert] = useState(false);

  // 🔍 Barre de recherche et Sélection multiple pour l'historique
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  
  // 👆 GESTION DU LONG PRESS (Appui long)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const pressTimerRef = useRef(null);

  // 💰 État pour le tarif dynamique par kilomètre (par défaut à 5000 FC)
  const [tarifParKm, setTarifParKm] = useState(5000);

  // Utilisation d'une référence pour éviter les boucles infinies dans le useEffect
  const demandesLengthRef = useRef(0);

  // Formulaire local pour la cotation
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [formData, setFormData] = useState({
    pointRepereAgence: '',
    distanceEstimee: '',
    prixSupplementaire: ''
  });

  // 1. Récupération des demandes en attente
  const fetchDemandesEnAttente = async () => {
    try {
      const response = await api.get('/recuperations/en-attente');
      const data = response.data;
      
      if (data.length > demandesLengthRef.current && demandesLengthRef.current > 0) {
        setNewAlert(true);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.play().catch(e => console.log("Audio bloqué par le navigateur"));
      }

      demandesLengthRef.current = data.length;
      setDemandes(data);
      if (activeTab === 'ATTENTE') setLoading(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la récupération des demandes';
      setError(errorMsg);
      setLoading(false);
    }
  };

  // 2. Récupération de l'historique des demandes traitées
  const fetchHistoriqueTraitees = async () => {
    try {
      const response = await api.get('/recuperations/traitees');
      setHistorique(response.data);
      if (activeTab === 'TRAITEES') setLoading(false);
    } catch (err) {
      console.error("Erreur historique:", err);
    }
  };

  // Chargement initial et rafraîchissement périodique
  useEffect(() => {
    setLoading(true);
    fetchDemandesEnAttente();
    fetchHistoriqueTraitees();

    const interval = setInterval(() => {
      fetchDemandesEnAttente();
      if (activeTab === 'TRAITEES') {
        fetchHistoriqueTraitees();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleActionCotation = async (e) => {
    e.preventDefault();
    try {
      const distanceEnvoyee = parseFloat(formData.distanceEstimee) || 0.0;
      const prixEnvoye = parseFloat(formData.prixSupplementaire) || 0.0;

      const payload = {
        pointRepereAgence: formData.pointRepereAgence,
        distanceEstimee: distanceEnvoyee,
        prixSupplementaire: prixEnvoye
      };

      await api.put(`/recuperations/${selectedDemande.id}/cotation`, payload);

      setSelectedDemande(null);
      setFormData({ pointRepereAgence: '', distanceEstimee: '', prixSupplementaire: '' });
      
      // Rafraîchir les deux listes après soumission
      fetchDemandesEnAttente(); 
      fetchHistoriqueTraitees();
      alert("✅ Cotation transmise avec succès au passager !");
    } catch (err) {
      console.error("❌ Détail technique de l'erreur :", err);
      const errorPayloadMsg = err.response?.data?.message || err.message;
      alert("Erreur lors du traitement de la cotation : " + errorPayloadMsg);
    }
  };

  // Sélection d'une demande et calcul initial basé sur le tarifKm actuel
  const selectionnerEtCalculerDemande = (demande) => {
    // Si la demande est déjà traitée, on l'affiche en lecture seule sur la carte
    if (activeTab === 'TRAITEES') {
      setSelectedDemande(demande);
      setFormData({
        pointRepereAgence: demande.pointRepereAgence || '',
        distanceEstimee: (demande.distanceEstimee || 0).toString(),
        prixSupplementaire: (demande.prixSupplementaire || 0).toString()
      });
      return;
    }

    setSelectedDemande(demande);

    const distanceBrute = calculerDistanceKilometrique(
      COORDONNEES_AGENCE.lat,
      COORDONNEES_AGENCE.lng,
      demande.latitudeClient,
      demande.longitudeClient
    );
    
    const distanceArrondie = parseFloat(distanceBrute.toFixed(1));
    const prixSuggere = Math.round(distanceArrondie * tarifParKm);

    setFormData({
      pointRepereAgence: `Depuis Siège Agence via axe principal`,
      distanceEstimee: distanceArrondie.toString(),
      prixSupplementaire: prixSuggere.toString()
    });
  };

  const recalculerPrixAutomatique = (nouvelleDistance, nouveauTarif) => {
    const dist = parseFloat(nouvelleDistance) || 0;
    const tarif = parseFloat(nouveauTarif) || 0;
    return Math.round(dist * tarif).toString();
  };

  // 👆 MÉTHODES POUR LE LONG PRESS ET LA SÉLECTION
  const handlePressStart = (demandeId) => {
    // On lance le chrono pour 600ms
    pressTimerRef.current = setTimeout(() => {
      setIsSelectionMode(true);
      // On ajoute l'élément longuement pressé à la sélection s'il n'y est pas
      setSelectedForDeletion((prev) => 
        prev.includes(demandeId) ? prev : [...prev, demandeId]
      );
      // Vibration si disponible sur le téléphone
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 600);
  };

  const handlePressEnd = () => {
    // Si on relâche avant les 600ms, on annule le timer
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const toggleSelection = (id) => {
    setSelectedForDeletion((prev) => {
      const newSelection = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      // Désactiver le mode sélection si on désélectionne le dernier élément
      if (newSelection.length === 0) {
        setIsSelectionMode(false);
      }
      return newSelection;
    });
  };

  // 🗑️ SUPPRESSION (HISTORIQUE)
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) return;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ces ${selectedForDeletion.length} demande(s) de l'historique ?`)) {
      try {
        await Promise.all(selectedForDeletion.map(id => api.delete(`/recuperations/${id}`)));
        
        alert("✅ Historique nettoyé avec succès !");
        setSelectedForDeletion([]);
        setIsSelectionMode(false); // On quitte le mode sélection
        
        if (selectedDemande && selectedForDeletion.includes(selectedDemande.id)) {
             setSelectedDemande(null);
        }
        fetchHistoriqueTraitees();
      } catch (err) {
        console.error("Erreur de suppression :", err);
        alert("Une erreur est survenue lors de la suppression.");
      }
    }
  };

  // 🔍 Filtrage de l'historique
  const historiqueFiltre = historique.filter((demande) => {
    const searchLower = searchQuery.toLowerCase();
    const nomClient = (demande.client?.nom || "Passager GariConnect").toLowerCase();
    const adresse = (demande.adresseTextuelle || "").toLowerCase();
    const resId = (demande.reservationId || "").toString();

    return nomClient.includes(searchLower) || adresse.includes(searchLower) || resId.includes(searchLower);
  });

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Navigation className="text-blue-500" /> Gestion des Ramassages VIP & Domicile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Analyse des positions GPS, ajustement des grilles tarifaires et suivi des demandes traitées.
          </p>
        </div>
        
        {/* NOTIFICATION BADGE */}
        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="relative">
            <Bell className={`h-6 w-6 ${demandes.length > 0 ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
            {demandes.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {demandes.length}
              </span>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Flux alertes</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{demandes.length} en attente</div>
          </div>
        </div>
      </div>

      {/* ALERT FLASH */}
      {newAlert && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/50 text-amber-800 dark:text-amber-400 p-4 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div><span className="font-bold">Alerte :</span> Une nouvelle demande vient d'arriver !</div>
          </div>
          <button onClick={() => setNewAlert(false)} className="text-xs bg-amber-600 text-white px-3 py-1 rounded font-bold hover:bg-amber-700 transition">
            Prendre connaissance
          </button>
        </div>
      )}

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BLOC NAVIGATION & LISTES (GAUCHE) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* SYSTEME D'ONGLETS (TABS) */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => { 
                  setActiveTab('ATTENTE'); 
                  setSelectedDemande(null); 
                  setIsSelectionMode(false); // Quitter le mode sélection
                  setSelectedForDeletion([]);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'ATTENTE' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="h-4 w-4" /> En attente ({demandes.length})
              </button>
              <button
                onClick={() => { 
                  setActiveTab('TRAITEES'); 
                  setSelectedDemande(null); 
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'TRAITEES' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <History className="h-4 w-4" /> Historique ({historique.length})
              </button>
            </div>

            {/* BARRE DE RECHERCHE & BOUTON SUPPRESSION (Uniquement si Historique actif) */}
            {activeTab === 'TRAITEES' && (
              <div className="flex items-center gap-2">
                {!isSelectionMode && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}
                
                {/* Options du mode sélection */}
                {isSelectionMode && (
                  <>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {selectedForDeletion.length} sélectionné(s)
                    </span>
                    <button 
                      onClick={() => { setIsSelectionMode(false); setSelectedForDeletion([]); }}
                      className="text-xs px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                    >
                      Annuler
                    </button>
                    {selectedForDeletion.length > 0 && (
                      <button 
                        onClick={handleDeleteSelected}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center shadow-sm gap-2 text-sm font-medium"
                        title="Supprimer la sélection"
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {loading && <div className="text-slate-500 p-4 bg-white dark:bg-slate-800 rounded-xl animate-pulse">Chargement...</div>}
          {error && <div className="text-rose-600 p-4 bg-rose-50 rounded-xl">{error}</div>}
          
          {/* SELECTION DU CONTENU SELON L'ONGLET ACTIF */}
          {!loading && activeTab === 'ATTENTE' && (
            <div className="space-y-3">
              {demandes.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl text-center text-slate-400">
                  Aucune demande de ramassage en attente pour le moment.
                </div>
              ) : (
                demandes.map((demande) => (
                  <div 
                    key={demande.id} 
                    className={`p-5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                      selectedDemande?.id === demande.id 
                        ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-500 shadow-md' 
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => selectionnerEtCalculerDemande(demande)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-2.5 py-0.5 rounded text-xs font-semibold uppercase">
                        Nouveau
                      </span>
                      <span className="text-xs text-slate-500">Réservation : <strong>#{demande.reservationId}</strong></span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Client :</span> {demande.client?.nom || "Passager GariConnect"}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-rose-500 shrink-0" /> {demande.adresseTextuelle || "Adresse GPS uniquement"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && activeTab === 'TRAITEES' && (
            <div className="space-y-3">
              {historiqueFiltre.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl text-center text-slate-400">
                  Aucun historique ne correspond à votre recherche.
                </div>
              ) : (
                historiqueFiltre.map((demande) => (
                  <div 
                    key={demande.id} 
                    className={`p-5 rounded-xl border transition-all cursor-pointer shadow-sm flex items-start gap-4 ${
                      selectedDemande?.id === demande.id 
                        ? 'bg-emerald-50 dark:bg-emerald-600/10 border-emerald-500 shadow-md' 
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-500/30'
                    }`}
                    // Écouteurs pour le Long Press (PC & Mobile)
                    onMouseDown={() => handlePressStart(demande.id)}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={() => handlePressStart(demande.id)}
                    onTouchEnd={handlePressEnd}
                    // Empêche la sélection de texte pendant l'appui long
                    style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                    onClick={() => {
                      // Si on est en mode sélection, un clic coche/décoche la case
                      if (isSelectionMode) {
                        toggleSelection(demande.id);
                      } else {
                        // Sinon, on affiche les détails comme avant
                        selectionnerEtCalculerDemande(demande);
                      }
                    }}
                  >
                    {/* CHECKBOX DE SÉLECTION (Visible uniquement si Mode Sélection Actif) */}
                    {isSelectionMode && (
                      <div className="pt-1 animate-fadeIn">
                        <input 
                          type="checkbox" 
                          checked={selectedForDeletion.includes(demande.id)}
                          readOnly // C'est le onClick du composant parent (la carte) qui gère l'état
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 w-full pointer-events-none">
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 rounded text-xs font-semibold uppercase">
                          {demande.statut || "COTÉ"}
                        </span>
                        <span className="text-xs text-slate-500">Prix : <strong className="text-emerald-600">{demande.prixSupplementaire?.toLocaleString()} FC</strong></span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="flex justify-between">
                          <span><span className="font-medium">Client :</span> {demande.client?.nom || "Passager GariConnect"}</span>
                          <span className="text-xs text-slate-400">Réf: #{demande.reservationId}</span>
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {demande.adresseTextuelle || "Adresse GPS uniquement"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* COMPOSANT DE DROITE : CONFIGURATION & VISIONNEUSE */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 h-fit shadow-sm sticky top-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="text-emerald-500" /> {activeTab === 'ATTENTE' ? "Outils de Calcul & Tarification" : "Détails du Ramassage"}
          </h2>

          {selectedDemande ? (
            <div className="space-y-4">
              
              {/* INTERACTIVE LEAFLET MAP */}
              <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative z-0 mb-3">
                <MapContainer center={[selectedDemande.latitudeClient, selectedDemande.longitudeClient]} zoom={14} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[selectedDemande.latitudeClient, selectedDemande.longitudeClient]}>
                    <Popup><span className="text-xs font-bold">📍 Position du client ({selectedDemande.client?.nom || 'VIP'})</span></Popup>
                  </Marker>
                  <RecenterMap lat={selectedDemande.latitudeClient} lng={selectedDemande.longitudeClient} />
                </MapContainer>
              </div>

              {activeTab === 'ATTENTE' ? (
                /* CODE DU FORMULAIRE DE COTATION ACTIF */
                <form onSubmit={handleActionCotation} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Point de repère Agence</label>
                    <input 
                      type="text" required
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      value={formData.pointRepereAgence}
                      onChange={(e) => setFormData({...formData, pointRepereAgence: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Calculator className="h-3 w-3 text-blue-500" /> Distance (km)
                      </label>
                      <input 
                        type="number" step="0.1" required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        value={formData.distanceEstimee}
                        onChange={(e) => {
                          const dist = e.target.value;
                          const nouveauPrix = recalculerPrixAutomatique(dist, tarifParKm);
                          setFormData({...formData, distanceEstimee: dist, prixSupplementaire: nouveauPrix});
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Coins className="h-3 w-3 text-amber-500" /> Prix / km (FC)
                      </label>
                      <input 
                        type="number" required
                        className="w-full bg-amber-50/50 dark:bg-amber-950/10 border border-amber-300 dark:border-amber-800 font-semibold rounded-lg px-3 py-2 text-sm text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                        value={tarifParKm}
                        onChange={(e) => {
                          const nouveauTarif = e.target.value;
                          setTarifParKm(nouveauTarif);
                          const nouveauPrix = recalculerPrixAutomatique(formData.distanceEstimee, nouveauTarif);
                          setFormData({...formData, prixSupplementaire: nouveauPrix});
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 font-bold text-emerald-600 dark:text-emerald-400">
                      Prix Supplémentaire Final (FC)
                    </label>
                    <input 
                      type="number" required
                      className="w-full bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-500/50 font-bold text-emerald-700 dark:text-emerald-400 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-emerald-500 shadow-sm"
                      value={formData.prixSupplementaire}
                      onChange={(e) => setFormData({...formData, prixSupplementaire: e.target.value})}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-2 bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-500 transition flex items-center justify-center gap-2 text-sm shadow cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" /> Transmettre le prix au client
                  </button>
                </form>
              ) : (
                /* COMPOSANT EN LECTURE SEULE POUR L'HISTORIQUE */
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Point de repère enregistré</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{formData.pointRepereAgence || 'Non renseigné'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block">Distance calculée</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formData.distanceEstimee} km</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Statut du dossier</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase text-xs">{selectedDemande.statut || "VALIDÉ"}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-400 block">Montant facturé au client</span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{parseInt(formData.prixSupplementaire).toLocaleString()} FC</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Sélectionnez un ramassage à gauche pour {activeTab === 'ATTENTE' ? "ajuster le tarif kilométrique" : "consulter les détails de la course"}.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InterfaceCotationAgent;
import React, { useState, useEffect } from 'react';
import { Bell, MapPin, DollarSign, Navigation, CheckCircle, AlertTriangle, Calculator, Coins } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 📍 Coordonnées de référence de votre Agence
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAlert, setNewAlert] = useState(false);

  // 💰 État pour le tarif dynamique par kilomètre (par défaut à 5000 FC)
  const [tarifParKm, setTarifParKm] = useState(5000);

  // Formulaire local pour la cotation
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [formData, setFormData] = useState({
    pointRepereAgence: '',
    distanceEstimee: '',
    prixSupplementaire: ''
  });

  const fetchDemandesEnAttente = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/agences/demandes-recuperation/en-attente', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la récupération des demandes');
      
      const data = await response.json();
      
      if (data.length > demandes.length && demandes.length > 0) {
        setNewAlert(true);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.play().catch(e => console.log("Audio bloqué"));
      }

      setDemandes(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandesEnAttente();
    const interval = setInterval(() => {
      fetchDemandesEnAttente();
    }, 10000);
    return () => clearInterval(interval);
  }, [demandes.length]);

  const handleActionCotation = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const distanceEnvoyee = parseFloat(formData.distanceEstimee) || 0.0;
      const prixEnvoye = parseFloat(formData.prixSupplementaire) || 0.0;

      const payload = {
        pointRepereAgence: formData.pointRepereAgence,
        distanceEstimee: distanceEnvoyee,
        prixSupplementaire: prixEnvoye
      };

      console.log("📤 Envoi de la cotation au serveur :", payload);

      const response = await fetch(`http://localhost:8080/api/agences/demandes-recuperation/coter/${selectedDemande.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.warn("Impossible de lire le JSON de l'erreur renvoyée.");
        }
        throw new Error(errorMessage);
      }

      setSelectedDemande(null);
      setFormData({ pointRepereAgence: '', distanceEstimee: '', prixSupplementaire: '' });
      fetchDemandesEnAttente(); 
      alert("✅ Cotation transmise avec succès au passager !");
    } catch (err) {
      console.error("❌ Détail technique de l'erreur :", err);
      alert("Erreur lors du traitement de la cotation : " + err.message);
    }
  };

  // Sélection d'une demande et calcul initial basé sur le tarifKm actuel
  const selectionnerEtCalculerDemande = (demande) => {
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

  // Recalculateur global lors du changement de distance ou du tarif par km
  const recalculerPrixAutomatique = (nouvelleDistance, nouveauTarif) => {
    const dist = parseFloat(nouvelleDistance) || 0;
    const tarif = parseFloat(nouveauTarif) || 0;
    return Math.round(dist * tarif).toString();
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Navigation className="text-blue-500" /> Gestion des Ramassages VIP & Domicile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Analyse des positions GPS et ajustement dynamique des grilles tarifaires.
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
        
        {/* LISTE DES DEMANDES (GAUCHE) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Demandes en attente</h2>

          {loading && <div className="text-slate-500 p-4 bg-white dark:bg-slate-800 rounded-xl animate-pulse">Chargement...</div>}
          {error && <div className="text-rose-600 p-4 bg-rose-50 rounded-xl">{error}</div>}
          
          {!loading && demandes.length === 0 && (
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl text-center text-slate-400">
              Aucune demande de ramassage en attente pour le moment.
            </div>
          )}

          {demandes.map((demande) => (
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
          ))}
        </div>

        {/* PANNEL DE CONFIGURATION & COTATION (DROITE) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 h-fit shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="text-emerald-500" /> Outils de Calcul & Tarification
          </h2>

          {selectedDemande ? (
            <form onSubmit={handleActionCotation} className="space-y-4">
              
              {/* MINI CARTE INTERACTIVE */}
              <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative z-0 mb-3">
                <MapContainer center={[selectedDemande.latitudeClient, selectedDemande.longitudeClient]} zoom={14} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[selectedDemande.latitudeClient, selectedDemande.longitudeClient]}>
                    <Popup><span className="text-xs font-bold">📍 Position du client</span></Popup>
                  </Marker>
                  <RecenterMap lat={selectedDemande.latitudeClient} lng={selectedDemande.longitudeClient} />
                </MapContainer>
              </div>

              {/* REPÈRE DE L'AGENCE */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Point de repère Agence</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  value={formData.pointRepereAgence}
                  onChange={(e) => setFormData({...formData, pointRepereAgence: e.target.value})}
                />
              </div>

              {/* GRILLE À DEUX COLONNES : DISTANCE & TARIF PAR KM */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* BLOC DISTANCE */}
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

                {/* BLOC MODIFICATION PRIX PAR KM */}
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

              {/* PRIX FIXÉ POUR LE CLIENT */}
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
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  * Le montant total est ajustable manuellement avant l'envoi si nécessaire.
                </p>
              </div>

              {/* BOUTON DE TRANSMISSION */}
              <button 
                type="submit"
                className="w-full mt-2 bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-500 transition flex items-center justify-center gap-2 text-sm shadow cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" /> Transmettre le prix au client
              </button>
            </form>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Sélectionnez un ramassage à gauche pour ajuster le tarif kilométrique et configurer la course.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InterfaceCotationAgent;
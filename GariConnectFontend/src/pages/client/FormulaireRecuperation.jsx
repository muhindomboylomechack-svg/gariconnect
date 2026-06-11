import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { FaMapMarkerAlt, FaCrosshairs, FaCheckCircle, FaSpinner, FaPaperPlane } from 'react-icons/fa';
import L from 'leaflet';

// 🛠️ Correction du bug d'icône par défaut de Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🗺️ Sous-composant pour intercepter les clics sur la carte
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// 🔄 Sous-composant pour recentrer la carte en douceur
const MapRecenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
};

const FormulaireRecuperation = ({ onDataChange, reservationId }) => {
  const [adresseTextuelle, setAdresseTextuelle] = useState('');
  const [loadingGps, setLoadingGps] = useState(false);
  const [errorGps, setErrorGps] = useState(null);
  
  // 🔄 Nouveaux états pour la soumission au Backend
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Position par défaut (Goma : -1.658, 29.220)
  const [position, setPosition] = useState({ lat: -1.658, lng: 29.220 });

  // Géolocalisation automatique de l'appareil
  const selectionnerGpsAutomatique = () => {
    if (!navigator.geolocation) {
      setErrorGps("La géolocalisation n'est pas supportée par votre appareil.");
      return;
    }
    setLoadingGps(true);
    setErrorGps(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingGps(false);
      },
      (err) => {
        setErrorGps("Impossible de récupérer la position automatique. Déplacez le marqueur.");
        setLoadingGps(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  };

  // Transmission au composant Parent (si besoin)
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        voulaitRecuperation: true,
        reservationId: reservationId,
        latitudeClient: position.lat,
        longitudeClient: position.lng,
        adresseTextuelle: adresseTextuelle
      });
    }
  }, [position, adresseTextuelle, reservationId]);

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    if (marker != null) {
      const newPos = marker.getLatLng();
      setPosition({ lat: newPos.lat, lng: newPos.lng });
    }
  };

  // 🔥 FONCTION D'ENVOI AU BACKEND SPRING BOOT
  const handleSubmitDemande = async (e) => {
    e.preventDefault(); // Évite le rechargement de la page
    
    if (!adresseTextuelle.trim()) {
      setSubmitError("Veuillez préciser votre adresse textuelle (avenue, repère...).");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Récupération du token JWT stocké lors de la connexion de l'utilisateur
    const token = localStorage.getItem('token'); 

    const payload = {
      reservationId: reservationId,
      latitudeClient: position.lat,
      longitudeClient: position.lng,
      adresseTextuelle: adresseTextuelle
    };

    try {
      const response = await fetch('http://localhost:8080/api/recuperations/demande', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Requis par ton SecurityConfig/JwtFilter
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la soumission.");
      }

      const data = await response.json();
      setSubmitSuccess(true);
      console.log("Demande enregistrée avec succès :", data);
    } catch (error) {
      console.error("Erreur API :", error);
      setSubmitError(error.message || "Impossible de joindre le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitDemande} className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-2 sm:p-4 animate-in fade-in duration-300">
      
      {/* INFO BANNER */}
      <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 transition-colors duration-200">
        <FaMapMarkerAlt className="text-emerald-600 dark:text-emerald-400 text-lg mt-0.5 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          Nos chauffeurs partenaires viendront vous récupérer directement à l'emplacement indiqué ci-dessous. 
          <span className="font-bold text-emerald-600 dark:text-emerald-400 block sm:inline sm:ml-1">
            Les frais de ramassage seront calculés et ajoutés par l'agence.
          </span>
        </p>
      </div>

      {/* 1. GEOLOCATION BOX */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 transition-colors duration-200">
        <div className="text-left w-full sm:w-auto">
          <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">Géolocalisation automatique</p>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cliquez pour détecter instantanément votre position via votre appareil.</p>
        </div>
        
        <button
          type="button"
          onClick={selectionnerGpsAutomatique}
          disabled={loadingGps || isSubmitting}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/10 transition-all w-full sm:w-auto justify-center active:scale-95 select-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {loadingGps ? <FaSpinner className="animate-spin text-sm" /> : <FaCrosshairs className="text-sm" />}
          {loadingGps ? "Détection..." : "Me localiser"}
        </button>
      </div>

      {/* ERROR GPS ALERT */}
      {errorGps && (
        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-200 dark:border-red-900/30">
          ⚠️ {errorGps}
        </p>
      )}

      {/* 2. TEXT ADDRESS FIELD */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
          Précisions sur l'adresse (Avenue, Numéro, Point de repère)
        </label>
        <input 
          type="text"
          value={adresseTextuelle}
          onChange={(e) => setAdresseTextuelle(e.target.value)}
          placeholder="Ex: Q. Mabanga Sud, Av. du 20 Mai, No 12, En face de la boutique..."
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          required
          disabled={isSubmitting || submitSuccess}
        />
      </div>

      {/* 3. LEAFLET INTERACTIVE MAP */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 ml-1">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Ajustez votre repère sur la carte
          </label>
          <span className="self-start sm:self-auto text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black uppercase px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-500/10">
            <FaCheckCircle className="text-xs" /> Marqueur déplaçable
          </span>
        </div>
        
        <div className="h-64 sm:h-80 md:h-[380px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 z-10 shadow-md relative bg-slate-100 dark:bg-slate-950
          dark:[&_.leaflet-tile]:invert-[0.92] dark:[&_.leaflet-tile]:hue-rotate-180 dark:[&_.leaflet-tile]:brightness-[0.88] dark:[&_.leaflet-tile]:contrast-[0.95]">
          
          <MapContainer 
            center={[position.lat, position.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker 
              position={[position.lat, position.lng]}
              draggable={!isSubmitting && !submitSuccess}
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
            <MapClickHandler onMapClick={(lat, lng) => {!isSubmitting && !submitSuccess && setPosition({ lat, lng })}} />
            <MapRecenter lat={position.lat} lng={position.lng} />
          </MapContainer>
        </div>
        
        <div className="flex bg-slate-100/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 items-center justify-between">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic">
            📍 Coordonnées : <span className="font-mono font-bold not-italic text-slate-700 dark:text-slate-300 ml-1">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
          </p>
        </div>
      </div>

      {/* --- RETOURS API (ERREUR OU SUCCÈS) --- */}
      {submitError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-semibold text-sm rounded-xl border border-red-200 dark:border-red-900/30">
          ❌ {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm rounded-xl border border-emerald-200 dark:border-emerald-800/30 text-center">
          🎉 Votre demande de ramassage a bien été transmise ! L'agence va étudier l'itinéraire et fixer la cotation.
        </div>
      )}

      {/* --- 4. BOUTON DE SOUMISSION FINAL --- */}
      {!submitSuccess && (
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all disabled:opacity-50 active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="animate-spin text-base" />
              Envoi de la demande en cours...
            </>
          ) : (
            <>
              <FaPaperPlane className="text-xs" />
              Confirmer et Demander le ramassage
            </>
          )}
        </button>
      )}

    </form>
  );
};

export default FormulaireRecuperation;
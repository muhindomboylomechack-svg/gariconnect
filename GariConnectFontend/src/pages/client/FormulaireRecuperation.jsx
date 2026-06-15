import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { FaMapMarkerAlt, FaCrosshairs, FaSpinner } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 🛠️ Correction de l'icône par défaut de Leaflet sous React
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

// 🔄 Sous-composant pour recentrer la carte ET forcer le recalcul de la taille
const MapRecenter = ({ lat, lng }) => {
  const map = useMap();
  
  useEffect(() => {
    // 🔔 Force Leaflet à recalculer ses dimensions réelles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250); 
    
    map.setView([lat, lng], map.getZoom(), { animate: true });

    return () => clearTimeout(timer);
  }, [lat, lng, map]);
  
  return null;
};

// Composant de récupération de données de localisation (Purifié/Stupide)
const FormulaireRecuperation = ({ onDataChange }) => {
  const [adresseTextuelle, setAdresseTextuelle] = useState('');
  const [loadingGps, setLoadingGps] = useState(false);
  const [errorGps, setErrorGps] = useState(null);
  const [position, setPosition] = useState({ lat: -1.658, lng: 29.220 }); // Centre par défaut (Goma)

  // Vérification de la présence de la classe 'dark' sur le document HTML pour adapter la carte
  const [isDarkModeActive, setIsDarkModeActive] = useState(
    document.documentElement.classList.contains('dark') || localStorage.getItem('client-theme') === 'dark'
  );

  // Écouteur pour mettre à jour la carte si le thème change de façon dynamique
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkModeActive(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 📍 Détection GPS Native (HTML5)
  const selectionnerGpsAutomatique = () => {
    if (!navigator.geolocation) {
      setErrorGps("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setLoadingGps(true);
    setErrorGps(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;
        setPosition({ lat: currentLat, lng: currentLng });
        setLoadingGps(false);
        
        // Remonte les données au parent dès que la géolocalisation réussit
        if (onDataChange) {
          onDataChange({
            latitudeClient: currentLat,
            longitudeClient: currentLng,
            adresseTextuelle: adresseTextuelle
          });
        }
      },
      (err) => {
        setErrorGps("Veuillez autoriser la localisation ou déplacer le marqueur manuellement sur la carte.");
        setLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    if (marker != null) {
      const newPos = marker.getLatLng();
      setPosition({ lat: newPos.lat, lng: newPos.lng });
      
      // Remonte les données au parent dès qu'on lâche le marqueur
      if (onDataChange) {
        onDataChange({
          latitudeClient: newPos.lat,
          longitudeClient: newPos.lng,
          adresseTextuelle: adresseTextuelle
        });
      }
    }
  };

  // Remonte les données au parent lorsqu'on modifie l'adresse textuelle
  const handleAdresseChange = (e) => {
    const newValue = e.target.value;
    setAdresseTextuelle(newValue);
    if (onDataChange) {
      onDataChange({
        latitudeClient: position.lat,
        longitudeClient: position.lng,
        adresseTextuelle: newValue
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-1 sm:p-2">
      
      {/* ÉTAPE 1 : GPS - Alignement responsive automatique */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-emerald-50/40 dark:bg-slate-950/40 p-4 rounded-2xl border border-emerald-500/10 dark:border-slate-800">
        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 text-center sm:text-left">
          Ajustez votre marqueur sur la carte
        </span>
        <button
          type="button"
          onClick={selectionnerGpsAutomatique}
          disabled={loadingGps}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase rounded-xl transition-all disabled:opacity-50 shadow-sm active:scale-95"
        >
          {loadingGps ? <FaSpinner className="animate-spin text-sm" /> : <FaCrosshairs className="text-sm" />}
          <span>{loadingGps ? "Recherche..." : "Utiliser mon GPS"}</span>
        </button>
      </div>

      {errorGps && (
        <p className="text-[11px] font-medium text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 text-center leading-relaxed">
          {errorGps}
        </p>
      )}

      {/* CARTE LEAFLET RESPONSIVE & COMPATIBLE NIGHT MODE */}
      <div className="h-[220px] sm:h-[260px] w-full rounded-2xl overflow-hidden border-2 border-emerald-500/10 dark:border-slate-800 z-0 relative shadow-inner">
        <div className={`w-full h-full ${isDarkModeActive ? 'dark-leaflet-tiles' : ''}`}>
          <MapContainer 
            center={[position.lat, position.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={window.innerWidth > 640} // Désactive les boutons de zoom sur petit écran pour éviter les miss-clicks
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[position.lat, position.lng]} draggable={true} eventHandlers={{ dragend: handleMarkerDragEnd }} />
            <MapClickHandler onMapClick={(lat, lng) => { 
                setPosition({ lat, lng }); 
                if (onDataChange) {
                    onDataChange({ latitudeClient: lat, longitudeClient: lng, adresseTextuelle: adresseTextuelle });
                }
            }} />
            <MapRecenter lat={position.lat} lng={position.lng} />
          </MapContainer>
        </div>
      </div>

      {/* ÉTAPE 2 : ADRESSE MANUELLE */}
      <div className="flex flex-col gap-1.5 mt-1">
        <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-widest ml-1">
          Adresse détaillée / Repère *
        </label>
        <input 
          type="text"
          value={adresseTextuelle}
          onChange={handleAdresseChange}
          placeholder="Ex: Av. des Volcans, N° 45 (Près de l'Institut)"
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/5 outline-none transition-all text-sm font-semibold shadow-sm"
        />
      </div>

      {/* Style CSS injecté spécifiquement pour assombrir les tuiles OpenStreetMap en mode sombre */}
      <style>{`
        .dark-leaflet-tiles .leaflet-tile-container img {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) !important;
        }
        .dark-leaflet-tiles .leaflet-container {
          background: #020617 !important;
        }
      `}</style>

    </div>
  );
};

export default FormulaireRecuperation;
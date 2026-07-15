import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { FaMapMarkerAlt, FaCrosshairs, FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapRecenter = ({ lat, lng }) => {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250); 
    
    map.setView([lat, lng], map.getZoom() || 15, { animate: true });

    return () => clearTimeout(timer);
  }, [lat, lng, map]);
  
  return null;
};

const FormulaireRecuperation = ({ onDataChange }) => {
  const [adresseTextuelle, setAdresseTextuelle] = useState('');
  const [loadingGps, setLoadingGps] = useState(false);
  const [errorGps, setErrorGps] = useState(null);
  const [position, setPosition] = useState({ lat: -1.658, lng: 29.220 }); 
  const [isLocationExplicit, setIsLocationExplicit] = useState(false);

  const [isDarkModeActive, setIsDarkModeActive] = useState(
    document.documentElement.classList.contains('dark') || localStorage.getItem('client-theme') === 'dark'
  );

  // NOUVEAU : Utilisation de références (refs) pour synchroniser la donnée texte et GPS sans perte de données
  const adresseRef = useRef(adresseTextuelle);
  const positionRef = useRef(position);
  const explicitRef = useRef(isLocationExplicit);

  useEffect(() => { adresseRef.current = adresseTextuelle; }, [adresseTextuelle]);
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { explicitRef.current = isLocationExplicit; }, [isLocationExplicit]);

  // Fonction centralisée pour envoyer les données propres au parent 
  const notifierParent = (lat, lng, explicit, text) => {
    if (onDataChange) {
      onDataChange({
        latitudeClient: explicit ? lat : 0.0,
        longitudeClient: explicit ? lng : 0.0,
        adresseTextuelle: text
      });
    }
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkModeActive(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    selectionnerGpsAutomatique(true);

    return () => observer.disconnect();
  }, []);

  const selectionnerGpsAutomatique = (isAutoLoad = false) => {
    if (!navigator.geolocation) {
      if (!isAutoLoad) setErrorGps("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setLoadingGps(true);
    setErrorGps(null);

    // NOUVEAU : Forcer la haute précision pour avoir l'emplacement exact
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;
        
        setPosition({ lat: currentLat, lng: currentLng });
        setIsLocationExplicit(true); 
        setLoadingGps(false);
        
        // Envoi au parent avec l'adresse textuelle courante (ne l'efface plus)
        notifierParent(currentLat, currentLng, true, adresseRef.current);
      },
      (err) => {
        setLoadingGps(false);
        if (!isAutoLoad) {
          setErrorGps("Permission refusée ou signal GPS faible. Ajustez manuellement le marqueur bleu.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    if (marker != null) {
      const newPos = marker.getLatLng();
      setPosition({ lat: newPos.lat, lng: newPos.lng });
      setIsLocationExplicit(true);
      
      notifierParent(newPos.lat, newPos.lng, true, adresseRef.current);
    }
  };

  const handleAdresseChange = (e) => {
    const newValue = e.target.value;
    setAdresseTextuelle(newValue);
    
    // Garde en mémoire la géolocalisation exacte tout en tapant le lieu de récupération
    notifierParent(positionRef.current.lat, positionRef.current.lng, explicitRef.current, newValue);
  };

  return (
    <div className="w-full flex flex-col gap-4 p-1 sm:p-2">
      
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-emerald-50/40 dark:bg-slate-950/40 p-4 rounded-2xl border border-emerald-500/10 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {isLocationExplicit ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <FaCheckCircle className="text-sm shrink-0" />
              <span>Emplacement de ramassage configuré par carte/GPS</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-500">
              <FaExclamationTriangle className="text-sm shrink-0 animate-pulse" />
              <span>Le chauffeur se guidera uniquement via votre adresse écrite</span>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => selectionnerGpsAutomatique(false)}
          disabled={loadingGps}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase rounded-xl transition-all disabled:opacity-50 shadow-sm active:scale-95"
        >
          {loadingGps ? <FaSpinner className="animate-spin text-sm" /> : <FaCrosshairs className="text-sm" />}
          <span>{loadingGps ? "Recherche..." : "Utiliser mon GPS"}</span>
        </button>
      </div>

      {errorGps && (
        <p className="text-[11px] font-medium text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 text-center">
          {errorGps}
        </p>
      )}

      <div className="h-[220px] sm:h-[260px] w-full rounded-2xl overflow-hidden border-2 border-emerald-500/10 dark:border-slate-800 z-0 relative shadow-inner">
        <div className={`w-full h-full ${isDarkModeActive ? 'dark-leaflet-tiles' : ''}`}>
          <MapContainer 
            center={[position.lat, position.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={window.innerWidth > 640}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <Marker 
              position={[position.lat, position.lng]} 
              draggable={true} 
              eventHandlers={{ dragend: handleMarkerDragEnd }} 
            />
            
            <MapClickHandler onMapClick={(lat, lng) => { 
                setPosition({ lat, lng }); 
                setIsLocationExplicit(true);
                notifierParent(lat, lng, true, adresseRef.current);
            }} />
            
            <MapRecenter lat={position.lat} lng={position.lng} />
          </MapContainer>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-1">
        <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-widest ml-1">
          Adresse détaillée / Repère *
        </label>
        <input 
          type="text"
          required
          value={adresseTextuelle}
          onChange={handleAdresseChange}
          placeholder="Ex: Av. des Volcans, N° 45 (Près de l'Institut)"
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm font-semibold shadow-sm"
        />
      </div>

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
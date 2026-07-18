import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { FaCrosshairs, FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Icône par défaut pour le point de RAMASSAGE (Déplaçable)
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Icône pour la POSITION PHYSIQUE EXACTE du client (Point bleu pulsant)
const clientExactIcon = new L.DivIcon({
  html: `<div style="position:relative; display:flex; justify-content:center; align-items:center; width:24px; height:24px;">
          <span style="position:absolute; background-color:#3b82f6; width:100%; height:100%; border-radius:50%; opacity:0.5; animation: pulse 1.5s infinite;"></span>
          <span style="background-color:#1d4ed8; width:12px; height:12px; display:block; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4); z-index:2;"></span>
         </div>
         <style>
           @keyframes pulse {
             0% { transform: scale(1); opacity: 0.7; }
             100% { transform: scale(2.5); opacity: 0; }
           }
         </style>`,
  className: 'custom-live-client-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

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
  
  // Position du point de ramassage (Coordonnées par défaut ajustées)
  const [positionRamassage, setPositionRamassage] = useState({ lat: 0.4936, lng: 29.4697 }); 
  // Vraie position GPS en direct du téléphone
  const [deviceLocation, setDeviceLocation] = useState(null);
  
  const [isLocationExplicit, setIsLocationExplicit] = useState(false);
  const [isDarkModeActive, setIsDarkModeActive] = useState(
    document.documentElement.classList.contains('dark') || localStorage.getItem('client-theme') === 'dark'
  );

  const adresseRef = useRef(adresseTextuelle);
  const positionRef = useRef(positionRamassage);
  const explicitRef = useRef(isLocationExplicit);

  useEffect(() => { adresseRef.current = adresseTextuelle; }, [adresseTextuelle]);
  useEffect(() => { positionRef.current = positionRamassage; }, [positionRamassage]);
  useEffect(() => { explicitRef.current = isLocationExplicit; }, [isLocationExplicit]);

  const notifierParent = (lat, lng, explicit, text) => {
    if (onDataChange) {
      onDataChange({
        latitudeClient: explicit ? lat : 0.0,
        longitudeClient: explicit ? lng : 0.0,
        adresseTextuelle: text
      });
    }
  };

  // Suivi continu de la position exacte du client
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setDeviceLocation({ lat, lng });
        },
        (err) => console.warn("Suivi GPS indisponible :", err),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkModeActive(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    selectionnerGpsAutomatique(true);

    return () => observer.disconnect();
  }, []);

  const selectionnerGpsAutomatique = (isAutoLoad = false) => {
    setLoadingGps(true);
    setErrorGps(null);

    // Si on a déjà traqué l'appareil, on l'utilise immédiatement
    if (deviceLocation) {
        setPositionRamassage(deviceLocation);
        setIsLocationExplicit(true);
        setLoadingGps(false);
        notifierParent(deviceLocation.lat, deviceLocation.lng, true, adresseRef.current);
        return;
    }

    if (!navigator.geolocation) {
      if (!isAutoLoad) setErrorGps("La géolocalisation n'est pas supportée par votre navigateur.");
      setLoadingGps(false);
      return;
    }

    // Fallback si le watchPosition n'a pas encore répondu
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;
        
        setPositionRamassage({ lat: currentLat, lng: currentLng });
        setDeviceLocation({ lat: currentLat, lng: currentLng });
        setIsLocationExplicit(true); 
        setLoadingGps(false);
        
        notifierParent(currentLat, currentLng, true, adresseRef.current);
      },
      (err) => {
        setLoadingGps(false);
        if (!isAutoLoad) {
          setErrorGps("Signal GPS faible. Déplacez manuellement le marqueur bleu à votre position.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    if (marker != null) {
      const newPos = marker.getLatLng();
      setPositionRamassage({ lat: newPos.lat, lng: newPos.lng });
      setIsLocationExplicit(true);
      
      notifierParent(newPos.lat, newPos.lng, true, adresseRef.current);
    }
  };

  const handleAdresseChange = (e) => {
    const newValue = e.target.value;
    setAdresseTextuelle(newValue);
    notifierParent(positionRef.current.lat, positionRef.current.lng, explicitRef.current, newValue);
  };

  return (
    <div className="w-full flex flex-col gap-4 p-1 sm:p-2">
      
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-emerald-50/40 dark:bg-slate-950/40 p-4 rounded-2xl border border-emerald-500/10 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {isLocationExplicit ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <FaCheckCircle className="text-sm shrink-0" />
              <span>Lieu de ramassage validé sur la carte</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-500">
              <FaExclamationTriangle className="text-sm shrink-0 animate-pulse" />
              <span>Adresse imprécise, déplacez le marqueur</span>
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
          <span>{loadingGps ? "Recherche..." : "Me localiser"}</span>
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
            center={[positionRamassage.lat, positionRamassage.lng]} 
            zoom={16} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={window.innerWidth > 640}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* VRAIE POSITION DU CLIENT (Point bleu qui traque le téléphone) */}
            {deviceLocation && (
              <Marker position={[deviceLocation.lat, deviceLocation.lng]} icon={clientExactIcon}>
                <Popup className="text-xs font-bold">Votre position physique actuelle</Popup>
              </Marker>
            )}

            {/* MARQUEUR DE RAMASSAGE (Déplaçable par le client) */}
            <Marker 
              position={[positionRamassage.lat, positionRamassage.lng]} 
              draggable={true} 
              eventHandlers={{ dragend: handleMarkerDragEnd }} 
            >
              <Popup className="text-xs font-bold">Point de ramassage désiré</Popup>
            </Marker>
            
            <MapClickHandler onMapClick={(lat, lng) => { 
                setPositionRamassage({ lat, lng }); 
                setIsLocationExplicit(true);
                notifierParent(lat, lng, true, adresseRef.current);
            }} />
            
            <MapRecenter lat={positionRamassage.lat} lng={positionRamassage.lng} />
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
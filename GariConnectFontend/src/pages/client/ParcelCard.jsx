import React from 'react';
import { FaBox, FaMapMarkerAlt, FaTruckLoading, FaCheckCircle, FaChevronRight } from 'react-icons/fa';

const ParcelCard = ({ parcel, darkMode }) => {
  // Les étapes possibles du colis
  const steps = [
    { label: 'Déposé', icon: <FaBox />, status: 'DEPOT' },
    { label: 'En transit', icon: <FaTruckLoading />, status: 'TRANSIT' },
    { label: 'Arrivé', icon: <FaCheckCircle />, status: 'LIVRE' }
  ];

  // Calcul de l'index actuel pour la barre de progression
  const currentStepIndex = steps.findIndex(s => s.status === parcel.statut);

  return (
    <div className={`p-6 rounded-[2.5rem] border transition-all ${
      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
    }`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
            <FaBox size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N° de suivi</p>
            <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{parcel.reference}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase">Destinataire</p>
          <p className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{parcel.nomDestinataire}</p>
        </div>
      </div>

      {/* --- BARRE DE PROGRESSION --- */}
      <div className="relative flex justify-between items-center mb-8 px-2">
        {/* Ligne de fond */}
        <div className={`absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 ${
          darkMode ? 'bg-slate-800' : 'bg-slate-100'
        } rounded-full`}></div>
        
        {/* Ligne active */}
        <div 
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-blue-600 rounded-full transition-all duration-1000"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {/* Étapes (Cercles) */}
        {steps.map((step, index) => (
          <div key={index} className="relative z-10 flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
              index <= currentStepIndex 
                ? 'bg-blue-600 border-white text-white shadow-lg shadow-blue-500/30' 
                : (darkMode ? 'bg-slate-800 border-slate-900 text-slate-600' : 'bg-white border-slate-50 text-slate-300')
            }`}>
              {React.cloneElement(step.icon, { size: 12 })}
            </div>
            <span className={`absolute -bottom-6 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ${
              index <= currentStepIndex 
                ? (darkMode ? 'text-blue-400' : 'text-blue-600') 
                : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Itinéraire du colis */}
      <div className={`mt-10 p-4 rounded-2xl flex justify-between items-center ${
        darkMode ? 'bg-slate-950/50' : 'bg-slate-50'
      }`}>
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-slate-400 text-xs" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">{parcel.villeDepart}</span>
        </div>
        <FaChevronRight className="text-[10px] text-blue-500" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">{parcel.villeDestination}</span>
          <FaMapMarkerAlt className="text-blue-600 text-xs" />
        </div>
      </div>
    </div>
  );
};

export default ParcelCard;
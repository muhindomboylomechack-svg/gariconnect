import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ListeRamassage = () => {
  const navigate = useNavigate();

  // État local avec les 4 clients attendus à l'arrêt actuel
  const [clients, setClients] = useState([
    { id: 1, nom: "Mpemba Kabedi Jeanne", siege: "Place 04", embarque: false },
    { id: 2, nom: "Ilunga Mukendi Dieudonné", siege: "Place 07", embarque: false },
    { id: 3, nom: "Kavira Kasoki Grâce", siege: "Place 12", embarque: false },
    { id: 4, nom: "Bakari Amisi Justin", siege: "Place 01", embarque: false }
  ]);

  // Fonction pour valider la montée à bord d'un passager
  const handleEmbarquer = (id) => {
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === id ? { ...client, embarque: true } : client
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-4 font-sans selection:bg-indigo-500">
      
      {/* Header avec bouton Retour */}
      <div className="flex items-center justify-between mb-6 bg-slate-800 rounded-2xl p-4 border border-slate-700/50 shadow-lg">
        <button 
          onClick={() => navigate('/chauffeur/course-actuelle')}
          className="p-2 -ml-2 rounded-xl bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-right">
          <h1 className="text-lg font-bold text-slate-100">Pick-up List</h1>
          <p className="text-xs text-indigo-400 font-semibold uppercase">Arrêt Royal</p>
        </div>
      </div>

      {/* Liste des passagers (Taillé pour interaction tactile rapide) */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-6">
        {clients.map((client) => (
          <div 
            key={client.id}
            className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
              client.embarque 
                ? 'bg-slate-800/40 border-emerald-500/30 opacity-60' 
                : 'bg-slate-800 border-slate-700/70 shadow-md shadow-black/10'
            }`}
          >
            {/* Infos Passager */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-slate-100 truncate">{client.nom}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs font-semibold rounded-md">
                  {client.siege}
                </span>
                {client.embarque && (
                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                    ✓ À bord
                  </span>
                )}
              </div>
            </div>

            {/* Bouton d'action */}
            <div>
              {client.embarque ? (
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <button
                  onClick={() => handleEmbarquer(client.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white text-sm font-bold h-12 px-5 rounded-xl shadow-lg shadow-emerald-600/20 whitespace-nowrap"
                >
                  Embarquer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Résumé de fin de liste */}
      <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-4 border border-slate-700/50 text-center text-sm text-slate-400">
        Embarqués : {clients.filter(c => c.embarque).length} / {clients.length} passagers
      </div>

    </div>
  );
};

export default ListeRamassage;
import React from 'react';
import { useNavigate } from 'react-router-dom';

const CourseActuelle = () => {
  const navigate = useNavigate();

  // Données simulées correspondant exactement à la maquette
  const infosCourse = {
    prochainArret: "Arrêt Royal",
    distance: "1.2 km",
    passagersCount: 4
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 font-sans selection:bg-emerald-500">
      
      {/* Header Statut */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 shadow-lg text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Course en cours
        </span>
        <h1 className="text-xl font-bold mt-2 text-slate-100">GariConnect Chauffeur</h1>
      </div>

      {/* Main Content - Navigation Focus (Ultra-simplifiée pour tableau de bord) */}
      <div className="my-auto py-8 flex flex-col items-center text-center gap-6">
        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center border-2 border-indigo-500/30 shadow-indigo-500/5 shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-slate-400 text-lg uppercase tracking-wide font-medium">Prochain arrêt</p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">{infosCourse.prochainArret}</h2>
          <p className="text-emerald-400 text-2xl font-bold mt-1">Dans {infosCourse.distance}</p>
        </div>

        {/* Badge indicateur du nombre de clients */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl px-6 py-4 w-full max-w-sm shadow-xl">
          <p className="text-slate-300 text-base">
            Nombre de clients à récupérer : <span className="text-indigo-400 font-black text-2xl block mt-1">{infosCourse.passagersCount} passagers</span>
          </p>
        </div>
      </div>

      {/* Action CTA - Accès Liste de ramassage */}
      <div className="w-full pb-4">
        <button
          onClick={() => navigate('/chauffeur/liste-ramassage')}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all text-white font-bold py-5 px-6 rounded-2xl text-xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/30"
        >
          <span>Voir la liste de ramassage</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

    </div>
  );
};

export default CourseActuelle;
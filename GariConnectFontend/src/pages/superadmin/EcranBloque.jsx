import React from 'react';
import { FaBan, FaHeadset, FaSignOutAlt } from 'react-icons/fa';

const EcranBloque = () => {
  const handleLogout = () => {
    localStorage.clear(); // Vide le token et les infos de session
    window.location.href = '/login'; // Redirection stricte
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
      {/* Effet d'arrière-plan lumineux diffus */}
      <div className="absolute w-96 h-96 bg-rose-600/10 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse"></div>

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl text-center space-y-6">
        
        {/* Icône d'alerte animée */}
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 animate-bounce">
          <FaBan size={36} />
        </div>

        {/* Messages */}
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">
            Accès Interdit / Compte Bloqué
          </h2>
          <p className="text-slate-400 text-xs font-medium leading-relaxed">
            Votre compte a été temporairement ou définitivement suspendu par le <span className="text-blue-400 font-bold">Super Admin</span> de la plateforme.
          </p>
        </div>

        {/* Encadré d'instruction */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl text-left text-xs text-slate-400 space-y-2">
          <p className="flex items-start gap-2">
            <span className="text-rose-500 font-bold">•</span>
            <span>Vous ne pouvez plus effectuer de réservations ni gérer vos services.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-rose-500 font-bold">•</span>
            <span>Prière de contacter le support technique ou la direction générale pour régulariser votre situation.</span>
          </p>
        </div>

        {/* Actions de secours */}
        <div className="flex flex-col gap-2 pt-2">
          <a 
            href="mailto:support@gariconnect.com" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg"
          >
            <FaHeadset size={12} /> Contacter le Super Admin
          </a>
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider border border-slate-800 transition-all"
          >
            <FaSignOutAlt size={12} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default EcranBloque;
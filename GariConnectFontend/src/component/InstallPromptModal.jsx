import React, { useState, useEffect } from 'react';
import { FaBus, FaDownload, FaTimes } from 'react-icons/fa';

const InstallPromptModal = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Écoute l'événement natif du navigateur
    const handleBeforeInstallPrompt = (e) => {
      // Empêche le navigateur d'afficher sa propre petite bannière tout de suite
      e.preventDefault();
      // Sauvegarde l'événement pour le déclencher plus tard
      setDeferredPrompt(e);
      // Affiche notre modale personnalisée
      setShowModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Déclenche l'invite d'installation native du navigateur
    deferredPrompt.prompt();

    // Attend que l'utilisateur réponde à l'invite native (Installer ou Annuler)
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('L\'utilisateur a accepté l\'installation de GariConnect');
    } else {
      console.log('L\'utilisateur a refusé l\'installation');
    }

    // On réinitialise l'état et on ferme la modale
    setDeferredPrompt(null);
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl relative border border-slate-100 dark:border-slate-800">
        
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
        >
          <FaTimes />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <FaBus className="text-white text-3xl" />
          </div>
          
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Installer GariConnect
          </h3>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium px-4">
            Installez l'application sur votre appareil pour un accès plus rapide, une meilleure fluidité et une gestion optimale de votre flotte au quotidien.
          </p>

          <div className="w-full pt-4 flex gap-3">
            <button 
              onClick={handleClose}
              className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Plus tard
            </button>
            <button 
              onClick={handleInstallClick}
              className="flex-1 py-3.5 px-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <FaDownload /> Installer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPromptModal;import React, { useState } from 'react';
import { FaBus, FaDownload, FaTimes } from 'react-icons/fa';

// 🟢 Reçoit l'événement et la fonction pour le vider depuis App.jsx
const InstallPromptModal = ({ deferredPrompt, setDeferredPrompt }) => {
  const [showModal, setShowModal] = useState(true);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Déclenche l'invite d'installation native du navigateur
    deferredPrompt.prompt();

    // Attend que l'utilisateur réponde à l'invite native (Installer ou Annuler)
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('L\'utilisateur a accepté l\'installation de GariConnect');
    } else {
      console.log('L\'utilisateur a refusé l\'installation');
    }

    // On réinitialise l'état global et on ferme la modale
    setDeferredPrompt(null);
    setShowModal(false);
  };

  const handleClose = () => {
    // Si l'utilisateur clique sur "Plus tard", on cache juste la modale
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl relative border border-slate-100 dark:border-slate-800">
        
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
        >
          <FaTimes />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <FaBus className="text-white text-3xl" />
          </div>
          
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Installer GariConnect
          </h3>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium px-4">
            Installez l'application sur votre appareil pour un accès plus rapide, une meilleure fluidité et une gestion optimale de votre flotte au quotidien.
          </p>

          <div className="w-full pt-4 flex gap-3">
            <button 
              onClick={handleClose}
              className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Plus tard
            </button>
            <button 
              onClick={handleInstallClick}
              className="flex-1 py-3.5 px-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <FaDownload /> Installer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPromptModal;
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// ✅ Import propre depuis "component" sans "s"
import Navbar from '../pages/client/Navbar'; 

// 📦 Importation de l'Espace Expéditions / Gestion des colis du Client
import ClientCourrierHub from '../pages/client/ClientCourrierHub'; 

import { FaBus, FaTimes, FaStar } from 'react-icons/fa';
import api from '../services/api';
import FormulaireEvaluation from '../pages/client/FormulaireEvaluation';
import { useTranslation } from 'react-i18next';

const Layout = () => {
    const { t } = useTranslation();
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [voyageEnCours, setVoyageEnCours] = useState(null);
    const [showFullForm, setShowFullForm] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [submissionCount, setSubmissionCount] = useState(0);
    
    // 💡 État optionnel si ta Navbar pilote l'affichage par état plutôt que par URL de routage
    const [showColisHub, setShowColisHub] = useState(false);

    // 🟢 Écouteur global pour synchroniser le thème en temps réel s'il change depuis le profil
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'theme') {
                setDarkMode(event.newValue === 'dark');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const verifierStatutEvaluation = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("Aucun token trouvé. Attente de l'authentification...");
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const response = await api.get('/reservations/mon-voyage-actif', config);
            
            if (response.status === 200 && response.data) {
                setVoyageEnCours(response.data);
                
                if (response.data.id) {
                    const countRes = await api.get(`/evaluations/count/${response.data.id}`, config);
                    setSubmissionCount(countRes.data.count || 0);
                }
            } else {
                setVoyageEnCours(null);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du voyage actif :", error);
            setVoyageEnCours(null);
        }
    };

    useEffect(() => {
        verifierStatutEvaluation();
    }, []);

    const canShowBanner = voyageEnCours && !isDismissed && submissionCount < 3;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">
            {/* 🟢 Ajout d'une prop de callback au cas où ton bouton Colis est dans la Navbar et requiert un toggle d'état */}
            <Navbar 
                darkMode={darkMode} 
                setDarkMode={setDarkMode} 
                onColisClick={() => setShowColisHub(true)} 
                onHomeClick={() => setShowColisHub(false)}
            />
            
            <main className="container mx-auto px-4 pt-24 pb-10">
                
                {canShowBanner && !showFullForm && (
                    /* ✅ PROTECTION CONTRE LA TRANSPARENCE ICI 
                       En mode clair : Fond blanc solide (bg-white), bordure fine (border-slate-200), texte sombre.
                       En mode sombre : Fond ardoise foncé solide (dark:bg-slate-900), pas de transparence. */
                    <div className="mb-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 relative animate-in slide-in-from-top duration-700">
                        
                        {/* Bouton de fermeture adapté au mode clair/sombre */}
                        <button 
                            onClick={() => setIsDismissed(true)} 
                            className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
                            aria-label="Dismiss banner"
                        >
                            <FaTimes size={14} />
                        </button>

                        {/* Section Infos */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Rond de l'icône opaque */}
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <FaBus size={20} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="pr-6">
                                <h4 className="font-black uppercase text-[10px] tracking-widest text-indigo-600 dark:text-indigo-400">
                                    {voyageEnCours?.statut === 'TERMINE' ? t('eval_post_trip', "Évaluation après voyage") : t('eval_ongoing_trip', "Voyage en cours")}
                                </h4>
                                <p className="font-bold text-sm mt-0.5 text-slate-700 dark:text-slate-200 leading-relaxed">
                                    {t('eval_prompt', { destination: voyageEnCours?.trajet?.destination || 'votre destination' })} ({submissionCount}/3)
                                </p>
                            </div>
                        </div>

                        {/* Bouton Évaluer adapté en couleur pour aller avec le fond blanc solide */}
                        <button 
                            onClick={() => setShowFullForm(true)}
                            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-6 py-3.5 md:py-3 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 transition-all active:scale-[0.98] md:active:scale-95 flex-shrink-0"
                        >
                            <FaStar className="text-yellow-400" /> {t('eval_button', "Évaluer")}
                        </button>
                    </div>
                )}

                {/* Modal Formulaire d'Évaluation */}
                {showFullForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="w-full max-w-xl relative">
                            <button onClick={() => setShowFullForm(false)} className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold uppercase text-xs hover:text-red-400 transition-colors">
                                <FaTimes /> {t('close', "Fermer")}
                            </button>
                            
                            <FormulaireEvaluation 
                                reservationId={voyageEnCours?.id} 
                                onSubmited={() => {
                                    setShowFullForm(false);
                                    verifierStatutEvaluation();
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* 🔀 Affichage conditionnel : Si le module Colis est actif, on l'affiche, sinon on laisse passer les enfants des routes classiques via <Outlet /> */}
                <div className="animate-in fade-in duration-700">
                    {showColisHub ? (
                        <ClientCourrierHub />
                    ) : (
                        <Outlet />
                    )}
                </div>
            </main>

            <footer className="py-8 border-t border-slate-200 dark:border-slate-900 text-center text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors">
                © 2026 GariConnect • {t('intel_title', "Tous droits réservés")} • Beni, RDC
            </footer>
        </div>
    );
};

export default Layout;
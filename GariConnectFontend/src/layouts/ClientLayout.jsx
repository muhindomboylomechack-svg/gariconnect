import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// ✅ Import propre depuis "component" sans "s"
import Navbar from '../pages/client/Navbar'; 

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
        // ✅ CORRECTION : Éviter l'appel si aucun token n'est disponible pour éviter l'erreur 400 / 403
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("Aucun token trouvé. Attente de l'authentification...");
            return;
        }

        try {
            // Configuration explicite des headers pour garantir que le token passe bien
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
                // Si le serveur répond avec un code 204 (No Content), vider l'état
                setVoyageEnCours(null);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du voyage actif (Erreur 400/403) :", error);
            setVoyageEnCours(null);
        }
    };

    useEffect(() => {
        verifierStatutEvaluation();
        // Optionnel : Ré-exécuter la vérification si l'utilisateur vient de se connecter
        // ou si le token change dans le localStorage
    }, []);

    const canShowBanner = voyageEnCours && !isDismissed && submissionCount < 3;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {/* Navbar reçoit les props pour le thème */}
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
            
            <main className="container mx-auto px-4 pt-24 pb-10">
                
                {canShowBanner && !showFullForm && (
                    <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-1 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-700">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-[14px] flex flex-col md:flex-row items-center justify-between gap-4 relative">
                            <button onClick={() => setIsDismissed(true)} className="absolute top-2 right-2 p-2 hover:bg-white/20 rounded-full transition-colors">
                                <FaTimes size={14} />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                                    <FaBus size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase text-[10px] tracking-widest opacity-80">
                                        {voyageEnCours?.statut === 'TERMINE' ? t('eval_post_trip') : t('eval_ongoing_trip')}
                                    </h4>
                                    <p className="font-bold text-sm">
                                        {t('eval_prompt', { destination: voyageEnCours?.trajet?.destination || 'votre destination' })} ({submissionCount}/3)
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowFullForm(true)}
                                className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-6 py-3 rounded-xl font-black text-sm uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                            >
                                <FaStar /> {t('eval_button')}
                            </button>
                        </div>
                    </div>
                )}

                {showFullForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="w-full max-w-xl relative">
                            <button onClick={() => setShowFullForm(false)} className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold uppercase text-xs hover:text-red-400 transition-colors">
                                <FaTimes /> {t('close')}
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

                <div className="animate-in fade-in duration-700">
                    <Outlet />
                </div>
            </main>

            <footer className="py-8 border-t border-slate-200 dark:border-slate-900 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                © 2026 GariConnect • {t('intel_title')} • Beni, RDC
            </footer>
        </div>
    );
};

export default Layout;
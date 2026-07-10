import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBus, FaArrowLeft, FaTicketAlt, FaInbox } from 'react-icons/fa';
import api from '../../services/api'; 
import TicketCard from './TicketCard';

const MesTickets = () => {
    const { t } = useTranslation();
    const [mesReservations, setMesReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('TOUS'); // TOUS, CONFIRME, ATTENTE

    useEffect(() => {
        let isMounted = true;

        const fetchMyTickets = async () => {
            try {
                const response = await api.get('/reservations/mes-reservations');
                if (isMounted) {
                    setMesReservations(response.data || []);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération:", err);
                if (isMounted) {
                    setError(t('checkout.error_load') || "Impossible de charger les billets.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchMyTickets();

        return () => {
            isMounted = false;
        };
    }, [t]);

    // 🟢 Filtrage basé sur les VRAIS statuts du backend
    const filteredReservations = mesReservations.filter((res) => {
        if (activeFilter === 'TOUS') return true;
        if (activeFilter === 'CONFIRME') {
            return res.statut === 'PAYE' || res.statut === 'CONFIRMEE' || res.statut === 'EMBARQUE' || res.statut === 'VALIDE';
        }
        if (activeFilter === 'ATTENTE') {
            return res.statut === 'EN_ATTENTE_DE_PAIEMENT' || res.statut === 'ATTENTE_PAIEMENT' || res.statut === 'ATTENTE_PAIEMENT_SURPLUS';
        }
        return true;
    });
    
    // Écran de chargement
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
                <div className="relative flex items-center justify-center">
                    <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 border-t-transparent"></div>
                    <FaBus className="absolute text-blue-600 text-xl animate-pulse" />
                </div>
                <p className="mt-6 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                    Chargement de vos billets...
                </p>
            </div>
        );
    }

    // Écran d'erreur ou liste vide
    if (error || mesReservations.length === 0) {
        return (
            <div className="max-w-md mx-auto py-16 px-4 text-center sm:py-24">
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-100 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="bg-blue-50 dark:bg-blue-950/40 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-blue-500 mb-6">
                        <FaTicketAlt className="text-3xl" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
                        {error ? t('checkout.error_load') : "Aucun voyage prévu ?"}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm font-medium leading-relaxed">
                        {error 
                            ? "Une erreur est survenue lors de la récupération de vos données."
                            : "Vos réservations et tickets confirmés apparaîtront ici pour faciliter votre embarquement."
                        }
                    </p>
                    <Link 
                        to="/client/dashboard" 
                        className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-blue-600/20"
                    >
                        Réserver un billet
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-20 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header de la page */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
                <div>
                    <Link 
                        to="/client/dashboard" 
                        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase text-[11px] tracking-widest mb-3 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                        <FaArrowLeft className="text-xs" /> {t('back') || "Retour"}
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Mes Billets<span className="text-blue-600">.</span>
                    </h1>
                </div>
                
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors self-start sm:self-center">
                    <div>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest leading-none mb-1">Total Voyages</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white">{mesReservations.length}</p>
                    </div>
                </div>
            </div>

            {/* Système de Filtres */}
            <div className="flex overflow-x-auto pb-3 mb-6 gap-2 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
                {[
                    { id: 'TOUS', label: 'Tous les billets' },
                    { id: 'CONFIRME', label: 'Confirmés' },
                    { id: 'ATTENTE', label: 'En attente' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id)}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider whitespace-nowrap snap-center transition-all duration-300 ${
                            activeFilter === tab.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/80'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grille de tickets */}
            {filteredReservations.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center transition-colors">
                    <FaInbox className="text-slate-300 dark:text-slate-700 text-4xl mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                        Aucun billet ne correspond à ce filtre.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5">
                    {filteredReservations.map((res, index) => {
                        
                        // 🟢 EXTRACTION ET FORMATAGE DE LA DATE ET HEURE
                        let dateDepart = "--/--/--";
                        let heureDepart = "--:--";
                        if (res.trajet?.dateHeureDepart) {
                            const dateObj = new Date(res.trajet.dateHeureDepart);
                            dateDepart = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            heureDepart = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        }

                        // 🟢 AFFICHAGE DU NOMBRE DE PLACES ET SIÈGE
                        const nbPlaces = res.nombrePlaces || 1;
                        const placeLabel = nbPlaces > 1 ? "Places" : "Place";
                        const siegeAssigne = res.numeroSiege ? `(Siège N°${res.numeroSiege})` : "(Libre)";
                        const infoSieges = `${nbPlaces} ${placeLabel} ${siegeAssigne}`;

                        // 🟢 CALCUL DU PRIX (Prend en charge l'alias Jackson montant_total ou un calcul manuel)
                        const surplusRamassage = res.demande_recuperation?.prixSupplementaire || 0;
                        const prixBase = (res.montantPaye || res.trajet?.prix || 0) * nbPlaces;
                        const prixTotalAffichage = res.montant_total || res.montantTotal || (prixBase + surplusRamassage);

                        return (
                            <div 
                                key={res.id} 
                                className="animate-in fade-in zoom-in-95 duration-300" 
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <TicketCard 
                                    ticket={{
                                        depart: res.trajet?.depart || "N/A",
                                        destination: res.trajet?.destination || "N/A",
                                        date: dateDepart,
                                        heure: heureDepart,
                                        siege: infoSieges,
                                        code: res.codeTicket || "EN ATTENTE", 
                                        prix: prixTotalAffichage,
                                        statut: res.statut || 'EN_ATTENTE_DE_PAIEMENT', // Utilisation du vrai champ Backend
                                        nomPassager: res.client?.nom || res.user?.nom || "Voyageur",
                                        agence: res.trajet?.agence?.nom || "Agence Partenaire",
                                        typeReservation: res.typeReservation || "STANDARD",
                                        surplusRamassage: surplusRamassage // Optionnel, si TicketCard gère le VIP
                                    }} 
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-center mt-12 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-4 leading-relaxed">
                Présentez votre QR Code ou votre code de ticket unique à l'embarquement
            </p>
        </div>
    );
};

export default MesTickets;
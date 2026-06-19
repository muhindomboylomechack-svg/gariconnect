import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaCalendarAlt, 
    FaMapMarkerAlt, 
    FaCreditCard, 
    FaCheckCircle, 
    FaClock, 
    FaCar, 
    FaArrowRight, 
    FaSearch, 
    FaExclamationCircle 
} from 'react-icons/fa';

// 🌐 Import de l'instance API centralisée
import api from '../../services/api';

const HistoriqueReservations = () => {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [filter, setFilter] = useState('TOUTES'); // TOUTES, ATTENTE_PAIEMENT, RAMASSAGE
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        const chargerHistorique = async () => {
            setIsLoading(true);
            setErrorMsg(null);
            try {
                // 🔐 Vérification locale du jeton d'authentification utilisateur
                const token = localStorage.getItem('token'); 
                
                if (!token) {
                    setErrorMsg("Vous devez être connecté pour voir votre historique.");
                    setIsLoading(false);
                    return;
                }

                // 🚀 Appel via l'instance API centralisée
                const response = await api.get('/reservations/mon-historique');
                
                // Extraction des données de manière sécurisée
                const data = response.data !== undefined ? response.data : response;
                setReservations(Array.isArray(data) ? data : []);

            } catch (error) {
                console.error("Erreur lors du chargement de l'historique :", error);
                
                if (error.response?.status === 401 || error.status === 401) {
                    localStorage.removeItem('token'); // Nettoyage du token expiré
                    setErrorMsg("Votre session a expiré ou est invalide. Redirection vers la page de connexion...");
                    
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setErrorMsg("Impossible de charger votre historique de voyages. Veuillez réessayer plus tard.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        chargerHistorique();
    }, [navigate]);

    // Redirection intelligente vers la bonne page de paiement selon le cas
    const gererPaiement = (res, event) => {
        event.stopPropagation();
        
        if (res.statutPaiement === "ATTENTE_PAIEMENT_SURPLUS") {
            // Redirection vers le formulaire spécifique du surplus de récupération à domicile
            navigate(`/client/reservation-recuperation/${res.id}`);
        } else if (res.statutPaiement === "ATTENTE_PAIEMENT" || res.statutPaiement === "EN_ATTENTE") {
            // Redirection vers le formulaire de paiement standard du billet complet
            navigate(`/client/paiement-reservation/${res.id}`);
        }
    };

    // Filtrage des données de la liste
    const reservationsFiltrees = reservations.filter(res => {
        if (filter === 'ATTENTE_PAIEMENT') {
            return res.statutPaiement === 'ATTENTE_PAIEMENT' || res.statutPaiement === 'EN_ATTENTE' || res.statutPaiement === 'ATTENTE_PAIEMENT_SURPLUS';
        }
        if (filter === 'RAMASSAGE') {
            return res.typeReservation === 'VID' || res.typeReservation === 'VIP';
        }
        return true;
    });

    // Rendu du Badge de Statut de Paiement
    const renderBadgeStatut = (statut) => {
        switch (statut) {
            case 'PAYE':
            case 'VALIDEE':
            case 'CONFIRMEE':
            case 'EMBARQUE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <FaCheckCircle size={12} /> Payé
                    </span>
                );
            case 'ATTENTE_PAIEMENT_SURPLUS':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse">
                        <FaClock size={12} /> Surplus à payer (VID)
                    </span>
                );
            case 'ATTENTE_PAIEMENT':
            case 'EN_ATTENTE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                        <FaExclamationCircle size={12} /> Billet non payé
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                        {statut}
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-8 text-slate-800 dark:text-slate-100">
            <div className="max-w-5xl mx-auto">
                
                {/* --- HEADER --- */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Mon Historique de Voyages
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Consultez vos réservations, vérifiez vos statuts de ramassage à domicile et finalisez vos paiements en toute sécurité.
                    </p>
                </div>

                {/* --- MESSAGE D'ERREUR DYNAMIQUE --- */}
                {errorMsg && (
                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm">
                        <FaExclamationCircle className="flex-shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* --- BARRE DE FILTRES --- */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/60 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('TOUTES')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border-0 cursor-pointer ${
                                filter === 'TOUTES'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Toutes ({reservations.length})
                        </button>
                        <button
                            onClick={() => setFilter('ATTENTE_PAIEMENT')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border-0 cursor-pointer ${
                                filter === 'ATTENTE_PAIEMENT'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-100 dark:shadow-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Attente Paiement ({reservations.filter(r => r.statutPaiement !== 'PAYE' && r.statutPaiement !== 'VALIDEE' && r.statutPaiement !== 'CONFIRMEE' && r.statutPaiement !== 'EMBARQUE').length})
                        </button>
                        <button
                            onClick={() => setFilter('RAMASSAGE')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border-0 cursor-pointer ${
                                filter === 'RAMASSAGE'
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className="inline-flex items-center gap-1">
                                <FaCar size={11} /> Options VID / À domicile
                            </span>
                        </button>
                    </div>
                </div>

                {/* --- ZONE PRINCIPALE DE LISTING --- */}
                {isLoading ? (
                    <div className="py-20 text-center text-sm text-slate-400 font-semibold animate-pulse">
                        Chargement de votre historique...
                    </div>
                ) : reservationsFiltrees.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800/60 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                            <FaSearch size={20} />
                        </div>
                        <p className="font-bold text-slate-700 dark:text-slate-300">Aucune réservation trouvée</p>
                        <p className="text-xs text-slate-400 mt-1">Aucun élément ne correspond au filtre sélectionné.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reservationsFiltrees.map((res) => (
                            <div 
                                key={res.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden"
                            >
                                {/* Tag distinctif VID / Normal en haut à droite */}
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    {res.typeReservation === 'VID' || res.typeReservation === 'VIP' ? (
                                        <span className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black tracking-widest rounded-lg uppercase shadow-sm flex items-center gap-1">
                                            <FaCar size={10} /> VID / À Domicile
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wider rounded-lg uppercase">
                                            Standard
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    
                                    {/* Infos de base du trajet */}
                                    <div className="space-y-3 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                                            <FaCalendarAlt />
                                            <span>RÉSERVATION N° {res.id}</span>
                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                            <span className="text-slate-400 lowercase font-medium">
                                                Fait le {res.dateReservation ? new Date(res.dateReservation).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}) : 'Date inconnue'}
                                            </span>
                                        </div>

                                        {/* Trajet Départ ➔ Arrivée */}
                                        <div className="flex items-center gap-3 text-lg font-black text-slate-800 dark:text-white">
                                            <span>{res.villeDepart}</span>
                                            <FaArrowRight size={14} className="text-slate-400 mt-0.5" />
                                            <span>{res.villeArrivee}</span>
                                            <span className="ml-2 text-sm font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                                                {res.heureDepart || '--:--'}
                                            </span>
                                        </div>

                                        {/* Affichage de l'adresse de ramassage si c'est une option VID */}
                                        {(res.typeReservation === 'VID' || res.typeReservation === 'VIP') && res.adresseRamassage && (
                                            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl w-full max-w-md border border-slate-100 dark:border-indigo-950/20">
                                                <FaMapMarkerAlt className="text-indigo-500 flex-shrink-0" />
                                                <span className="truncate"><strong>Ramassage :</strong> {res.adresseRamassage}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Prix & Statut financiers (À droite) */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50 dark:border-slate-800/50">
                                        
                                        {/* Montants calculés d'après le backend */}
                                        <div className="md:text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montant total du voyage</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">
                                                {/* 🛠️ Somme exacte cumulée et sécurisée */}
                                                {((res.montantTotal || 0) + (res.prixSupplementaire || 0)).toLocaleString('fr-FR')}{' '}
                                                <span className="text-xs font-bold text-slate-500">FC</span>
                                            </p>
                                            
                                            {/* Détails transparents de la tarification */}
                                            {res.prixSupplementaire > 0 && (
                                                <div className="mt-1 text-[11px] space-y-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                                    <p>Billet : {(res.montantTotal || 0).toLocaleString('fr-FR')} FC</p>
                                                    <p className={res.statutPaiement === 'ATTENTE_PAIEMENT_SURPLUS' ? "text-amber-600 dark:text-amber-400 font-bold animate-pulse" : "text-emerald-600 dark:text-emerald-400"}>
                                                        Frais de ramassage : {(res.prixSupplementaire).toLocaleString('fr-FR')} FC
                                                        {res.statutPaiement === 'ATTENTE_PAIEMENT_SURPLUS' ? " (En attente)" : " (Payé)"}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions et Badges */}
                                        <div className="flex items-center gap-3">
                                            {renderBadgeStatut(res.statutPaiement)}

                                            {/* Affichage conditionnel du bouton Payer */}
                                            {res.statutPaiement !== 'PAYE' && res.statutPaiement !== 'VALIDEE' && res.statutPaiement !== 'CONFIRMEE' && res.statutPaiement !== 'EMBARQUE' && (
                                                <button
                                                    onClick={(e) => gererPaiement(res, e)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer border-0"
                                                >
                                                    <FaCreditCard size={12} />
                                                    <span>Payer</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoriqueReservations;
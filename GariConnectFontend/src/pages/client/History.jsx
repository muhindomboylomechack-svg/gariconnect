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
    FaExclamationCircle,
    FaUsers,
    FaEdit,
    FaBan,
    FaTrashAlt,
    FaTimes
} from 'react-icons/fa';

// 🌐 Import de l'instance API centralisée
import api from '../../services/api';

const HistoriqueReservations = () => {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [filter, setFilter] = useState('TOUTES'); // TOUTES, ATTENTE_PAIEMENT, RAMASSAGE
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // 🛠️ ÉTATS POUR LES MODALES (Edition / Suppression)
    const [reservationAEditer, setReservationAEditer] = useState(null);
    const [nombrePlacesEdit, setNombrePlacesEdit] = useState(1);
    const [adresseRamassageEdit, setAdresseRamassageEdit] = useState('');
    const [changerLocalisation, setChangerLocalisation] = useState(false); // NOUVEL ÉTAT POUR VIP
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reservationASupprimer, setReservationASupprimer] = useState(null);

    // 🔄 Chargement initial de l'historique
    const chargerHistorique = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const token = localStorage.getItem('token'); 
            
            if (!token) {
                setErrorMsg("Vous devez être connecté pour voir votre historique.");
                setIsLoading(false); 
                return;
            }

            const response = await api.get('/reservations/mon-historique');
            const rawData = response.data !== undefined ? response.data : response;
            const arrayData = Array.isArray(rawData) ? rawData : [];

            // 🛠️ MAPPING FRONTEND : Forcer le statut de paiement à "ANNULEE" si la réservation est annulée
            const dataTraitee = arrayData.map(res => {
                const st = (res.statut || res.statutPaiement || '')?.toUpperCase();
                if (['ANNULEE', 'ANNULE', 'CANCELLED'].includes(st)) {
                    return {
                        ...res,
                        statutPaiement: 'ANNULEE'
                    };
                }
                return res;
            });

            setReservations(dataTraitee);
        } catch (error) {
            console.error("Erreur lors du chargement de l'historique :", error);
            
            if (error.response?.status === 401 || error.status === 401) {
                localStorage.removeItem('token');
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

    useEffect(() => {
        chargerHistorique();
    }, [navigate]);

    // 💰 Redirection paiement
    const gererPaiement = (res, event) => {
        event.stopPropagation();
        if (res.statutPaiement === "ATTENTE_PAIEMENT_SURPLUS") {
            navigate(`/client/reservation-recuperation/${res.id}`);
        } else {
            navigate(`/client/paiement-reservation/${res.id}`);
        }
    };

    // ✏️ 1. MODIFIER UNE RÉSERVATION
    const ouvrirModalEdition = (res) => {
        setReservationAEditer(res);
        setNombrePlacesEdit(res.nombrePlaces || 1);
        setAdresseRamassageEdit(res.adresseRamassage || '');
        setChangerLocalisation(false); // Par défaut, on conserve l'ancienne localisation
    };

    const enregistrerModification = async (e) => {
        e.preventDefault();
        if (!reservationAEditer) return;
        
        setIsSubmitting(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        
        try {
            // Construction du payload envoyé à l'API
            const payload = {
                nombrePlaces: parseInt(nombrePlacesEdit, 10),
                adresseRamassage: changerLocalisation ? adresseRamassageEdit : reservationAEditer.adresseRamassage,
                demandeRecalculLocalisation: changerLocalisation 
            };
            
            await api.put(`/reservations/${reservationAEditer.id}`, payload);
            
            setSuccessMsg(`La réservation N° ${reservationAEditer.id} a été mise à jour avec succès ! ${changerLocalisation ? "Votre agence va recalculer le prix de récupération." : ""}`);
            setReservationAEditer(null);
            
            // Recharger les données fraîches depuis le serveur
            await chargerHistorique();
        } catch (error) {
            console.error("Erreur modification réservation :", error);
            setErrorMsg(error.response?.data?.message || "Erreur lors de la modification de la réservation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🚫 2. ANNULER UNE RÉSERVATION
    const gererAnnulation = async (res) => {
        const confirmation = window.confirm(`Êtes-vous sûr de vouloir annuler la réservation N° ${res.id} ?`);
        if (!confirmation) return;
        setIsLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            await api.patch(`/reservations/${res.id}/annuler`);
            
            setSuccessMsg(`La réservation N° ${res.id} a bien été annulée.`);
            await chargerHistorique();
        } catch (error) {
            console.error("Erreur complète lors de l'annulation :", error);
            
            let messageErreur = "Impossible d'annuler cette réservation.";
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    messageErreur = error.response.data;
                } else if (error.response.data.message) {
                    messageErreur = error.response.data.message;
                } else if (error.response.data.error) {
                    messageErreur = error.response.data.error;
                }
            } else if (error.message) {
                messageErreur = error.message;
            }
            
            setErrorMsg(`Échec de l'annulation : ${messageErreur}`);
            setIsLoading(false);
        }
    };

    // 🗑️ 3. SUPPRIMER UNE RÉSERVATION (Gestion propre du clic)
    const handleDelete = (res, event) => {
        if (event) event.stopPropagation();
        
        const statut = (res.statut || res.statutPaiement || '')?.toUpperCase();
        
        // Empêcher la suppression si la réservation est payée
        if (['PAYE', 'VALIDEE', 'CONFIRMEE', 'EMBARQUE'].includes(statut)) {
            setErrorMsg("Une réservation payée ne peut pas être supprimée.");
            return;
        }
        setReservationASupprimer(res);
    };

    const confirmerSuppression = async () => {
        if (!reservationASupprimer) return;
        setIsSubmitting(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            // Appeler l'endpoint de masquage
            await api.put(`/reservations/${reservationASupprimer.id}/masquer-client`);
            
            // Retirer la réservation de l'affichage local du client
            setReservations(prev => prev.filter(r => r.id !== reservationASupprimer.id));
            setSuccessMsg(`La réservation N° ${reservationASupprimer.id} a été retirée de votre historique.`);
            setReservationASupprimer(null);
        } catch (error) {
            console.error("Erreur masquage réservation :", error);
            
            let messageErreur = "Impossible de retirer cette réservation de votre historique.";
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    messageErreur = error.response.data;
                } else if (error.response.data.message) {
                    messageErreur = error.response.data.message;
                }
            }
            setErrorMsg(messageErreur);
            setReservationASupprimer(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtrage des données de la liste
    const reservationsFiltrees = reservations.filter(res => {
        const statut = (res.statut || res.statutPaiement)?.toUpperCase();
        
        if (filter === 'ATTENTE_PAIEMENT') {
            return (
                statut !== 'PAYE' && 
                statut !== 'VALIDEE' && 
                statut !== 'CONFIRMEE' && 
                statut !== 'EMBARQUE' &&
                statut !== 'ANNULEE' &&
                statut !== 'ANNULE' &&
                statut !== 'CANCELLED'
            );
        }
        if (filter === 'RAMASSAGE') {
            return res.typeReservation === 'VID' || res.typeReservation === 'VIP';
        }
        return true;
    });

    // Badge Statut
    const renderBadgeStatut = (statut) => {
        if (!statut) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    <FaExclamationCircle size={12} /> En attente
                </span>
            );
        }
        switch (statut.toUpperCase()) {
            case 'PAYE':
            case 'VALIDEE':
            case 'CONFIRMEE':
            case 'EMBARQUE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <FaCheckCircle size={12} /> Payé
                    </span>
                );
            case 'ATTENTE_RECALCUL':
            case 'ATTENTE_PAIEMENT_SURPLUS':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse">
                        <FaClock size={12} /> Surplus à calculer/payer
                    </span>
                );
            case 'ANNULEE':
            case 'ANNULE':
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        <FaBan size={12} /> Annulée
                    </span>
                );
            case 'ATTENTE_PAIEMENT':
            case 'EN_ATTENTE':
            case 'EN_ATTENTE_DE_PAIEMENT':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                        <FaExclamationCircle size={12} /> Billet non payé
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                        <FaExclamationCircle size={12} /> {statut}
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
                        Consultez, modifiez, annulez ou gérez vos réservations en toute simplicité.
                    </p>
                </div>

                {/* --- NOTIFICATIONS --- */}
                {errorMsg && (
                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm">
                        <FaExclamationCircle className="flex-shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm">
                        <FaCheckCircle className="flex-shrink-0" />
                        <span>{successMsg}</span>
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
                            Attente Paiement ({
                                reservations.filter(r => {
                                    const st = (r.statut || r.statutPaiement)?.toUpperCase();
                                    return st !== 'PAYE' && st !== 'VALIDEE' && st !== 'CONFIRMEE' && st !== 'EMBARQUE' && st !== 'ANNULEE' && st !== 'ANNULE' && st !== 'CANCELLED';
                                }).length
                            })
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
                                <FaCar size={11} /> Options VID / VIP
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
                        {reservationsFiltrees.map((res) => {
                            const nombrePlaces = res.nombrePlaces || 1;
                            const totalFacture = res.montantTotal || 0; 
                            const montantSupplementaire = res.prixSupplementaire || 0;
                            const prixUnitaireBillet = nombrePlaces > 0 ? (totalFacture - montantSupplementaire) / nombrePlaces : 0;
                            
                            const statutUpper = (res.statut || res.statutPaiement)?.toUpperCase();
                            const estPayeOuValide = ['PAYE', 'VALIDEE', 'CONFIRMEE', 'EMBARQUE'].includes(statutUpper);
                            const estAnnule = ['ANNULEE', 'ANNULE', 'CANCELLED'].includes(statutUpper);
                            const afficherBoutonPayer = !estPayeOuValide && !estAnnule;

                            return (
                                <div 
                                    key={res.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden"
                                >
                                    {/* Tag VIP/VID / Normal */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        {res.typeReservation === 'VID' || res.typeReservation === 'VIP' ? (
                                            <span className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black tracking-widest rounded-lg uppercase shadow-sm flex items-center gap-1">
                                                <FaCar size={10} /> {res.typeReservation} / À Domicile
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wider rounded-lg uppercase">
                                                Standard
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-6 sm:mt-0">
                                        
                                        {/* Infos du trajet */}
                                        <div className="space-y-3 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                                                <FaCalendarAlt />
                                                <span>RÉSERVATION N° {res.id}</span>
                                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                                <span className="text-slate-400 lowercase font-medium">
                                                    Fait le {res.dateReservation ? new Date(res.dateReservation).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}) : 'Date inconnue'}
                                                </span>
                                            </div>

                                            {/* Trajet */}
                                            <div className="flex flex-wrap items-center gap-3 text-lg font-black text-slate-800 dark:text-white">
                                                <span>{res.villeDepart}</span>
                                                <FaArrowRight size={14} className="text-slate-400 mt-0.5" />
                                                <span>{res.villeArrivee}</span>
                                                <span className="ml-2 text-sm font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                                                    {res.heureDepart || '--:--'}
                                                </span>
                                            </div>

                                            {/* Places */}
                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl">
                                                    <FaUsers size={12} />
                                                    {nombrePlaces} {nombrePlaces > 1 ? 'places réservées' : 'place réservée'}
                                                </span>
                                                {res.numeroSiege && (
                                                    <span className="text-slate-400">
                                                        Siège(s) : <strong className="text-slate-700 dark:text-slate-200">{res.numeroSiege}</strong>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Adresse de ramassage */}
                                            {(res.typeReservation === 'VID' || res.typeReservation === 'VIP') && res.adresseRamassage && (
                                                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl w-full max-w-md border border-slate-100 dark:border-indigo-950/20 mt-2">
                                                    <FaMapMarkerAlt className="text-indigo-500 flex-shrink-0" />
                                                    <span className="truncate"><strong>Localisation (GPS/Dom.) :</strong> {res.adresseRamassage}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Prix & Statut financiers (CORRIGÉ POUR MOBILE) */}
                                        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/50 w-full md:w-auto mt-4 md:mt-0">
                                            <div className="w-full sm:w-auto md:text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montant total du voyage</p>
                                                <p className="text-xl font-black text-slate-900 dark:text-white">
                                                    {totalFacture.toLocaleString('fr-FR')}{' '}
                                                    <span className="text-xs font-bold text-slate-500">FC</span>
                                                </p>
                                                
                                                <div className="mt-1 text-[11px] space-y-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                                    <p>Billets ({nombrePlaces}x) : {(prixUnitaireBillet * nombrePlaces).toLocaleString('fr-FR')} FC</p>
                                                    {montantSupplementaire > 0 && (
                                                        <p className={res.statutPaiement === 'ATTENTE_PAIEMENT_SURPLUS' || res.statut === 'ATTENTE_RECALCUL' ? "text-amber-600 dark:text-amber-400 font-bold animate-pulse" : "text-emerald-600 dark:text-emerald-400"}>
                                                            Frais de ramassage : {montantSupplementaire.toLocaleString('fr-FR')} FC
                                                            {res.statutPaiement === 'ATTENTE_PAIEMENT_SURPLUS' ? " (En attente)" : " (Payé)"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions & Badges (CORRIGÉ AVEC FLEX-WRAP) */}
                                            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
                                                {renderBadgeStatut(res.statutPaiement || res.statut)}
                                                
                                                {/* Bouton Payer */}
                                                {afficherBoutonPayer && (
                                                    <button
                                                        onClick={(e) => gererPaiement(res, e)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer border-0"
                                                    >
                                                        <FaCreditCard size={11} />
                                                        <span>Payer</span>
                                                    </button>
                                                )}

                                                {/* Bouton Modifier */}
                                                {!estAnnule && (
                                                    <button
                                                        onClick={() => ouvrirModalEdition(res)}
                                                        title="Modifier la réservation"
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border-0 cursor-pointer flex-shrink-0"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                )}

                                                {/* Bouton Annuler */}
                                                {!estAnnule && (
                                                    <button
                                                        onClick={() => gererAnnulation(res)}
                                                        title="Annuler la réservation"
                                                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border-0 cursor-pointer flex-shrink-0"
                                                    >
                                                        <FaBan size={14} />
                                                    </button>
                                                )}

                                                {/* Bouton Supprimer */}
                                                {!estPayeOuValide && (
                                                    <button
                                                        onClick={(e) => handleDelete(res, e)}
                                                        title="Supprimer la réservation"
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border-0 cursor-pointer flex-shrink-0"
                                                    >
                                                        <FaTrashAlt size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- MODALE DE SUPPRESSION (Vérification et exécution) --- */}
            {reservationASupprimer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200 text-center">
                        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto text-rose-500 mb-4">
                            <FaTrashAlt size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            Supprimer la réservation ?
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Cette action masquera la réservation N° {reservationASupprimer.id} de votre historique de manière permanente.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setReservationASupprimer(null)}
                                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmerSuppression}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Suppression...' : 'Oui, supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALE DE MODIFICATION (EDIT) --- */}
            {reservationAEditer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FaEdit className="text-indigo-600" />
                                Modifier la réservation N° {reservationAEditer.id}
                            </h3>
                            <button 
                                onClick={() => setReservationAEditer(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-0 bg-transparent cursor-pointer"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={enregistrerModification} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    Nombre de places
                                </label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="10" 
                                    value={nombrePlacesEdit} 
                                    onChange={(e) => setNombrePlacesEdit(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                            </div>

                            {/* Section Spécifique VIP / VID pour la localisation */}
                            {(reservationAEditer.typeReservation === 'VID' || reservationAEditer.typeReservation === 'VIP') && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
                                        <FaMapMarkerAlt className="text-indigo-500"/>
                                        Gestion de la localisation (Récupération)
                                    </h4>
                                    
                                    {/* CONTENU COMPLÉTÉ ICI */}
                                    <label className="flex items-start gap-3 cursor-pointer group mb-3">
                                        <div className="flex items-center h-5 mt-0.5">
                                            <input 
                                                type="checkbox" 
                                                checked={changerLocalisation}
                                                onChange={(e) => setChangerLocalisation(e.target.checked)}
                                                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                Je souhaite changer l'adresse
                                            </span>
                                            <span className="text-[11px] text-slate-500 mt-1">
                                                Cela déclenchera un recalcul automatique des frais de récupération.
                                            </span>
                                        </div>
                                    </label>

                                    {changerLocalisation && (
                                        <div className="mt-4 animate-in fade-in duration-200">
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                                Nouvelle adresse de récupération
                                            </label>
                                            <input 
                                                type="text" 
                                                value={adresseRamassageEdit} 
                                                onChange={(e) => setAdresseRamassageEdit(e.target.value)}
                                                placeholder="Ex: Quartier, Avenue, N° de parcelle"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                                required={changerLocalisation}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setReservationAEditer(null)}
                                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                                >
                                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoriqueReservations;
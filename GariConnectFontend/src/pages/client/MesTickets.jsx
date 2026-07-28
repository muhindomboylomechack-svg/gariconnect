import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    FaBus, 
    FaArrowLeft, 
    FaTicketAlt, 
    FaInbox, 
    FaQrcode, 
    FaTimes, 
    FaTrash, 
    FaSearch, 
    FaMapMarkerAlt, 
    FaExclamationTriangle 
} from 'react-icons/fa';
import QRCode from 'react-qr-code'; 
import api from '../../services/api'; 
import TicketCard from './TicketCard';

const MesTickets = () => {
    const { t } = useTranslation();
    const [mesTickets, setMesTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('TOUS');

    // 🔍 États pour la recherche par trajet
    const [searchDepart, setSearchDepart] = useState('');
    const [searchDestination, setSearchDestination] = useState('');

    // 🟢 États pour gérer la modale du QR Code
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [qrCodeDataPayload, setQrCodeDataPayload] = useState('');
    const [selectedTicketCode, setSelectedTicketCode] = useState('');

    // 🗑️ États pour la suppression du ticket
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchMyTickets = async () => {
            try {
                // 🎟️ Appel de l'endpoint pour récupérer les tickets
                const response = await api.get('/tickets/mes-tickets-actifs');
                if (isMounted) {
                    setMesTickets(response.data || []);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des tickets:", err);
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

    // 🗑️ Fonction de suppression du ticket exécutée dans la modale
    const handleDeleteTicket = async () => {
        if (!ticketToDelete) return;
        setDeleting(true);

        try {
            // Appel à l'instance api configurée
            await api.delete(`/tickets/${ticketToDelete.id}`);

            // Mise à jour de l'état local en filtrant le ticket supprimé
            setMesTickets(prevTickets => prevTickets.filter(t => t.id !== ticketToDelete.id));

            setIsDeleteModalOpen(false);
            setTicketToDelete(null);
        } catch (err) {
            console.error("Erreur lors de la suppression du ticket:", err);
            alert(err.response?.data?.message || "Erreur lors de la suppression du ticket.");
        } finally {
            setDeleting(false);
        }
    };

    // 🔍 Filtrage combiné (Statut du Ticket + Recherche Départ / Destination)
    const filteredTickets = mesTickets.filter((ticket) => {
        const res = ticket.reservation || {};
        
        // 1. Filtre par statut du ticket/réservation
        let matchStatut = true;
        const statutEffectif = ticket.statut || res.statut;
        if (activeFilter === 'CONFIRME') {
            matchStatut = statutEffectif === 'PAYE' || statutEffectif === 'CONFIRMEE' || statutEffectif === 'EMBARQUE' || statutEffectif === 'VALIDE';
        } else if (activeFilter === 'ATTENTE') {
            matchStatut = statutEffectif === 'EN_ATTENTE_DE_PAIEMENT' || statutEffectif === 'ATTENTE_PAIEMENT' || statutEffectif === 'ATTENTE_PAIEMENT_SURPLUS';
        }
        
        // 2. Filtre par ville de départ
        const depart = res.trajet?.depart?.toLowerCase() || '';
        const matchDepart = depart.includes(searchDepart.trim().toLowerCase());
        
        // 3. Filtre par ville d'arrivée / destination
        const destination = res.trajet?.destination?.toLowerCase() || '';
        const matchDestination = destination.includes(searchDestination.trim().toLowerCase());
        
        return matchStatut && matchDepart && matchDestination;
    });

    // 📷 Ouverture de la modale avec génération du Payload JSON scannable
    const openQrModal = (ticket) => {
        const res = ticket.reservation || {};
        const ticketCode = ticket.codeTicket || res.codeTicket || `TK-${ticket.id}`;
        const userId = res.client?.id || res.user?.id || 0;
        const nbPlaces = res.nombrePlaces || 1;
        
        const payload = JSON.stringify({
            ticketCode: ticketCode,
            ticketId: ticket.id,
            reservationId: res.id,
            userId: userId,
            placesAchetees: nbPlaces,
            statut: ticket.statut || "VALIDE"
        });
        
        setSelectedTicketCode(ticketCode);
        setQrCodeDataPayload(payload);
        setIsQrModalOpen(true);
    };

    const closeQrModal = () => {
        setIsQrModalOpen(false);
        setSelectedTicketCode('');
        setQrCodeDataPayload('');
    };

    const openDeleteModal = (ticket) => {
        setTicketToDelete(ticket);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        if (!deleting) {
            setIsDeleteModalOpen(false);
            setTicketToDelete(null);
        }
    };

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

    if (error || mesTickets.length === 0) {
        return (
            <div className="max-w-md mx-auto py-16 px-4 text-center sm:py-24">
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-100 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="bg-blue-50 dark:bg-blue-950/40 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-blue-500 mb-6">
                        <FaTicketAlt className="text-3xl" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
                        {error ? t('checkout.error_load') : "Aucun ticket disponible"}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm font-medium leading-relaxed">
                        {error 
                            ? "Une erreur est survenue lors de la récupération de vos données."
                            : "Vos tickets confirmés apparaîtront ici pour faciliter votre embarquement."
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
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest leading-none mb-1">Total Billets</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white">{mesTickets.length}</p>
                    </div>
                </div>
            </div>

            {/* 🔍 Zone de recherche par Trajet (Départ - Arrivée) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <FaSearch className="text-blue-500" /> Rechercher un billet par trajet
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input 
                            type="text" 
                            placeholder="Ville de départ..."
                            value={searchDepart}
                            onChange={(e) => setSearchDepart(e.target.value)}
                            className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>
                    <div className="relative">
                        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input 
                            type="text" 
                            placeholder="Ville d'arrivée..."
                            value={searchDestination}
                            onChange={(e) => setSearchDestination(e.target.value)}
                            className="w-full pl-8 pr-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Système de Filtres par statut */}
            <div className="flex overflow-x-auto pb-3 mb-6 gap-2 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
                {[
                    { id: 'TOUS', label: 'Tous les billets' },
                    { id: 'CONFIRME', label: 'Confirmés / Valides' },
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
            {filteredTickets.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center transition-colors">
                    <FaInbox className="text-slate-300 dark:text-slate-700 text-4xl mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                        Aucun billet ne correspond à vos critères de recherche.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5">
                    {filteredTickets.map((ticketItem, index) => {
                        const res = ticketItem.reservation || {};
                        let dateDepart = "--/--/--";
                        let heureDepart = "--:--";
                        
                        if (res.trajet?.dateHeureDepart) {
                            const dateObj = new Date(res.trajet.dateHeureDepart);
                            dateDepart = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            heureDepart = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        }
                        const nbPlaces = res.nombrePlaces || 1;
                        const placeLabel = nbPlaces > 1 ? "Places" : "Place";
                        const siegeAssigne = res.numeroSiege ? `(Siège N°${res.numeroSiege})` : "(Libre)";
                        const infoSieges = `${nbPlaces} ${placeLabel} ${siegeAssigne}`;
                        
                        const surplusRamassage = res.demande_recuperation?.prixSupplementaire || res.demandeRecuperation?.prixSupplementaire || 0;
                        const prixBase = (res.trajet?.prix || 0) * nbPlaces;
                        const prixTotalAffichage = res.montantPaye || res.montant_total || res.montantTotal || (prixBase + surplusRamassage);
                        
                        return (
                            <div 
                                key={ticketItem.id || index} 
                                className="animate-in fade-in zoom-in-95 duration-300 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden" 
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <TicketCard 
                                    ticket={{
                                        depart: res.trajet?.depart || "N/A",
                                        destination: res.trajet?.destination || "N/A",
                                        date: dateDepart,
                                        heure: heureDepart,
                                        siege: infoSieges,
                                        code: ticketItem.codeTicket || res.codeTicket || `TK-${ticketItem.id}`, 
                                        prix: prixTotalAffichage,
                                        statut: ticketItem.statut || res.statut || 'VALIDE', 
                                        nomPassager: res.client?.nom || res.user?.nom || "Voyageur",
                                        agence: res.trajet?.agence?.nom || "Agence Partenaire",
                                        typeReservation: res.typeReservation || "STANDARD",
                                        surplusRamassage: surplusRamassage 
                                    }} 
                                />
                                
                                {/* 🟢 Boutons d'action sous la carte */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                    {/* 🗑️ Bouton Supprimer le Ticket */}
                                    <button
                                        onClick={() => openDeleteModal(ticketItem)}
                                        className="flex items-center gap-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 dark:text-rose-400 px-3.5 py-2 rounded-xl transition-colors"
                                    >
                                        <FaTrash /> Supprimer le ticket
                                    </button>
                                    
                                    {/* 🟢 Bouton QR Code */}
                                    <button 
                                        onClick={() => openQrModal(ticketItem)}
                                        className="flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 ml-auto"
                                    >
                                        <FaQrcode /> Afficher le QR Code
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-center mt-12 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-4 leading-relaxed">
                Présentez votre QR Code ou votre code de ticket unique à l'embarquement
            </p>

            {/* 🟢 Modale pour afficher le QR Code scannable */}
            {isQrModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative zoom-in-95">
                        <button 
                            onClick={closeQrModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-full"
                        >
                            <FaTimes />
                        </button>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Code d'Embarquement</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6">
                            Présentez ce QR Code au contrôleur ou au chauffeur pour la validation du billet.
                        </p>
                        <div className="bg-white p-4 rounded-2xl inline-block shadow-sm border border-slate-100 mb-6">
                            <QRCode 
                                value={qrCodeDataPayload || selectedTicketCode} 
                                size={200}
                                level={"H"}
                            />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1">Référence Billet</p>
                            <p className="text-lg font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                                {selectedTicketCode}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 🗑️ Modale de Confirmation de Suppression */}
            {isDeleteModalOpen && ticketToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative zoom-in-95">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                            <FaExclamationTriangle />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                            Supprimer ce ticket ?
                        </h3>
                        
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed mb-6">
                            Êtes-vous sûr de vouloir supprimer ce ticket pour le trajet <br />
                            <strong className="text-slate-800 dark:text-slate-200">
                                {ticketToDelete.reservation?.trajet?.depart} → {ticketToDelete.reservation?.trajet?.destination}
                            </strong> ? <br />
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                (Note : Votre réservation associée restera enregistrée dans le système d'agence).
                            </span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteTicket}
                                disabled={deleting}
                                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                            >
                                {deleting ? "Suppression..." : "Oui, supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MesTickets;
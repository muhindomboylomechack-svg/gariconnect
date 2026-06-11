import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaBell, 
    FaBox, 
    FaCheckCircle, 
    FaCircle, 
    FaTrashAlt, 
    FaChevronDown, 
    FaChevronUp, 
    FaArrowRight, 
    FaCreditCard, 
    FaCalendarAlt 
} from 'react-icons/fa';
import { notificationService } from '../services/notificationService';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // État local pour suivre les IDs des notifications dont le texte est déplié localement
    const [expandedNotifs, setExpandedNotifs] = useState({});
    const menuRef = useRef(null);
    const navigate = useNavigate();

    // Charger les notifications depuis le backend Spring Boot
    const chargerNotifications = useCallback(async (afficherChargement = false) => {
        if (afficherChargement) setIsLoading(true);
        try {
            const data = await notificationService.getMesNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erreur lors du chargement des notifications :", error);
        } finally {
            if (afficherChargement) setIsLoading(false);
        }
    }, []);

    // 1. MISE EN PLACE DU POLLING BOOTSTRAPÉ (Toutes les 30 secondes)
    useEffect(() => {
        chargerNotifications();

        const interval = setInterval(() => {
            chargerNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [chargerNotifications]);

    // 2. REFRESH INSTANTANÉ : Force la mise à jour dès que l'utilisateur ouvre la cloche
    useEffect(() => {
        if (isOpen) {
            chargerNotifications(true);
        }
    }, [isOpen, chargerNotifications]);

    // 3. FERMETURE DU MENU SUR CLIC EXTÉRIEUR (Click Outside)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Marquer comme lue séparée (utilisée par le clic sur le conteneur ou le bouton de détails)
    const marquerCommeLueSiNecessaire = async (notification) => {
        if (!notification.lue) {
            try {
                await notificationService.marquerCommeLue(notification.id);
                setNotifications(prev => prev.map(notif => 
                    notif.id === notification.id ? { ...notif, lue: true } : notif
                ));
            } catch (error) {
                console.error("Erreur lors de la mise à jour de la notification :", error);
            }
        }
    };

    // 4. ACTION AU CLIC SUR LE CONTENEUR : Marque comme lu
    const handleNotificationClick = async (notification) => {
        await marquerCommeLueSiNecessaire(notification);
    };

    // LOGIQUE GÉNÉRIQUE DU BOUTON "PLUS DE DÉTAILS"
    const handleDetailsClick = async (notification, event) => {
        event.stopPropagation(); // Évite de déclencher handleNotificationClick du div parent doublement
        
        // Marquer automatiquement comme lue lors de la consultation des détails
        await marquerCommeLueSiNecessaire(notification);

        const typeAction = notification.typeAction?.toUpperCase();
        const refId = notification.referenceId;

        // Si la notification possède une action précise et une référence ID, on redirige
        if (typeAction && refId) {
            setIsOpen(false); // Fermer le menu déroulant de la cloche

            switch (typeAction) {
                case 'PAIEMENT_RECUPERATION':
                case 'ATTENTE_PAIEMENT_SURPLUS':
                    navigate(`/client/reservation-recuperation/${refId}`);
                    break;
                case 'PAIEMENT_RESERVATION':
                    navigate(`/client/paiement-reservation/${refId}`);
                    break;
                case 'NOUVELLE_RESERVATION':
                case 'DETAILS_RESERVATION':
                    navigate(`/client/reservation/${refId}`);
                    break;
                default:
                    // Si le type d'action n'est pas encore mappé vers une route, on bascule sur l'accordéon local
                    toggleExpandLocal(notification.id);
                    break;
            }
        } else {
            // Pas d'action/redirection définie -> On ouvre simplement l'accordéon pour lire tout le texte
            toggleExpandLocal(notification.id);
        }
    };

    const toggleExpandLocal = (id) => {
        setExpandedNotifs(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // 5. SUPPRESSION INDIVIDUELLE
    const handleSupprimer = async (id, event) => {
        event.stopPropagation();
        try {
            await notificationService.supprimerNotification(id);
            setNotifications(prev => prev.filter(notif => notif.id !== id));
            setExpandedNotifs(prev => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        } catch (error) {
            console.error("Erreur lors de la suppression de la notification :", error);
        }
    };

    // 6. BALAYAGE GLOBAL
    const handleBalayerLues = async () => {
        try {
            await notificationService.balayerNotificationsLues();
            setNotifications(prev => prev.filter(notif => !notif.lue));
        } catch (error) {
            console.error("Erreur lors du balayage des notifications lues :", error);
        }
    };

    // OBTENIR L'ICÔNE ADAPTÉE AU TYPE D'ACTION
    const obtenirIconeAction = (typeAction) => {
        switch (typeAction?.toUpperCase()) {
            case 'PAIEMENT_RECUPERATION':
            case 'ATTENTE_PAIEMENT_SURPLUS':
            case 'PAIEMENT_RESERVATION':
                return <FaCreditCard size={14} />;
            case 'NOUVELLE_RESERVATION':
            case 'DETAILS_RESERVATION':
                return <FaCalendarAlt size={14} />;
            default:
                return <FaBox size={14} />;
        }
    };

    const unreadCount = notifications.filter(n => !n.lue).length;
    const aDesNotificationsLues = notifications.some(n => n.lue);

    // Formater la date
    const formaterDate = (dateSource) => {
        if (!dateSource) return '';
        
        let date;
        if (Array.isArray(dateSource)) {
            date = new Date(
                dateSource[0],
                (dateSource[1] || 1) - 1,
                dateSource[2] || 1,
                dateSource[3] || 0,
                dateSource[4] || 0,
                dateSource[5] || 0
            );
        } else {
            date = new Date(dateSource);
        }

        if (isNaN(date.getTime())) return '';

        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* --- BOUTON CLOCHE --- */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Notifications"
            >
                <FaBell size={20} className={unreadCount > 0 && !isOpen ? "animate-[wiggle_1s_ease-in-out_infinite]" : ""} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* --- MENU DÉROULANT --- */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
                    
                    {/* Header du menu */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider">Notifications</h3>
                        
                        <div className="flex items-center gap-2">
                            {aDesNotificationsLues && (
                                <button
                                    onClick={handleBalayerLues}
                                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-0"
                                >
                                    Balayer les lues
                                </button>
                            )}

                            {unreadCount > 0 && (
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full">
                                    {unreadCount} non lues
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Zone de contenu / Liste des notifications */}
                    <div className="max-h-[440px] overflow-y-auto">
                        {isLoading && notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">
                                Chargement de vos notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <p className="text-sm font-bold">Aucune notification</p>
                                <p className="text-xs mt-1 text-slate-400">Vous êtes complètement à jour !</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notif) => {
                                    const isExpanded = !!expandedNotifs[notif.id];
                                    const aUneActionRedirection = !!(notif.typeAction && notif.referenceId);

                                    return (
                                        <div 
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`group w-full p-4 flex gap-4 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0 items-start cursor-pointer ${
                                                notif.lue 
                                                ? 'bg-white dark:bg-slate-900 opacity-60' 
                                                : 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                            }`}
                                        >
                                            {/* Icône illustrative gauche dynamique */}
                                            <div className={`mt-1 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-colors ${notif.lue ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'}`}>
                                                {obtenirIconeAction(notif.typeAction)}
                                            </div>
                                            
                                            {/* Contenu textuel central */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm break-words transition-all ${notif.lue ? 'text-slate-500 dark:text-slate-400 line-through decoration-transparent' : 'text-slate-800 dark:text-white font-semibold'}`}>
                                                    {isExpanded || notif.message.length <= 85
                                                        ? notif.message 
                                                        : `${notif.message.substring(0, 85)}...`
                                                    }
                                                </p>
                                                
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {formaterDate(notif.date)}
                                                    </span>
                                                    {notif.typeAction && (
                                                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                            {notif.typeAction.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 🆕 BOUTON GÉNÉRIQUE : PLUS DE DÉTAILS */}
                                                <div className="mt-2.5">
                                                    <button
                                                        onClick={(e) => handleDetailsClick(notif, e)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors bg-transparent p-0 border-0 cursor-pointer outline-none"
                                                    >
                                                        <span>Plus de détails</span>
                                                        {aUneActionRedirection ? (
                                                            <FaArrowRight size={10} />
                                                        ) : (
                                                            isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Actions à droite (Statut + Bouton de suppression) */}
                                            <div className="flex flex-col items-center justify-between gap-3 self-stretch flex-shrink-0">
                                                <div className="flex items-center justify-center min-h-[16px]">
                                                    {!notif.lue ? (
                                                        <FaCircle className="text-indigo-500 animate-pulse" size={8} />
                                                    ) : (
                                                        <FaCheckCircle className="text-emerald-500" size={12} />
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => handleSupprimer(notif.id, e)}
                                                    className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus:outline-none border-0 bg-transparent cursor-pointer"
                                                    title="Supprimer cette notification"
                                                >
                                                    <FaTrashAlt size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaBox, FaCheckCircle, FaCircle, FaTrashAlt } from 'react-icons/fa'; // Importation de FaTrashAlt pour la suppression
import { notificationService } from '../services/notificationService';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // 1. Charger les notifications au montage et mettre en place le polling
    useEffect(() => {
        chargerNotifications();

        // Vérifier les nouvelles notifications toutes les 30 secondes
        const interval = setInterval(() => {
            chargerNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const chargerNotifications = async () => {
        try {
            const data = await notificationService.getMesNotifications();
            // On s'assure que data est bien un tableau
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erreur lors du chargement des notifications", error);
        }
    };

    // 2. Fermer le menu si on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 3. Marquer une notification comme lue
    const handleMarquerLu = async (id, estDejaLue) => {
        if (estDejaLue) return;

        try {
            await notificationService.marquerCommeLue(id);
            // Mise à jour locale immédiate pour la réactivité
            setNotifications(prev => prev.map(notif => 
                notif.id === id ? { ...notif, lue: true } : notif
            ));
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la notification", error);
        }
    };

    // 4. SUPPRESSION INDIVIDUELLE : Supprimer une notification unique
    const handleSupprimer = async (id, event) => {
        event.stopPropagation(); // Évite de déclencher le clic de marquage comme lu sur le parent
        try {
            await notificationService.supprimerNotification(id);
            // Filtrage local immédiat de la notification supprimée
            setNotifications(prev => prev.filter(notif => notif.id !== id));
        } catch (error) {
            console.error("Erreur lors de la suppression de la notification", error);
        }
    };

    // 5. BALAYAGE GLOBAL : Supprimer toutes les notifications lues d'un coup
    const handleBalayerLues = async () => {
        try {
            await notificationService.balayerNotificationsLues();
            // Garder uniquement les notifications non lues localement
            setNotifications(prev => prev.filter(notif => !notif.lue));
        } catch (error) {
            console.error("Erreur lors du balayage des notifications lues", error);
        }
    };

    // Calculer le nombre de notifications non lues
    const unreadCount = notifications.filter(n => !n.lue).length;

    // Vérifier s'il y a au moins une notification lue pour afficher le bouton de nettoyage
    const aDesNotificationsLues = notifications.some(n => n.lue);

    // Formater la date (Gère le format ISO string et le format tableau [YYYY, MM, DD...])
    const formaterDate = (dateSource) => {
        if (!dateSource) return '';
        
        let date;
        if (Array.isArray(dateSource)) {
            // Spring Boot renvoie parfois [2026, 5, 15, 14, 30]
            date = new Date(dateSource[0], dateSource[1] - 1, dateSource[2], dateSource[3], dateSource[4]);
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
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* --- MENU DÉROULANT --- */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider">Notifications</h3>
                        
                        <div className="flex items-center gap-2">
                            {/* AJOUT : Bouton dynamique pour balayer le contenu lu */}
                            {aDesNotificationsLues && (
                                <button
                                    onClick={handleBalayerLues}
                                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
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

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <p className="text-sm font-bold">Aucune notification</p>
                                <p className="text-xs mt-1">Vous êtes à jour !</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id}
                                        className={`group w-full p-4 flex gap-4 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0 items-start ${
                                            notif.lue 
                                            ? 'bg-white dark:bg-slate-900 opacity-70' 
                                            : 'bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/40'
                                        }`}
                                    >
                                        {/* Zone cliquable principale pour marquer comme lu */}
                                        <div 
                                            onClick={() => handleMarquerLu(notif.id, notif.lue)}
                                            className="flex flex-1 gap-4 cursor-pointer"
                                        >
                                            <div className={`mt-1 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${notif.lue ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                <FaBox size={14} />
                                            </div>
                                            
                                            <div className="flex-1">
                                                <p className={`text-sm ${notif.lue ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-white font-bold'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                                    {formaterDate(notif.date)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Colonne latérale d'actions de la notification */}
                                        <div className="flex flex-col items-center justify-between gap-3 self-stretch">
                                            {/* Indicateur Lu / Non Lu */}
                                            <div onClick={() => handleMarquerLu(notif.id, notif.lue)} className="cursor-pointer">
                                                {!notif.lue ? (
                                                    <FaCircle className="text-indigo-500" size={8} />
                                                ) : (
                                                    <FaCheckCircle className="text-emerald-500" size={12} />
                                                )}
                                            </div>

                                            {/* AJOUT : Bouton de suppression individuelle (invisible par défaut, visible au survol de la ligne grâce à group-hover) */}
                                            <button
                                                onClick={(e) => handleSupprimer(notif.id, e)}
                                                className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                                                title="Supprimer cette notification"
                                            >
                                                <FaTrashAlt size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
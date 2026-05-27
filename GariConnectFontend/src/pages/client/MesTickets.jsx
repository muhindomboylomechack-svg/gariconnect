import React, { useEffect, useState } from 'react';
// Import de l'instance API centralisée
import api from '../../services/api'; 
import TicketCard from './TicketCard';
import { FaBus, FaArrowLeft, FaTicketAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MesTickets = () => {
    const { t } = useTranslation();
    const [mesReservations, setMesReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyTickets = async () => {
            try {
                // Utilisation de l'instance api : le token est injecté via l'intercepteur
                // et l'URL est préfixée par la base configurée dans api.js
                const response = await api.get('/reservations/mes-reservations');
                
                setMesReservations(response.data);
            } catch (err) {
                console.error("Erreur lors de la récupération:", err);
                setError(t('checkout.error_load'));
            } finally {
                setLoading(false);
            }
        };
        fetchMyTickets();
    }, [t]);

    // 1. Écran de chargement professionnel
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-solid"></div>
                    <FaBus className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 animate-pulse" />
                </div>
                <p className="mt-6 text-slate-400 font-black uppercase tracking-widest text-xs italic">
                    {t('eval.sending').replace('...', '')} 
                    ...
                </p>
            </div>
        );
    }

    // 2. Écran vide ou erreur (Style épuré)
    if (error || mesReservations.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-20 px-6 text-center">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                    <div className="bg-blue-50 dark:bg-slate-800 p-8 rounded-full w-24 h-24 mx-auto flex items-center justify-center text-blue-500 mb-6">
                        <FaTicketAlt size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">
                        {mesReservations.length === 0 ? "Aucun voyage prévu ?" : t('checkout.error_load')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                        Vos réservations et tickets confirmés apparaîtront ici pour faciliter votre embarquement.
                    </p>
                    <Link to="/client/dashboard" className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105">
                        {t('checkout.confirm_button')}
                    </Link>
                </div>
            </div>
        );
    }

    // 3. Liste des Tickets (Design Moderne)
    return (
        <div className="max-w-4xl mx-auto px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header de la page */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                    <Link to="/client/dashboard" className="inline-flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest mb-4 hover:gap-4 transition-all">
                        <FaArrowLeft /> {t('back')}
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Mes Billets <span className="text-blue-600">.</span>
                    </h1>
                </div>
                <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest leading-none mb-1">Total Voyages</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{mesReservations.length}</p>
                </div>
            </div>

            {/* Grille de tickets */}
            <div className="grid gap-6">
                {mesReservations.map((res, index) => (
                    <div 
                        key={res.id} 
                        className="animate-in fade-in zoom-in duration-500" 
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <TicketCard 
                            ticket={{
                                depart: res.trajet?.depart || "N/A",
                                destination: res.trajet?.destination || "N/A",
                                date: res.trajet?.dateDepart || "--/--/--",
                                heure: res.trajet?.heureDepart || "--:--",
                                siege: res.numeroSiege ? `${t('checkout.your_seat')} ${res.numeroSiege}` : "Non assigné",
                                code: res.codeTicket || "EN ATTENTE", 
                                prix: res.trajet?.prix || "0",
                                statut: res.statutPaiement || 'ATTENTE',
                                nomPassager: res.user?.nom || "Voyageur GariConnect",
                                agence: res.trajet?.agence?.nom || "Agence GariConnect"
                            }} 
                        />
                    </div>
                ))}
            </div>

            {/* Message de fin */}
            <p className="text-center mt-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Présentez votre QR Code ou code ticket à l'embarquement
            </p>
        </div>
    );
};

export default MesTickets;
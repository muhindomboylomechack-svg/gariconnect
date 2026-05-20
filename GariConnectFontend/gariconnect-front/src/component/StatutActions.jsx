import React, { useState } from 'react';
import { FaTruck, FaCheckDouble, FaBoxOpen, FaClock, FaSpinner } from 'react-icons/fa';
import { courrierService } from '../services/courrierService';

const StatutActions = ({ courrierId, statutActuel, onUpdate }) => {
    const [loading, setLoading] = useState(false);

    // Configuration des boutons selon les statuts gérés dans ton Backend
    const config = {
        'EN_ATTENTE': { label: 'Attente', color: 'bg-slate-500', icon: <FaClock /> },
        'EN_ROUTE': { label: 'En Route', color: 'bg-blue-600', icon: <FaTruck /> },
        'ARRIVE': { label: 'Arrivé', color: 'bg-indigo-600', icon: <FaCheckDouble /> },
        'LIVRE': { label: 'Livré', color: 'bg-emerald-600', icon: <FaCheckDouble /> }
    };

    const handleUpdate = async (nouveauStatut) => {
        if (nouveauStatut === statutActuel) return;
        
        setLoading(true);
        try {
            // 1. Appel API au Backend
            await courrierService.updateStatut(courrierId, nouveauStatut);
            
            // 2. Notifier le parent (CourriersPage) qu'il doit rafraîchir la liste
            if (onUpdate) onUpdate();
            
            console.log(`Statut ${nouveauStatut} activé pour le colis ${courrierId}`);
        } catch (error) {
            console.error("Erreur lors du changement de statut", error);
            alert("Impossible de mettre à jour le statut.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {Object.entries(config).map(([key, value]) => (
                <button
                    key={key}
                    disabled={loading || statutActuel === key}
                    onClick={() => handleUpdate(key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200
                        ${statutActuel === key 
                            ? `${value.color} text-white shadow-md scale-105 ring-2 ring-offset-1 ring-white/20` 
                            : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}
                        ${loading && statutActuel !== key ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    {loading && statutActuel !== key ? <FaSpinner className="animate-spin" /> : value.icon}
                    <span className="hidden md:inline">{value.label}</span>
                </button>
            ))}
        </div>
    );
};

export default StatutActions;
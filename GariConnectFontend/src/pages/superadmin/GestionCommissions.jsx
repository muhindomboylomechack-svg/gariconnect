import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    FaHandshake, FaPercentage, FaCheckCircle, 
    FaUserTie, FaSync, FaCrown, FaShieldAlt 
} from 'react-icons/fa';

const GestionCommissions = () => {
    const [agences, setAgences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        chargerAgences();
    }, []);

    const chargerAgences = async () => {
        try {
            // Utilisation de la route admin pour récupérer les utilisateurs
            const response = await api.get('/admin/users');
            // On s'assure d'inclure les nouveaux rôles définis dans le backend
            const uniquementAgences = response.data.filter(u => 
                ['AGENCE', 'AGENCY_ADMIN', 'AGENCY_MANAGER'].includes(u.role)
            );
            setAgences(uniquementAgences);
        } catch (error) {
            console.error("Erreur lors du chargement des agences", error);
        } finally {
            setLoading(false);
        }
    };

    // 🚀 NOUVELLE FONCTION : Changer le type d'abonnement (SaaS)
    const modifierAbonnement = async (id, nouveauType) => {
        setUpdatingId(`abonnement-${id}`);
        try {
            await api.put(`/admin/agences/${id}/abonnement`, { typeAbonnement: nouveauType });
            chargerAgences(); // Rafraîchir pour voir les changements
        } catch (error) {
            console.error("Erreur abonnement:", error);
            alert(error.response?.data?.message || "Erreur lors de la modification du plan d'abonnement.");
        } finally {
            setUpdatingId(null);
        }
    };

    const modifierTaux = async (id, nouveauTaux) => {
        if (!nouveauTaux || nouveauTaux < 0 || nouveauTaux > 100) {
            alert("Veuillez saisir un taux valide entre 0 et 100");
            return;
        }

        setUpdatingId(`taux-${id}`);
        try {
            await api.patch(`/users/${id}/commission`, { taux: parseFloat(nouveauTaux) });
            chargerAgences(); 
        } catch (error) {
            alert("Erreur lors de la modification du taux");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col justify-center items-center">
            <FaSync className="text-blue-600 text-4xl animate-spin mb-4" />
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-widest">Initialisation des contrats...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            
            {/* EN-TÊTE DE PAGE */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        Contrats & <span className="text-blue-600">Licences</span>
                    </h1>
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">
                        Gestion des abonnements et commissions partenaires
                    </p>
                </div>
                <div className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex gap-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
                        <p className="text-xl font-black text-blue-600">{agences.length}</p>
                    </div>
                    <div className="border-l border-slate-200 dark:border-slate-800 pl-6">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1 flex items-center gap-1"><FaCrown/> Licences</p>
                        <p className="text-xl font-black text-amber-500">{agences.filter(a => a.typeAbonnement === 'DEFINITIF').length}</p>
                    </div>
                </div>
            </div>

            {/* GRILLE DES AGENCES */}
            <div className="grid gap-6">
                {agences.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] text-center shadow-sm border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <FaUserTie className="text-slate-200 dark:text-slate-800 text-6xl mx-auto mb-6" />
                        <p className="text-slate-400 dark:text-slate-500 font-bold italic tracking-tight">
                            Aucune agence partenaire n'est enregistrée dans la base de données.
                        </p>
                    </div>
                ) : (
                    agences.map((agence) => {
                        const isDefinitif = agence.typeAbonnement === 'DEFINITIF';

                        return (
                            <div 
                                key={agence.id} 
                                className={`bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[3rem] shadow-xl shadow-slate-200/40 dark:shadow-none border flex flex-col xl:flex-row items-center justify-between gap-8 transition-all group ${isDefinitif ? 'border-amber-500/30 hover:border-amber-500' : 'border-slate-100 dark:border-slate-800 hover:border-blue-500'}`}
                            >
                                {/* INFO AGENCE */}
                                <div className="flex items-center gap-6 w-full xl:w-auto">
                                    <div className="relative">
                                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl group-hover:rotate-3 transition-transform ${isDefinitif ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-slate-800 to-slate-950 dark:from-blue-600 dark:to-indigo-700'}`}>
                                            {agence.nom.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white">
                                            <FaCheckCircle size={12} />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic">{agence.nom}</h2>
                                        <p className="text-sm text-slate-400 dark:text-slate-500 font-bold mb-3 tracking-tight">{agence.email}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black rounded-full uppercase tracking-widest">
                                                ID: #{agence.id}
                                            </span>
                                            {isDefinitif && (
                                                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black rounded-full uppercase tracking-widest border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                                    <FaCrown/> Client Premium
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* CONTRÔLES D'ABONNEMENT ET COMMISSION */}
                                <div className="flex flex-col md:flex-row items-center gap-6 w-full xl:w-auto">
                                    
                                    {/* TOGGLE PLAN SAAS */}
                                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center w-full md:w-auto">
                                        <button 
                                            onClick={() => modifierAbonnement(agence.id, 'COMMISSION')}
                                            disabled={updatingId === `abonnement-${agence.id}`}
                                            className={`flex-1 md:w-40 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isDefinitif ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        >
                                            Par Commission
                                        </button>
                                        <button 
                                            onClick={() => modifierAbonnement(agence.id, 'DEFINITIF')}
                                            disabled={updatingId === `abonnement-${agence.id}`}
                                            className={`flex-1 md:w-40 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isDefinitif ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        >
                                            <FaCrown/> Définitif
                                        </button>
                                    </div>

                                    {/* MODULE DE COMMISSION (Conditionnel) */}
                                    <div className={`flex flex-col sm:flex-row items-center gap-6 p-6 rounded-[2.5rem] border w-full md:w-auto transition-all ${isDefinitif ? 'bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                                        
                                        {isDefinitif ? (
                                            <div className="flex items-center gap-4 px-4 py-2">
                                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-500 rounded-2xl flex items-center justify-center text-xl">
                                                    <FaShieldAlt />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Licence Active</p>
                                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">Exempté de commission</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-center sm:text-right sm:pr-6 sm:border-r border-slate-200 dark:border-slate-700">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center sm:justify-end gap-2">
                                                        <FaPercentage className="text-blue-500" /> Taux Actuel
                                                    </p>
                                                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                                                        {agence.tauxCommission || 10}<span className="text-blue-600">%</span>
                                                    </p>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            placeholder="--"
                                                            className="w-24 p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 dark:focus:border-blue-600 font-black text-center text-slate-800 dark:text-white transition-all shadow-inner"
                                                            defaultValue={agence.tauxCommission}
                                                            id={`input-${agence.id}`}
                                                        />
                                                        <span className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-300 dark:text-slate-600 font-black">%</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => modifierTaux(agence.id, document.getElementById(`input-${agence.id}`).value)}
                                                        disabled={updatingId === `taux-${agence.id}`}
                                                        className="bg-slate-900 dark:bg-blue-600 text-white h-[56px] px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                                                    >
                                                        {updatingId === `taux-${agence.id}` ? (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        ) : (
                                                            <FaHandshake className="text-sm" />
                                                        )}
                                                        Mettre à jour
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default GestionCommissions;
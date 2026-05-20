import React, { useState, useEffect, useMemo } from 'react';
import { 
    FaBus, FaPlus, FaEdit, FaTrash, FaTimes, 
    FaSave, FaSearch, FaCheckCircle, FaTools, 
    FaRoute, FaInfoCircle 
} from 'react-icons/fa';
import api from '../../services/api';

const GestionFlotte = () => {
    const [vehicules, setVehicules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatut, setFilterStatut] = useState("Tous");
    
    const initialFormState = {
        id: null,
        marque: '',
        modele: '',
        plaque_immatriculation: '', 
        capacite: '',
        statut: 'Disponible'
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchVehicules = async () => {
        try {
            setLoading(true);
            const response = await api.get('/vehicules/agence');
            setVehicules(response.data);
        } catch (error) {
            console.error("Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicules();
    }, []);

    const vehiculesFiltrés = useMemo(() => {
        return vehicules.filter(v => {
            const matchSearch = 
                v.marque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.modele?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.plaque_immatriculation?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatut = filterStatut === "Tous" || v.statut === filterStatut;
            return matchSearch && matchStatut;
        });
    }, [vehicules, searchTerm, filterStatut]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await api.put(`/vehicules/${formData.id}`, formData);
            } else {
                await api.post('/vehicules', formData);
            }
            setShowModal(false);
            fetchVehicules();
        } catch (error) {
            alert(error.response?.data?.message || "Erreur lors de l'enregistrement");
        }
    };

    const deleteVehicule = async (id) => {
        if (window.confirm("Voulez-vous vraiment retirer ce véhicule de la flotte ?")) {
            try {
                await api.delete(`/vehicules/${id}`);
                fetchVehicules();
            } catch (error) {
                alert("Erreur lors de la suppression");
            }
        }
    };

    const getStatusStyle = (statut) => {
        switch (statut) {
            case 'Disponible': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400';
            case 'En maintenance': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400';
            case 'En voyage': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                        <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-500/20">
                            <FaBus className="text-white text-2xl" />
                        </div>
                        Gestion de la Flotte
                    </h1>
                    <p className="text-slate-400 font-bold text-sm mt-2 ml-1">Contrôlez l'état et la disponibilité de vos bus</p>
                </div>
                <button 
                    onClick={() => { setFormData(initialFormState); setShowModal(true); }} 
                    className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[2rem] font-black shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                    <FaPlus /> Ajouter un Bus
                </button>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total', count: vehicules.length, icon: FaBus, color: 'blue' },
                    { label: 'En Route', count: vehicules.filter(v => v.statut === 'En voyage').length, icon: FaRoute, color: 'blue' },
                    { label: 'Disponibles', count: vehicules.filter(v => v.statut === 'Disponible').length, icon: FaCheckCircle, color: 'emerald' },
                    { label: 'Maintenance', count: vehicules.filter(v => v.statut === 'En maintenance').length, icon: FaTools, color: 'rose' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className={`p-3 bg-${stat.color}-50 dark:bg-${stat.color}-500/10 text-${stat.color}-600 rounded-2xl`}>
                            <stat.icon />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{stat.count}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 w-full">
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher par plaque, marque, modèle..." 
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-[2rem] font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
                <select 
                    className="w-full md:w-64 p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-[2rem] font-black text-sm outline-none cursor-pointer" 
                    value={filterStatut} 
                    onChange={e => setFilterStatut(e.target.value)}
                >
                    <option value="Tous">Tous les statuts</option>
                    <option value="Disponible">Disponible</option>
                    <option value="En maintenance">En maintenance</option>
                    <option value="En voyage">En voyage</option>
                </select>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Véhicule</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest text-center">Immatriculation</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest text-center">Capacité</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest text-center">Statut</th>
                                <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {vehiculesFiltrés.map(v => (
                                <tr key={v.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center font-black">
                                                <FaBus />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 dark:text-slate-100">{v.marque}</p>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{v.modele}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center font-mono">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-black text-sm border border-slate-200 dark:border-slate-700">
                                            {v.plaque_immatriculation}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center font-black text-slate-600 dark:text-slate-400">
                                        {v.capacite} places
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(v.statut)}`}>
                                            {v.statut}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => { setFormData(v); setShowModal(true); }} 
                                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                            >
                                                <FaEdit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => deleteVehicule(v.id)} 
                                                className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {vehiculesFiltrés.length === 0 && !loading && (
                    <div className="py-24 text-center">
                        <FaBus className="mx-auto text-5xl text-slate-100 dark:text-slate-800 mb-4" />
                        <p className="text-slate-400 font-black italic">Aucun bus ne correspond à votre recherche.</p>
                    </div>
                )}
            </div>

            {/* Modal Re-stylé */}
            {showModal && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h2 className="font-black text-2xl text-slate-800 dark:text-white tracking-tighter uppercase">
                                    {formData.id ? "Détails du Bus" : "Ajout Flotte"}
                                </h2>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Configuration Véhicule</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-rose-500 rounded-full shadow-sm transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-10 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Marque</label>
                                    <input required placeholder="Ex: Toyota" className="w-full p-4 bg-slate-100 dark:bg-slate-800 border-none rounded-[1.5rem] font-bold text-slate-700 dark:text-white outline-none focus:ring-4 ring-blue-500/5 transition-all" value={formData.marque} onChange={e => setFormData({...formData, marque: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Modèle</label>
                                    <input required placeholder="Ex: Coaster" className="w-full p-4 bg-slate-100 dark:bg-slate-800 border-none rounded-[1.5rem] font-bold text-slate-700 dark:text-white outline-none focus:ring-4 ring-blue-500/5 transition-all" value={formData.modele} onChange={e => setFormData({...formData, modele: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Plaque d'immatriculation</label>
                                <input required placeholder="Ex: 1234AB01" className="w-full p-4 bg-slate-100 dark:bg-slate-800 border-none rounded-[1.5rem] font-black text-slate-700 dark:text-white outline-none focus:ring-4 ring-blue-500/5 font-mono uppercase transition-all" value={formData.plaque_immatriculation} onChange={e => setFormData({...formData, plaque_immatriculation: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">Capacité (Assises)</label>
                                    <input required type="number" placeholder="Places" className="w-full p-4 bg-slate-100 dark:bg-slate-800 border-none rounded-[1.5rem] font-black text-slate-700 dark:text-white outline-none focus:ring-4 ring-blue-500/5 transition-all" value={formData.capacite} onChange={e => setFormData({...formData, capacite: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-widest">État actuel</label>
                                    <select className="w-full p-4 bg-slate-100 dark:bg-slate-800 border-none rounded-[1.5rem] font-black text-slate-700 dark:text-white outline-none cursor-pointer appearance-none" value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}>
                                        <option value="Disponible">Disponible</option>
                                        <option value="En maintenance">En maintenance</option>
                                        <option value="En voyage">En voyage</option>
                                    </select>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 mt-6 active:scale-95">
                                <FaSave /> {formData.id ? "METTRE À JOUR LA FLOTTE" : "VALIDER L'AJOUT"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionFlotte;
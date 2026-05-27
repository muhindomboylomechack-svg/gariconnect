import React, { useState, useEffect } from 'react';
import { 
    FaBox, FaSearch, FaPlus, FaTimes, FaTrash, FaEdit, 
    FaEnvelopeOpenText, FaWeightHanging,
    FaCalendarAlt, FaCheckCircle, FaSpinner
} from 'react-icons/fa';
// 1. Import de l'instance API centralisée
import api from '../../services/api'; 
// ✅ Importation du nouveau composant d'action
import StatutActions from '../../component/StatutActions';

const CourriersPage = () => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [trajets, setTrajets] = useState([]);
    const [courriers, setCourriers] = useState([]); 
    
    const [selectedColis, setSelectedColis] = useState(null);
    const [formData, setFormData] = useState({
        nomExpediteur: '', telExpediteur: '', nomDestinataire: '',
        telDestinataire: '', description: '', prix: '', trajetId: '',
        type: 'COLIS' 
    });

    // L'URL en dur API_BASE a été supprimée

    useEffect(() => {
        fetchTrajets();
        fetchCourriers();
    }, []);

    // getAuthHeader n'est plus nécessaire car l'instance "api" ajoute le token automatiquement

    const fetchTrajets = async () => {
        try {
            // 2. Utilisation de l'instance "api"
            const res = await api.get('/trajets/mes-trajets');
            setTrajets(res.data);
        } catch (err) { console.error("Erreur trajets:", err); }
    };

    const fetchCourriers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/agences/courriers');
            setCourriers(Array.isArray(res.data) ? res.data : []);
        } catch (err) { 
            console.error("Erreur courriers:", err);
            setCourriers([]); 
        } finally { setLoading(false); }
    };

    const handleEdit = (colis) => {
        setSelectedColis(colis);
        setFormData({
            nomExpediteur: colis.nomExpediteur || '',
            telExpediteur: colis.telExpediteur || '',
            nomDestinataire: colis.nomDestinataire || '',
            telDestinataire: colis.telDestinataire || '',
            description: colis.description || '',
            prix: colis.prix || '',
            trajetId: colis.trajet?.id || '',
            type: colis.type || 'COLIS'
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if(window.confirm("Supprimer définitivement cet enregistrement ?")) {
            try {
                await api.delete(`/agences/courriers/${id}`);
                fetchCourriers();
            } catch (err) { alert("Erreur lors de la suppression"); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.trajetId) return alert("Veuillez sélectionner un trajet");
        
        setLoading(true);
        try {
            const payload = { 
                ...formData, 
                trajet: { id: parseInt(formData.trajetId) }, 
                prix: parseFloat(formData.prix) 
            };
            
            if (selectedColis) {
                await api.put(`/agences/courriers/${selectedColis.id}`, payload);
            } else {
                await api.post('/agences/courriers/envoyer', payload);
            }
            
            setShowModal(false);
            resetForm();
            fetchCourriers();
        } catch (err) { 
            alert(err.response?.data?.message || "Erreur d'enregistrement"); 
        } finally { setLoading(false); }
    };

    const resetForm = () => {
        setFormData({
            nomExpediteur: '', telExpediteur: '', nomDestinataire: '',
            telDestinataire: '', description: '', prix: '', trajetId: '', type: 'COLIS'
        });
        setSelectedColis(null);
    };

    const filteredCourriers = courriers.filter(c => 
        c.codeRetrait?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.nomDestinataire?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nomExpediteur?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* HEADER */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3">
                            <FaBox size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Gestion des Envois</h1>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">{filteredCourriers.length} enregistrements</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { resetForm(); setShowModal(true); }} 
                        className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"
                    >
                        <FaPlus /> Nouvel Envoi
                    </button>
                </div>

                {/* RECHERCHE */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <input 
                            type="text" 
                            placeholder="Rechercher un code, un expéditeur..." 
                            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 dark:text-white border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none shadow-sm transition-all font-bold text-sm" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <button onClick={fetchCourriers} className="p-4 bg-white dark:bg-slate-900 dark:text-white rounded-2xl shadow-sm hover:bg-slate-50 transition-all">
                        {loading ? <FaSpinner className="animate-spin text-blue-500" /> : <FaCheckCircle className="text-emerald-500" />}
                    </button>
                </div>

                {/* TABLEAU */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-6">Code</th>
                                    <th className="px-8 py-6">Expéditeur & Destinataire</th>
                                    <th className="px-8 py-6">Type d'envoi & Description</th>
                                    <th className="px-8 py-6">Statut (Action Agence)</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredCourriers.map((c) => (
                                    <tr key={c.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                        
                                        <td className="px-8 py-6 font-mono font-black text-blue-600 text-xs uppercase italic">
                                            {c.codeRetrait || `ID-${c.id}`}
                                        </td>
                                        
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black dark:text-white uppercase leading-none mb-1">
                                                {c.nomExpediteur} <span className="text-blue-500 mx-1">➔</span> {c.nomDestinataire}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded mt-2">
                                                <FaCalendarAlt className="text-red-500" size={10} /> 
                                                {c.trajet?.depart} ➔ {c.trajet?.destination} 
                                                <span className="text-blue-600 ml-1">[{c.trajet?.joursSemaine || 'Jour non défini'}]</span>
                                            </div>
                                        </td>
                                        
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider mb-2 ${
                                                c.type === 'COURRIER' 
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border border-indigo-100 dark:border-indigo-800' 
                                                : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 border border-orange-100 dark:border-orange-800'
                                            }`}>
                                                {c.type === 'COURRIER' ? <FaEnvelopeOpenText size={12}/> : <FaWeightHanging size={12}/>}
                                                {c.type}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium italic line-clamp-2 max-w-[200px]">
                                                {c.description || <span className="text-slate-300">Aucune description</span>}
                                            </div>
                                        </td>
                                        
                                        <td className="px-8 py-6">
                                            <StatutActions 
                                                courrierId={c.id} 
                                                statutActuel={c.statut} 
                                                onUpdate={fetchCourriers} 
                                            />
                                        </td>
                                        
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(c)} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><FaEdit size={14}/></button>
                                                <button onClick={() => handleDelete(c.id)} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><FaTrash size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL FORMULAIRE */}
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black dark:text-white italic uppercase tracking-tighter">
                                    {selectedColis ? "Mise à jour envoi" : "Nouveau Chargement"}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors"><FaTimes size={20}/></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, type: 'COLIS'})} 
                                        className={`p-5 rounded-2xl border-2 font-black uppercase text-[10px] flex flex-col items-center gap-2 transition-all ${formData.type === 'COLIS' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 opacity-60'}`}
                                    >
                                        <FaWeightHanging size={24}/> Colis / Marchandise
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, type: 'COURRIER'})} 
                                        className={`p-5 rounded-2xl border-2 font-black uppercase text-[10px] flex flex-col items-center gap-2 transition-all ${formData.type === 'COURRIER' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 opacity-60'}`}
                                    >
                                        <FaEnvelopeOpenText size={24}/> Courrier / Enveloppe
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 px-2">Infos Expéditeur</label>
                                        <input placeholder="Nom complet" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold outline-none border-none focus:ring-2 ring-blue-500" value={formData.nomExpediteur} onChange={e => setFormData({...formData, nomExpediteur: e.target.value})} required />
                                        <input placeholder="Téléphone" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold outline-none border-none focus:ring-2 ring-blue-500" value={formData.telExpediteur} onChange={e => setFormData({...formData, telExpediteur: e.target.value})} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 px-2">Infos Destinataire</label>
                                        <input placeholder="Nom complet" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold outline-none border-none focus:ring-2 ring-blue-500" value={formData.nomDestinataire} onChange={e => setFormData({...formData, nomDestinataire: e.target.value})} required />
                                        <input placeholder="Téléphone" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold outline-none border-none focus:ring-2 ring-blue-500" value={formData.telDestinataire} onChange={e => setFormData({...formData, telDestinataire: e.target.value})} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-2">Itinéraire & Jour de départ</label>
                                    <select value={formData.trajetId} className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-black uppercase text-[11px] outline-none cursor-pointer border-none focus:ring-2 ring-blue-500" onChange={e => setFormData({...formData, trajetId: e.target.value})} required>
                                        <option value="">-- Sélectionner un trajet --</option>
                                        {trajets.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.depart} ➔ {t.destination} [{t.joursSemaine || 'Jour non défini'}]
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-2">Description du contenu</label>
                                    <textarea 
                                        placeholder="Ex: Un carton de vêtements, chaussures, documents importants..." 
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl font-bold outline-none border-none focus:ring-2 ring-blue-500 h-24 resize-none" 
                                        value={formData.description} 
                                        onChange={e => setFormData({...formData, description: e.target.value})} 
                                        required
                                    />
                                </div>

                                <div className="bg-slate-900 dark:bg-blue-600 p-1.5 rounded-[1.8rem] flex items-center shadow-lg">
                                    <span className="px-6 text-white font-black text-[10px] uppercase">Prix (FC)</span>
                                    <input type="number" className="flex-1 p-4 bg-white dark:bg-slate-900 dark:text-white rounded-[1.4rem] font-black text-right text-lg outline-none" value={formData.prix} onChange={e => setFormData({...formData, prix: e.target.value})} required />
                                </div>

                                <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all text-xs shadow-xl shadow-blue-500/20 disabled:opacity-50">
                                    {loading ? "Traitement..." : selectedColis ? "Mettre à jour" : "Confirmer l'envoi"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourriersPage;
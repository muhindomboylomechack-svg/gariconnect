import React, { useState } from 'react';
import { FaSearch, FaBox, FaTruckLoading, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';
// Import de l'instance API centralisée
import api from '../../services/api'; 

const TrackingPage = () => {
    const [code, setCode] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!code) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Remplacement d'axios par api. Le point d'entrée public est géré avec l'URL de base dynamique.
            const res = await api.get(`/public/track/${code}`);
            setResult(res.data);
        } catch (err) {
            setError("Code de suivi invalide ou colis introuvable.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (statut) => {
        const steps = ['RECU', 'EN_ROUTE', 'ARRIVE', 'LIVRE'];
        return steps.indexOf(statut);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-20 px-4">
            <div className="w-full max-w-2xl text-center space-y-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        Suivre mon colis
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Entrez votre code de retrait pour localiser votre envoi.</p>
                </div>

                {/* Barre de recherche massive */}
                <form onSubmit={handleTrack} className="relative group">
                    <input 
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Ex: GC-XXXX-XXXX"
                        className="w-full p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border-none outline-none text-2xl font-black text-center text-blue-600 placeholder:text-slate-200 transition-all focus:ring-4 focus:ring-blue-500/20"
                    />
                    <button 
                        type="submit"
                        className="absolute right-4 top-4 bottom-4 px-8 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all"
                    >
                        {loading ? '...' : <FaSearch size={20}/>}
                    </button>
                </form>

                {error && <p className="text-red-500 font-black uppercase text-[10px] animate-bounce">{error}</p>}

                {/* Résultat du suivi */}
                {result && (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-10 duration-500 text-left">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut Actuel</span>
                                <h2 className="text-2xl font-black text-blue-600 uppercase italic">{result.statut}</h2>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</span>
                                <p className="font-bold dark:text-white uppercase">{result.trajet?.destination}</p>
                            </div>
                        </div>

                        {/* Barre de progression visuelle */}
                        <div className="relative flex justify-between items-center mb-10">
                            <div className="absolute h-1 bg-slate-100 dark:bg-slate-800 w-full top-1/2 -translate-y-1/2 z-0"></div>
                            <div 
                                className="absolute h-1 bg-blue-600 transition-all duration-1000 top-1/2 -translate-y-1/2 z-0"
                                style={{ width: `${(getStatusStep(result.statut) / 3) * 100}%` }}
                            ></div>
                            
                            {[
                                { id: 'RECU', icon: <FaBox /> },
                                { id: 'EN_ROUTE', icon: <FaTruckLoading /> },
                                { id: 'ARRIVE', icon: <FaMapMarkerAlt /> },
                                { id: 'LIVRE', icon: <FaCheckCircle /> }
                            ].map((step, index) => (
                                <div key={step.id} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                                        index <= getStatusStep(result.statut) ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>
                                        {step.icon}
                                    </div>
                                    <span className={`text-[8px] font-black mt-2 uppercase ${index <= getStatusStep(result.statut) ? 'text-blue-600' : 'text-slate-400'}`}>
                                        {step.id}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Expéditeur</p>
                                <p className="font-bold dark:text-white">{result.nomExpediteur}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Destinataire</p>
                                <p className="font-bold dark:text-white">{result.nomDestinataire}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackingPage;
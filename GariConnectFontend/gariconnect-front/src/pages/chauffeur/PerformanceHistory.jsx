import React, { useEffect, useState } from 'react';
import { FaStar, FaShieldAlt, FaClock } from 'react-icons/fa';
import axios from 'axios';

const PerformanceHistory = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                const token = localStorage.getItem('token'); 
                if (!token) {
                    setErrorMsg("Session expirée. Veuillez vous reconnecter.");
                    setLoading(false);
                    return;
                }

                const response = await axios.get('http://localhost:8080/api/evaluations/mon-rapport', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (error) {
                console.error("Erreur API:", error);
                setErrorMsg("Vous n'avez pas l'autorisation d'accéder à ces données.");
            } finally {
                setLoading(false);
            }
        };
        fetchPerformance();
    }, []);

    if (loading) return <div className="p-10 text-white animate-pulse">Chargement des analyses...</div>;
    if (errorMsg) return <div className="p-10 text-red-500 font-bold">{errorMsg}</div>;

    const metrics = [
        { label: "Ponctualité", value: `${data?.scorePonctualite || 0}%`, color: "text-blue-500", icon: <FaClock /> },
        { label: "Sécurité (Conduite)", value: `${data?.scoreSecurite || 0}%`, color: "text-emerald-500", icon: <FaShieldAlt /> },
        { label: "Note Client", value: `${data?.noteGlobale || 0}/5`, color: "text-yellow-500", icon: <FaStar /> },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black mb-6 text-white text-center md:text-left">Analyse de Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] text-center shadow-xl">
                        <div className={`mx-auto w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 ${m.color}`}>
                            {m.icon}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{m.label}</p>
                        <p className="text-3xl font-black mt-1 text-white">{m.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl">
                <h3 className="font-black text-sm uppercase tracking-widest mb-6 px-2 text-blue-500 border-b border-slate-800 pb-2">Commentaires récents</h3>
                <div className="space-y-6">
                    {data?.commentaires && data.commentaires.length > 0 ? (
                        data.commentaires.map((evalItem, i) => (
                            <div key={i} className="border-l-2 border-blue-500 pl-6 py-2 bg-slate-800/30 rounded-r-lg">
                                <div className="flex gap-1 text-yellow-500 mb-2">
                                    {[...Array(Math.floor(evalItem.noteGlobale || 0))].map((_, index) => (
                                        <FaStar key={index} size={10} />
                                    ))}
                                </div>
                                <p className="text-sm italic text-slate-300">"{evalItem.commentaire || "Pas de commentaire laissé"}"</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase mt-2">
                                    — Passager du {evalItem.dateEvaluation ? new Date(evalItem.dateEvaluation).toLocaleDateString() : "Date inconnue"}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm italic px-2">Aucun avis reçu pour le moment.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PerformanceHistory;
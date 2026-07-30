import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FaBus, FaCheck, FaRedo, FaTimes, FaUser, FaTicketAlt } from 'react-icons/fa';
import chauffeurService from '../../services/chauffeurService'; 

const ScannerTicket = ({ onFermer }) => {
    const [ticketInfo, setTicketInfo] = useState(null); // Stocke les données du ticket après le scan
    const [resultat, setResultat] = useState({ message: '', type: '' });
    const [isScanning, setIsScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const scannerRef = useRef(null);

    // 🔊 Effets sonores
    const playSound = (type) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } else {
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                osc.frequency.setValueAtTime(146.83, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {
            console.log("Audio non pris en charge", e);
        }
    };

    useEffect(() => {
        initScanner();
        return () => stopScanner();
    }, []);

    const initScanner = () => {
        setIsScanning(true);
        setTicketInfo(null);
        setResultat({ message: '', type: '' });

        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [0]
        }, false);

        scanner.render(
            (decodedText) => {
                if (decodedText) {
                    stopScanner();
                    setIsScanning(false);
                    rechercherTicket(decodedText);
                }
            },
            (error) => {}
        );

        scannerRef.current = scanner;
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(err => console.error("Erreur nettoyage caméra", err));
            scannerRef.current = null;
        }
    };

    // 🔍 ÉTAPE 1 : Récupération des infos du ticket au scan
    const rechercherTicket = async (rawData) => {
        setLoading(true);
        
        let codeTicketFinal = rawData;
        try {
            const parsedData = JSON.parse(rawData);
            codeTicketFinal = parsedData.ticketCode || parsedData.codeTicket || rawData;
        } catch (e) {
            codeTicketFinal = rawData;
        }

        try {
            // Appel pour LIRE les infos sans valider
            const response = await chauffeurService.getTicketInfo(codeTicketFinal);
            setTicketInfo(response || { codeTicket: codeTicketFinal }); // Fallback si données partielles
            playSound('success');
        } catch (err) {
            playSound('error');
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Ticket introuvable ou invalide";
            setResultat({ message: errorMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 🖱️ ÉTAPE 2 : Le chauffeur valide l'embarquement
    const validerEmbarquementDirect = async () => {
        if (!ticketInfo) return;
        setUpdating(true);
        setResultat({ message: '', type: '' });

        const code = ticketInfo.codeTicket || ticketInfo.ticketCode;

        try {
            // Appel API (votre route POST) pour valider l'embarquement
            const response = await chauffeurService.validerPassager(code);
            
            playSound('success');
            setResultat({ 
                message: response?.message || 'Passager validé et embarqué avec succès !', 
                type: 'success' 
            });
            
            setTicketInfo(prev => ({ ...prev, statut: 'EMBARQUE' }));

            // Optionnel : on ferme la modale au bout de 2.5 secondes
            setTimeout(() => {
                onFermer();
            }, 2500);

        } catch (err) {
            playSound('error');
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Erreur lors de la validation";
            setResultat({ message: errorMsg, type: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    const relancerScanner = () => {
        stopScanner();
        initScanner();
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-200">
            
            {/* Barre d'en-tête */}
            <div className="flex justify-between items-center mb-6 max-w-md mx-auto w-full">
                <button 
                    onClick={onFermer} 
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <FaTimes className="inline mr-1" /> Retour
                </button>
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <FaBus className="text-indigo-600" /> Embarquement
                </h3>
                <div className="w-16"></div>
            </div>

            {/* Zone du Scanner */}
            {isScanning && (
                <div className="w-full max-w-md mx-auto rounded-3xl border-4 border-indigo-600 shadow-2xl relative bg-black p-4 text-slate-800">
                    <div id="reader" className="w-full bg-white rounded-2xl overflow-hidden"></div>
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500 animate-bounce shadow-[0_0_8px_rgba(239,68,68,1)] pointer-events-none"></div>
                </div>
            )}

            {/* Chargement de la lecture */}
            {loading && (
                <div className="mt-8 text-center max-w-md mx-auto w-full p-6 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl font-bold text-sm animate-pulse">
                    Lecture du ticket en cours...
                </div>
            )}

            {/* Affichage des Infos du Ticket après Scan */}
            {!loading && ticketInfo && (
                <div className="max-w-md mx-auto w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left shadow-xl space-y-4">
                        
                        {/* Infos de base */}
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Code Billet</p>
                                <p className="text-lg font-mono font-black text-indigo-600 dark:text-indigo-400">
                                    {ticketInfo.codeTicket || ticketInfo.ticketCode}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                ticketInfo.statut === 'EMBARQUE' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                                {ticketInfo.statut || 'EN ATTENTE'}
                            </span>
                        </div>

                        {/* Détails du passager (Adapté selon votre objet retourné par Spring Boot) */}
                        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                            {ticketInfo.nomPassager && (
                                <p className="flex items-center gap-2 font-semibold">
                                    <FaUser className="text-slate-400" /> Passager : <span className="font-bold text-slate-900 dark:text-white">{ticketInfo.nomPassager}</span>
                                </p>
                            )}
                            {ticketInfo.placesAchetees && (
                                <p className="flex items-center gap-2 font-semibold">
                                    <FaTicketAlt className="text-slate-400" /> Siège(s) : <span className="font-bold text-slate-900 dark:text-white">{ticketInfo.placesAchetees}</span>
                                </p>
                            )}
                        </div>

                        {/* Message de succès ou d'erreur après validation */}
                        {resultat.message && (
                            <div className={`p-3 rounded-xl text-center text-xs font-bold ${
                                resultat.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                                {resultat.message}
                            </div>
                        )}

                        {/* BOUTON D'ACTION : Faire passer le statut à EMBARQUÉ */}
                        {ticketInfo.statut !== 'EMBARQUE' ? (
                            <button
                                onClick={validerEmbarquementDirect}
                                disabled={updating}
                                className="w-full py-4 px-4 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                <FaCheck className="text-lg" />
                                {updating ? 'Validation en cours...' : 'Valider et Embarquer'}
                            </button>
                        ) : (
                            <div className="text-center py-2 text-emerald-600 font-black text-xs uppercase tracking-wider">
                                ✅ Client déjà embarqué
                            </div>
                        )}
                    </div>

                    {/* Bouton pour scanner un nouveau billet */}
                    <button
                        onClick={relancerScanner}
                        className="w-full py-3.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        <FaRedo /> Scanner un autre ticket
                    </button>
                </div>
            )}

            {/* Affichage des Erreurs de Scan */}
            {!loading && resultat.type === 'error' && !ticketInfo && (
                <div className="max-w-md mx-auto w-full mt-6 space-y-4">
                    <div className="p-4 bg-rose-100 text-rose-800 rounded-2xl text-center font-bold text-sm">
                        ❌ {resultat.message}
                    </div>
                    <button
                        onClick={relancerScanner}
                        className="w-full py-3.5 px-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2"
                    >
                        <FaRedo /> Réessayer le scan
                    </button>
                </div>
            )}
        </div>
    );
};

export default ScannerTicket;
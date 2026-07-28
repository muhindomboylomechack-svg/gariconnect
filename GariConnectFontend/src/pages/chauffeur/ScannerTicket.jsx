import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import chauffeurService from '../../services/chauffeurService'; 

const ScannerTicket = ({ onFermer }) => {
    const [resultat, setResultat] = useState({ message: '', type: '', details: null });
    const [isScanning, setIsScanning] = useState(true);
    const [loading, setLoading] = useState(false);
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
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Ré5
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // La5
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } else {
                osc.frequency.setValueAtTime(220, ctx.currentTime); // La3
                osc.frequency.setValueAtTime(146.83, ctx.currentTime + 0.15); // Ré3
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {
            console.log("Audio non pris en charge ou bloqué par le navigateur", e);
        }
    };

    useEffect(() => {
        // Initialisation du scanner natif sur l'élément HTML avec l'id "reader"
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [0] // Uniquement caméra arrière
        }, false);

        scanner.render(
            (decodedText) => {
                if (decodedText) {
                    scanner.clear();
                    setIsScanning(false);
                    handleScan(decodedText);
                }
            },
            (error) => {}
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Erreur nettoyage caméra", err));
            }
        };
    }, []);

    const handleScan = async (rawData) => {
        setLoading(true);
        setResultat({ message: '', type: '', details: null });

        // 1. Extraction des données JSON du QR code si présentes
        let codeTicketFinal = rawData;
        try {
            const parsedData = JSON.parse(rawData);
            codeTicketFinal = parsedData.ticketCode || parsedData.codeTicket || parsedData.ticketId || rawData;
        } catch (e) {
            // rawData est déjà le code du ticket sous forme de chaîne simple
            codeTicketFinal = rawData;
        }

        // 2. Appel du service backend
        try {
            const response = await chauffeurService.validerPassager(codeTicketFinal);
            
            playSound('success');
            setResultat({ 
                message: response?.data?.message || 'Passager validé et statut mis à jour (EMBARQUÉ) !', 
                type: 'success',
                details: response?.data || { ticketCode: codeTicketFinal }
            });

            // Fermeture automatique après validation réussie
            setTimeout(() => {
                onFermer(); 
            }, 2500);

        } catch (err) {
            playSound('error');
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data || "Ticket invalide, déjà utilisé ou non payé";
            setResultat({ 
                message: `❌ Erreur : ${errorMsg}`, 
                type: 'error',
                details: null 
            });
        } finally {
            setLoading(false);
        }
    };

    // 🔄 Fonction pour relancer le scanner en cas d'échec sans recharger la page
    const relancerScanner = () => {
        setResultat({ message: '', type: '', details: null });
        setIsScanning(true);
        
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [0]
        }, false);

        scanner.render(
            (decodedText) => {
                if (decodedText) {
                    scanner.clear();
                    setIsScanning(false);
                    handleScan(decodedText);
                }
            },
            (error) => {}
        );

        scannerRef.current = scanner;
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-200">
            
            {/* Barre d'en-tête */}
            <div className="flex justify-between items-center mb-6 max-w-md mx-auto w-full">
                <button 
                    onClick={onFermer} 
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Retour
                </button>
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Contrôle d'Embarquement
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

            {/* Chargement lors de la requête API */}
            {loading && (
                <div className="mt-8 text-center max-w-md mx-auto w-full p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl font-bold text-sm animate-pulse">
                    Validation du ticket et mise à jour du statut...
                </div>
            )}

            {/* Notifications / Résultats */}
            {resultat.message && (
                <div className="max-w-md mx-auto w-full mt-6">
                    <div className={`p-5 rounded-2xl text-center font-bold text-sm shadow-md transition-all ${
                        resultat.type === 'success' 
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                        : 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}>
                        <p className="text-base font-black mb-1">
                            {resultat.type === 'success' ? '✅ Embarquement Accordé !' : 'Accès Refusé'}
                        </p>
                        <p>{resultat.message}</p>
                    </div>

                    {/* Bouton Réessayer uniquement en cas d'erreur */}
                    {resultat.type === 'error' && (
                        <button
                            onClick={relancerScanner}
                            className="mt-4 w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20"
                        >
                            Scanner le ticket à nouveau
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ScannerTicket;
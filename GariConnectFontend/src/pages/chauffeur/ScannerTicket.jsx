import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
// CORRECTION CORRIGÉE : Seulement 2 niveaux pour revenir à la racine de /src
import chauffeurService from '../../services/chauffeurService'; 

const ScannerTicket = ({ onFermer }) => {
    const [resultat, setResultat] = useState({ message: '', type: '' });
    const [isScanning, setIsScanning] = useState(true);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Initialisation du scanner natif sur l'élément HTML avec l'id "reader"
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [0] // Uniquement caméra arrière/environnement
        });

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

    const handleScan = async (codeTicket) => {
        try {
            const response = await chauffeurService.validerPassager(codeTicket);
            
            setResultat({ 
                message: `✅ Succès : ${response?.data?.message || 'Passager validé et embarqué !'}`, 
                type: 'success' 
            });
            
            setTimeout(() => {
                onFermer(); 
            }, 2000);

        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data || "Ticket invalide ou non payé";
            setResultat({ message: `❌ Erreur : ${errorMsg}`, type: 'error' });
            
            setTimeout(() => {
                window.location.reload(); 
            }, 3500);
        }
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col p-6 overflow-y-auto">
            
            {/* Barre d'en-tête */}
            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={onFermer} 
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Retour
                </button>
                <h3 className="text-lg font-black tracking-tight">Scanner un Ticket</h3>
                <div className="w-16"></div>
            </div>

            {/* Zone du Scanner */}
            <div className="w-full max-w-md mx-auto rounded-3xl border-4 border-indigo-600 shadow-2xl relative bg-black p-4 text-slate-800">
                <div id="reader" className="w-full bg-white rounded-2xl overflow-hidden"></div>
                
                {isScanning && (
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500 animate-bounce shadow-[0_0_8px_rgba(239,68,68,1)] pointer-events-none"></div>
                )}
            </div>

            {/* Notification */}
            {resultat.message && (
                <div className={`mt-8 p-4 rounded-2xl text-center font-black text-sm max-w-md mx-auto w-full shadow-md transition-all ${
                    resultat.type === 'success' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200' 
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
                }`}>
                    {resultat.message}
                </div>
            )}
        </div>
    );
};

export default ScannerTicket;
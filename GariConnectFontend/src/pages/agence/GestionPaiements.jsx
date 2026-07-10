import React, { useState, useEffect, useMemo } from 'react';
import {
    FaCreditCard, FaSearch, FaMoneyBillWave,
    FaMobileAlt, FaWallet, FaClock,
    FaTimes, FaCashRegister, FaInfoCircle, FaCheckDouble, FaPlusCircle, FaCar, FaCrown, FaPrint, FaFileInvoice
} from 'react-icons/fa';
import api from '../../services/api';

const GestionPaiements = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCashForm, setShowCashForm] = useState(false);
    const [detteCommission, setDetteCommission] = useState(0);

    // État pour stocker le profil de l'agence (pour vérifier l'abonnement et le rôle)
    const [agenceProfile, setAgenceProfile] = useState(null);
    
    // Formulaire pour nouveau paiement cash au guichet
    const [cashPayload, setCashPayload] = useState({ reservationId: "", montant: "" });

    useEffect(() => {
        fetchInitialData();
        fetchCommissionEtNotifs();
        fetchAgenceProfile(); 
    }, []);

    // Fonction pour récupérer le profil et le type d'abonnement
    const fetchAgenceProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/agences/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAgenceProfile(res.data);
        } catch (error) {
            console.error("Erreur lors de la récupération du profil agence :", error);
        }
    };

    // Récupère la liste des réservations via l'URL globale
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const resReservations = await api.get('/reservations', {
                headers: { Authorization: `Bearer ${token}` }
            });

            let rawData = [];
            if (Array.isArray(resReservations.data)) {
                rawData = resReservations.data;
            } else if (resReservations.data && Array.isArray(resReservations.data.content)) {
                rawData = resReservations.data.content;
            } else if (resReservations.data && Array.isArray(resReservations.data.reservations)) {
                rawData = resReservations.data.reservations;
            }
            
            console.log("Réservations chargées pour l'agence :", rawData);
            setReservations(rawData);
        } catch (error) {
            console.error("Erreur chargement données de paiements/reservations:", error);
        } finally {
            loading && setLoading(false);
        }
    };

    const fetchCommissionEtNotifs = async () => {
        try {
            const token = localStorage.getItem('token');
            const resDette = await api.get('/agences/ma-commission', {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: { montantDu: 0 } }));
            setDetteCommission(resDette.data.montantDu || 0);
        } catch (error) {
            console.error("Erreur récup commission:", error);
        }
    };

    // Filtrer les réservations en attente de versement (Standard ou Surplus VID)
    const reservationsEnAttente = useMemo(() => {
        return reservations.filter(r =>
            r?.statut === 'ATTENTE_PAIEMENT' ||
            r?.statut === 'EN_ATTENTE_AGENCE' ||
            r?.statut === 'EN_ATTENTE' ||
            r?.statut === 'ATTENTE_PAIEMENT_SURPLUS'
        );
    }, [reservations]);

    // Fonction utilitaire sécurisée pour obtenir le total exact d'une réservation
    const getMontantTotalSecurise = (r) => {
        if (r.montant_total) return r.montant_total;
        const base = r.montantPaye || r.trajet?.prix || 0;
        const surplus = r.demande_recuperation?.prixSupplementaire || 0;
        return base + surplus;
    };

    // 1️⃣ Format REÇU : Style ticket thermique épuré
    const handlePrintReceipt = (reservation) => {
        const printWindow = window.open('', '_blank', 'width=450,height=700');
        
        // 🔴 CORRECTION DU CRASH : Vérification du bloqueur de pop-ups
        if (!printWindow) {
            alert("⚠️ L'impression a été bloquée ! Veuillez autoriser les pop-ups (fenêtres contextuelles) dans la barre d'adresse de votre navigateur pour pouvoir imprimer les reçus.");
            return;
        }

        const total = getMontantTotalSecurise(reservation);
        const surplusRamassage = reservation.demande_recuperation?.prixSupplementaire || 0;
        const coutDeBase = total - surplusRamassage;
        const datePayment = new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const agenceNom = agenceProfile?.nomAgence || "VOTRE AGENCE";

        printWindow.document.write(`
            <html>
            <head>
            <title>Reçu de Paiement - ${reservation.codeTicket || 'N/A'}</title>
            <style>
            @page { size: auto; margin: 0mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 24px; font-size: 13px; line-height: 1.5; background: #fff; }
            .receipt-box { max-width: 360px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; }
            .brand { font-size: 20px; font-weight: 800; color: #16a34a; letter-spacing: -0.5px; text-transform: uppercase; }
            .meta-date { font-size: 11px; color: #94a3b8; margin-top: 6px; }
            .badge-status { display: inline-block; background-color: #f0fdf4; color: #16a34a; font-size: 10px; font-weight: 700; padding: 4px 12px; border: 1px solid #bbf7d0;
            text-transform: uppercase; margin-top: 8px; border-radius: 20px; }
            .info-section { margin-bottom: 16px; }
            .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .label { color: #64748b; }
            .value { font-weight: 600; color: #0f172a; text-align: right; }
            .divider { border-top: 1px solid #f1f5f9; margin: 12px 0; }
            .total-container { background: #f8fafc; border-radius: 12px; padding: 12px; margin-top: 16px; border: 1px solid #f1f5f9; }
            .total-row { display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 800; color: #0f172a; }
            .total-price { color: #16a34a; }
            .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 12px; }
            </style>
            </head>
            <body>
            <div class="receipt-box">
            <div class="header">
            <div class="brand">${agenceNom}</div>
            <div style="font-size: 12px; font-weight: bold; color: #64748b; margin-top: 4px;">REÇU DE CAISSE</div>
            <div class="meta-date">Date: ${datePayment}</div>
            <div class="badge-status">Paiement Validé</div>
            </div>
            <div class="info-section">
            <div class="section-title">Détails de la Référence</div>
            <div class="item-row"><span class="label">Code Ticket:</span><span class="value" style="font-family: monospace; font-size: 14px; color: #2563eb;">${reservation.codeTicket || 'RES-' + reservation.id}</span></div>
            <div class="item-row"><span class="label">Règlement:</span><span class="value">${(reservation.modePaiement || 'CASH').toUpperCase()}</span></div>
            </div>
            <div class="divider"></div>
            <div class="info-section">
            <div class="section-title">Informations Passager</div>
            <div class="item-row"><span class="label">Nom complet:</span><span class="value">${reservation.client?.nom ? (reservation.client.nom + ' ' + (reservation.client.prenom || '')).toUpperCase() : 'PASSAGER ANONYME'}</span></div>
            </div>
            <div class="divider"></div>
            <div class="info-section">
            <div class="section-title">Tarification</div>
            <div class="item-row"><span class="label">Frais de transport:</span><span class="value">${coutDeBase.toLocaleString('fr-FR')} FC</span></div>
            ${surplusRamassage > 0 ? `<div class="item-row"><span class="label">Service Ramassage (VID):</span><span class="value">${surplusRamassage.toLocaleString('fr-FR')} FC</span></div>` : ''}
            </div>
            <div class="total-container">
            <div class="total-row">
            <span>NET PAYÉ:</span>
            <span class="total-price">${total.toLocaleString('fr-FR')} FC</span>
            </div>
            </div>
            <div class="footer">
            Merci pour votre confiance.<br>
            Bon voyage avec notre réseau !
            </div>
            </div>
            <script>
            window.onload = function() { window.print(); window.close(); }
            </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // 2️⃣ Format FACTURE : Style A4 structuré et professionnel
    const handlePrintInvoice = (reservation) => {
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        
        // 🔴 CORRECTION DU CRASH : Vérification du bloqueur de pop-ups
        if (!printWindow) {
            alert("⚠️ L'impression a été bloquée ! Veuillez autoriser les pop-ups (fenêtres contextuelles) dans la barre d'adresse de votre navigateur pour pouvoir imprimer les factures.");
            return;
        }

        const total = getMontantTotalSecurise(reservation);
        const surplusRamassage = reservation.demande_recuperation?.prixSupplementaire || 0;
        const coutDeBase = total - surplusRamassage;
        const datePayment = new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const agenceNom = agenceProfile?.nomAgence || "VOTRE AGENCE";

        printWindow.document.write(`
            <html>
            <head>
            <title>Facture - ${reservation.codeTicket || 'N/A'}</title>
            <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; padding: 40px; font-size: 14px; background: #fff; }
            .invoice-container { max-width: 750px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 8px; }
            .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 30px; }
            .brand-details h1 { font-size: 26px; font-weight: 800; color: #2563eb; margin: 0; text-transform: uppercase; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
            .invoice-meta { margin-top: 5px; font-size: 12px; color: #64748b; }
            .details-grid { display: grid; grid-columns: 1fr 1fr; display: flex; justify-content: space-between; margin-bottom: 40px; gap: 20px; }
            .details-block h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.5px; }
            .details-block p { margin: 3px 0; font-weight: 600; color: #1e293b; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .invoice-table th { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;
            text-align: left; }
            .invoice-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .text-right { text-align: right !important; }
            .summary-wrapper { display: flex; justify-content: flex-end; }
            .summary-box { width: 280px; background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .summary-row.total { border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; font-size: 16px; font-weight: 800; color: #2563eb; }
            .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            </style>
            </head>
            <body>
            <div class="invoice-container">
            <div class="invoice-header">
            <div class="brand-details">
            <h1>${agenceNom}</h1>
            <div class="invoice-meta">Service de Transport Interurbain</div>
            </div>
            <div class="invoice-title">
            <h2>FACTURE DETAILLÉE</h2>
            <div class="invoice-meta">N° Réf : ${reservation.codeTicket || 'RES-' + reservation.id}</div>
            <div class="invoice-meta">Date émission : ${datePayment}</div>
            </div>
            </div>
            <div class="details-grid">
            <div class="details-block">
            <h3>Émis par :</h3>
            <p>${agenceNom}</p>
            <p style="font-size: 12px; color: #64748b; font-weight: normal;">Guichet de Caisse Centralisé</p>
            </div>
            <div class="details-block" style="text-align: right;">
            <h3>Facturé à :</h3>
            <p>${reservation.client?.nom ? (reservation.client.nom + ' ' + (reservation.client.prenom || '')).toUpperCase() : 'PASSAGER ANONYME'}</p>
            <p style="font-size: 12px; color: #64748b; font-weight: normal;">Téléphone : ${reservation.client?.telephone || 'N/A'}</p>
            </div>
            </div>
            <table class="invoice-table">
            <thead>
            <tr>
            <th>Désignation de la prestation</th>
            <th class="text-right">Quantité</th>
            <th class="text-right">Prix Unitaire</th>
            <th class="text-right">Montant Total</th>
            </tr>
            </thead>
            <tbody>
            <tr>
            <td>
            <strong>Billet de transport routier</strong><br>
            <span style="font-size: 12px; color: #64748b;">Trajet : ${reservation.trajet?.depart || 'Départ'} → ${reservation.trajet?.arrivee || 'Arrivée'}</span>
            </td>
            <td class="text-right">1</td>
            <td class="text-right">${coutDeBase.toLocaleString('fr-FR')} FC</td>
            <td class="text-right">${coutDeBase.toLocaleString('fr-FR')} FC</td>
            </tr>
            ${surplusRamassage > 0 ? `
            <tr>
            <td>
            <strong>Option Prise en charge Hors-Murs (VID)</strong><br>
            <span style="font-size: 12px; color: #64748b;">Service de ramassage personnalisé à domicile</span>
            </td>
            <td class="text-right">1</td>
            <td class="text-right">${surplusRamassage.toLocaleString('fr-FR')} FC</td>
            <td class="text-right">${surplusRamassage.toLocaleString('fr-FR')} FC</td>
            </tr>
            ` : ''}
            </tbody>
            </table>
            <div class="summary-wrapper">
            <div class="summary-box">
            <div class="summary-row">
            <span style="color: #64748b;">Mode de règlement :</span>
            <span style="font-weight: 600;">${(reservation.modePaiement || 'CASH').toUpperCase()}</span>
            </div>
            <div class="summary-row">
            <span style="color: #64748b;">Statut :</span>
            <span style="font-weight: 600; color: #16a34a;">PAYÉ / ENCAISSÉ</span>
            </div>
            <div class="summary-row total">
            <span>NET À PAYER :</span>
            <span>${total.toLocaleString('fr-FR')} FC</span>
            </div>
            </div>
            </div>
            <div class="footer">
            Cette facture fait office de preuve d'achat et de titre de transport officiel.<br>
            <strong>GariConnect Plateforme — Propulsé par votre agence de confiance.</strong>
            </div>
            </div>
            <script>
            window.onload = function() { window.print(); window.close(); }
            </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // ENCAISSEMENT VIA LE FORMULAIRE DE SELECTION
    const handleDirectCashPaiement = async (e) => {
        e.preventDefault();
        const selectedRes = reservationsEnAttente.find(r => r.id.toString() === cashPayload.reservationId);

        if (!selectedRes) return alert("Veuillez sélectionner une réservation valide");
        const totalAEncaisser = getMontantTotalSecurise(selectedRes);
        if (!window.confirm(`Confirmer l'encaissement physique de ${totalAEncaisser.toLocaleString('fr-FR')} FC au guichet ?`)) return;
        
        try {
            const token = localStorage.getItem('token');

            await api.post(`/paiements/encaisser-guichet`, {
                reservationId: selectedRes.id,
                montant: totalAEncaisser,
                modePaiement: "CASH",
                reference: "CASH-GUICHET"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Paiement encaissé avec succès ! Le statut est passé à validé et le reçu va être généré.`);
            setShowCashForm(false);
            setCashPayload({ reservationId: "", montant: "" });

            handlePrintReceipt(selectedRes);

            fetchInitialData();
            fetchCommissionEtNotifs();
        } catch (error) {
            console.error("Erreur Backend lors de l'encaissement :", error.response?.data);
            alert(error.response?.data?.message || "Erreur lors de la validation du paiement au guichet.");
        }
    };

    // ENCAISSEMENT RAPIDE VIA LE BOUTON DE LA LIGNE DU TABLEAU
    const handleEncaisserPaiementRapide = async (reservation) => {
        const totalAEncaisser = getMontantTotalSecurise(reservation);
        if (!window.confirm(`Confirmer la réception des espèces de ${totalAEncaisser.toLocaleString('fr-FR')} FC pour la réservation de ${reservation.client?.nom || 'ce client'} ?`)) return;

        try {
            const token = localStorage.getItem('token');

            await api.post(`/paiements/encaisser-guichet`, {
                reservationId: reservation.id,
                montant: totalAEncaisser,
                modePaiement: "CASH",
                reference: "CASH-GUICHET"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert("Caisse mise à jour ! Impression du reçu de paiement...");

            handlePrintReceipt(reservation);
            fetchInitialData();
            fetchCommissionEtNotifs();
            
        } catch (error) {
            // Extraction du message sécurisée
            const messageErreur = error?.response?.data?.message
                || error?.message
                || "Une erreur inconnue est survenue lors de l'encaissement.";
            
            console.error("Erreur d'encaissement rapide :", messageErreur);
            console.dir(error);
            alert(`Échec de l'encaissement : ${messageErreur}`);
        }
    };

    // CALCUL DES STATISTIQUES COHÉRENTES
    const stats = useMemo(() => {
        const payes = reservations.filter(r => r?.statut === 'PAYE' || r?.statut === 'CONFIRMEE' || r?.statut === 'VALIDEE' || r?.statut === 'EMBARQUE');

        return {
            total: payes.reduce((sum, r) => sum + getMontantTotalSecurise(r), 0),
            mobile: payes.filter(r => r.modePaiement && r.modePaiement !== 'CASH').reduce((sum, r) => sum + getMontantTotalSecurise(r), 0),
            cash: payes.filter(r => r.modePaiement === 'CASH' || !r.modePaiement).reduce((sum, r) => sum + getMontantTotalSecurise(r), 0),
            pending: reservationsEnAttente.length
        };
    }, [reservations, reservationsEnAttente]);

    // RECHERCHE FILTRÉE
    const reservationsFiltrées = useMemo(() => {
        return reservations.filter(r => {
            const clientObj = r?.client;
            const nomClient = clientObj ? `${clientObj.nom || ""} ${clientObj.prenom || ""}` : "";
            return nomClient.toLowerCase().includes(searchTerm.toLowerCase()) || (r.codeTicket && r.codeTicket.toLowerCase().includes(searchTerm.toLowerCase()));
        });
    }, [reservations, searchTerm]);

    // Vérification de la condition d'exemption
    const isAbonnementDefinitif = agenceProfile?.role === 'AGENCY_ADMIN' && agenceProfile?.typeAbonnement === 'DEFINITIF';

    return (
        <div className="p-4 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">

            {/* BANNIÈRE COMMISSION OU ABONNEMENT DEFINITIF */}
            {isAbonnementDefinitif ? (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center animate-fadeIn">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center">
                            <FaCrown size={24} />
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase text-[10px] tracking-widest">Licence Premium Active</h4>
                            <p className="text-amber-100 text-xs font-bold">Votre agence est exemptée des commissions de la plateforme.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 border-l-8 border-emerald-500 rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <FaInfoCircle size={24} />
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase text-[10px] tracking-widest">Dette Commission</h4>
                            <p className="text-slate-400 text-xs font-bold">À reverser à la plateforme GariConnect</p>
                        </div>
                    </div>
                    <div className="text-right text-white">
                        <span className="text-3xl font-black italic">{detteCommission?.toLocaleString('fr-FR')}</span>
                        <span className="ml-2 text-emerald-400 font-black text-sm uppercase">FC</span>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <h1 className="text-3xl font-black flex items-center gap-4">
                    <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-lg shadow-blue-500/30">
                        <FaCreditCard className="text-white" />
                    </div>
                    Gestion de la Caisse
                </h1>

                <button
                    onClick={() => setShowCashForm(!showCashForm)}
                    className="bg-emerald-600 text-white px-6 py-4 rounded-[1.5rem] font-black flex items-center gap-2 shadow-lg transition-transform hover:scale-105 border-0 cursor-pointer"
                >
                    {showCashForm ? <FaTimes/> : <FaPlusCircle/>} Nouveau Paiement Cash
                </button>
            </div>

            {/* FORMULAIRE CASH ENCAISSEMENT */}
            {showCashForm && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-emerald-500/20 shadow-xl animate-fadeIn">
                    <h3 className="text-emerald-600 font-black uppercase text-xs mb-6 flex items-center gap-2">
                        <FaCashRegister/> Encaisser des espèces au guichet agence
                    </h3>
                    <form onSubmit={handleDirectCashPaiement} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <select
                            className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none font-bold text-sm border border-transparent focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                            value={cashPayload.reservationId}
                            onChange={(e) => {
                                const resId = e.target.value;
                                const selected = reservationsEnAttente.find(r => r.id.toString() === resId);
                                if (selected) {
                                    const total = getMontantTotalSecurise(selected);
                                    setCashPayload({
                                        reservationId: resId,
                                        montant: total
                                    });
                                } else {
                                    setCashPayload({ reservationId: "", montant: "" });
                                }
                            }}
                            required
                        >
                            <option value="">Sélectionner le dossier client en attente...</option>
                            {reservationsEnAttente.map(res => {
                                const total = getMontantTotalSecurise(res);
                                return (
                                    <option key={res.id} value={res.id}>
                                        Code: {res.codeTicket || `ID-${res.id}`} — {res.client?.nom?.toUpperCase()} ({total.toLocaleString('fr-FR')} FC)
                                    </option>
                                );
                            })}
                        </select>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="Montant total à percevoir"
                                className="p-4 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 outline-none font-black text-sm border border-transparent text-slate-900 dark:text-white"
                                value={cashPayload.montant ? `${parseFloat(cashPayload.montant).toLocaleString('fr-FR')} FC` : ""}
                                disabled
                                required
                            />
                        </div>
                        <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg transition-all text-xs tracking-wider border-0 cursor-pointer">
                            VALIDER ET ENREGISTRER L'ENCAISSEMENT
                        </button>
                    </form>
                </div>
            )}

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Recette Totale" value={stats.total} icon={<FaWallet />} color="emerald" unit="FC" />
                <StatCard title="Mobile Money" value={stats.mobile} icon={<FaMobileAlt />} color="blue" unit="FC" />
                <StatCard title="Espèces Guichet" value={stats.cash} icon={<FaMoneyBillWave />} color="amber" unit="FC" />
                <StatCard title="Dossiers en Attente" value={stats.pending} icon={<FaClock />} color="rose" isCount />
            </div>

            {/* RECHERCHE */}
            <div className="relative">
                <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher par nom de voyageur, passager ou code billet..."
                    className="w-full bg-white dark:bg-slate-900 pl-14 pr-6 py-5 rounded-[1.8rem] outline-none border border-slate-200 dark:border-slate-800 font-bold shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* TABLEAU DES FLUX FINANCIERS COMPLET */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-transparent">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-8 py-6 font-black">N° Billet / Référence</th>
                                <th className="px-8 py-6 font-black">Nom du Client</th>
                                <th className="px-8 py-6 font-black">Type & Option</th>
                                <th className="px-8 py-6 font-black">Mode de Règlement</th>
                                <th className="px-8 py-6 font-black text-right">Frais de Voyage Total</th>
                                <th className="px-8 py-6 font-black text-center">Statut Transaction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center text-blue-500 font-black animate-pulse">
                                        Synchronisation avec le livre de caisse en cours...
                                    </td>
                                </tr>
                            ) : reservationsFiltrées.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-slate-400 font-bold">
                                        Aucun flux ou réservation trouvé dans le registre de cette agence.
                                    </td>
                                </tr>
                            ) : reservationsFiltrées.map(r => {
                                const prixTotalGlobal = getMontantTotalSecurise(r);
                                const surplusRamassage = r.demande_recuperation?.prixSupplementaire || 0;
                                const coutDeBase = prixTotalGlobal - surplusRamassage;
                                const aUnSurplus = surplusRamassage > 0;
                                const estEncaisse = r.statut === 'PAYE' || r.statut === 'CONFIRMEE' || r.statut === 'VALIDEE' || r.statut === 'EMBARQUE';
                                
                                return (
                                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-8 py-6 font-mono font-bold text-blue-600">
                                            {r.codeTicket || `RES-00${r.id}`}
                                        </td>
                                        <td className="px-8 py-6 font-black uppercase text-xs">
                                            {r.client?.nom ? `${r.client.nom} ${r.client.prenom || ""}` : "Passager Anonyme"}
                                        </td>
                                        <td className="px-8 py-6 text-xs">
                                            {aUnSurplus ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 rounded-lg font-extrabold uppercase text-[10px]">
                                                    <FaCar size={10}/> VID + Ramassage
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-medium">Standard</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 italic text-xs text-slate-500">
                                            {estEncaisse
                                                ? (r.modePaiement || 'CASH')
                                                : r.statut === 'ATTENTE_PAIEMENT_SURPLUS' ? 'SURPLUS COMPLÉMENTAIRE' : 'A RÉGLER AU GUICHET'}
                                        </td>
                                        <td className="px-8 py-6 text-right md:text-right">
                                            <div className="text-slate-900 dark:text-white font-black text-sm">
                                                {prixTotalGlobal.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-400">FC</span>
                                            </div>
                                            {aUnSurplus && (
                                                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                                    (Billet: {coutDeBase.toLocaleString('fr-FR')} + Hors-murs: {surplusRamassage.toLocaleString('fr-FR')})
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {estEncaisse ? (
                                                <div className="flex items-center justify-center gap-2 mx-auto w-max">
                                                    <span className="text-emerald-500 font-black text-[10px] uppercase flex items-center justify-center gap-1 bg-emerald-500/10 py-2 px-3 rounded-full">
                                                        <FaCheckDouble/> Encaissé
                                                    </span>
                                                    
                                                    {/* Bouton Reçu */}
                                                    <button
                                                        onClick={() => handlePrintReceipt(r)}
                                                        title="Imprimer le reçu (Ticket)"
                                                        className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all border-0 cursor-pointer flex items-center justify-center gap-1 text-[11px]"
                                                    >
                                                        <FaPrint size={13} /> Reçu
                                                    </button>
                                                    
                                                    {/* Bouton Facture */}
                                                    <button
                                                        onClick={() => handlePrintInvoice(r)}
                                                        title="Imprimer la facture (A4)"
                                                        className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl transition-all border-0 cursor-pointer flex items-center justify-center gap-1 text-[11px]"
                                                    >
                                                        <FaFileInvoice size={13} /> Facture
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEncaisserPaiementRapide(r)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-black text-[10px] tracking-wider transition-colors shadow-sm shadow-blue-500/20 border-0 cursor-pointer"
                                                >
                                                    {r.statut === 'ATTENTE_PAIEMENT_SURPLUS' ? "ENCAISSER SURPLUS" : "PERCEVOIR CASH"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, unit, isCount }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-5 shadow-sm">
        <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center text-xl ${
            color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
        }`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {(value || 0).toLocaleString('fr-FR')} {!isCount && <span className="text-[10px] text-slate-400 font-bold">{unit}</span>}
            </p>
        </div>
    </div>
);

export default GestionPaiements;
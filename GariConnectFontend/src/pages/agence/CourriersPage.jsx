import React, { useState, useEffect } from 'react';
import { 
    FaBox, FaSearch, FaPlus, FaTimes, FaTrash, FaEdit, 
    FaEnvelopeOpenText, FaWeightHanging, FaRobot, 
    FaSpinner, FaClipboardList, FaCheck, FaMoneyBillWave, FaPrint, FaSave
} from 'react-icons/fa';
import api from '../../services/api'; 
import StatutActions from '../../component/StatutActions';

const CourriersPage = () => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Mode d'affichage : 'liste' ou 'validation' (Hub d'agence)
    const [viewMode, setViewMode] = useState('liste');
    
    // États pour stocker les données brutes issues de l'API
    const [demandesAttente, setDemandesAttente] = useState([]); 
    const [courriers, setCourriers] = useState([]); 
    const [submittingValidation, setSubmittingValidation] = useState({});
    
    const [isAiMode, setIsAiMode] = useState(false);
    const [step, setStep] = useState(1);
    const [aiReport, setAiReport] = useState(null);
    const [trajets, setTrajets] = useState([]);
    const [tauxEchange, setTauxEchange] = useState(2800);
    const [updatingTaux, setUpdatingTaux] = useState(false);
    
    const [selectedColis, setSelectedColis] = useState(null);
    const [formData, setFormData] = useState({
        nomExpediteur: '', telExpediteur: '', nomDestinataire: '', telDestinataire: '',
        type: 'COLIS', description: '', poidsKg: '', valeurEstimee: '', devise: 'FC', 
        estFragile: false, trajetId: '', prix: ''
    });

    useEffect(() => {
        fetchTrajets();
        fetchCourriers();
        fetchDemandesAttente();
        fetchTauxEchange();
    }, []);

    // 🟢 LECTURE DU TAUX DE CHANGE DE L'AGENCE (Méthode GET)
    const fetchTauxEchange = async () => {
        try {
            const response = await api.get('/courriers/agences/taux-change');
            if (response.data && response.data.valeur) {
                setTauxEchange(response.data.valeur);
            } else if (typeof response.data === 'number') {
                setTauxEchange(response.data);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.warn("L'endpoint /api/courriers/agences/taux-change est introuvable (404). Conservation du taux par défaut.");
            } else {
                console.error("Erreur de chargement du taux de change", error);
            }
        }
    };

    // 🟢 SAUVEGARDE DU TAUX DE CHANGE (Méthode PUT)
    const handleSaveTauxEchange = async () => {
        setUpdatingTaux(true);
        try {
            const taux = parseFloat(tauxEchange);
            if (isNaN(taux) || taux <= 0) {
                alert("Veuillez entrer un taux de change valide supérieur à 0.");
                return;
            }
            await api.put('/courriers/agences/taux-change', { valeur: taux });
            alert("Taux de change mis à jour avec succès pour l'agence !");
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du taux de change", error);
            alert("Impossible de sauvegarder le taux de change. Vérifiez votre connexion au serveur.");
        } finally {
            setUpdatingTaux(false);
        }
    };

    const fetchTrajets = async () => {
        try {
            const response = await api.get('/trajets');
            setTrajets(response.data);
        } catch (error) {
            console.error("Erreur de chargement des trajets", error);
        }
    };

    const fetchCourriers = async () => {
        try {
            const response = await api.get('/courriers');
            if (response.data && response.data.content) {
                setCourriers(response.data.content);
            } else if (Array.isArray(response.data)) {
                setCourriers(response.data);
            } else {
                setCourriers([]);
            }
        } catch (error) {
            console.error("Erreur de chargement de la liste générale", error);
        }
    };

    const fetchDemandesAttente = async () => {
        try {
            const response = await api.get('/courriers/statut/EN_ATTENTE_DE_VALIDATION');
            if (response.data && response.data.content) {
                setDemandesAttente(response.data.content);
            } else if (Array.isArray(response.data)) {
                setDemandesAttente(response.data);
            } else {
                setDemandesAttente([]);
            }
        } catch (error) {
            console.error("Erreur spécifique au Hub de Validation", error);
            setDemandesAttente([]);
        }
    };

    const handleValiderDemande = async (colis) => {
        setSubmittingValidation(prev => ({ ...prev, [colis.id]: true }));
        try {
            const taux = parseFloat(tauxEchange) || 1.0;
            
            await api.put(
                `/courriers/${colis.id}/valider`, 
                null, 
                {
                    params: {
                        poidsReel: colis.poidsKg,
                        devise: colis.devise,
                        valeurEstimee: colis.valeurEstimee,
                        tauxChange: taux
                    }
                }
            );
            
            setSelectedColis(colis);
            setFormData({
                nomExpediteur: colis.nomExpediteur || '',
                telExpediteur: colis.telExpediteur || '',
                nomDestinataire: colis.nomDestinataire || '',
                telDestinataire: colis.telDestinataire || '',
                type: colis.type || 'COLIS',
                description: colis.description || '',
                poidsKg: colis.poidsKg || '',
                valeurEstimee: colis.valeurEstimee || '',
                devise: colis.devise || 'FC',
                estFragile: colis.estFragile || false,
                trajetId: colis.trajet ? colis.trajet.id.toString() : '',
                prix: colis.prix || ''
            });
            const risque = colis.niveauRisqueIA || colis.niveauRisqueIa;
            if (risque && risque !== 'NON_EVALUE') {
                setAiReport({
                    niveauRisqueIa: risque,
                    prixSuggereIa: colis.prixSuggereIA || colis.prixSuggereIa || null,
                    explication: colis.explicationIA || colis.explicationIa || ''
                });
                setIsAiMode(true);
            }
            setShowModal(true);
            
            await fetchCourriers();
            await fetchDemandesAttente();
        } catch (error) {
            console.error("Erreur de validation :", error);
            alert("Une erreur est survenue lors de la validation du colis.");
        } finally {
            setSubmittingValidation(prev => ({ ...prev, [colis.id]: false }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const renderDoubleDevise = (montant, deviseOrigine) => {
        const value = parseFloat(montant);
        const rate = parseFloat(tauxEchange);
        if (isNaN(value) || value <= 0 || isNaN(rate) || rate <= 0) return '---';
        if (deviseOrigine === 'FC') {
            return `${value.toLocaleString()} FC ( ${(value / rate).toFixed(2)} USD )`;
        } else {
            return `${value.toLocaleString()} USD ( ${Math.round(value * rate).toLocaleString()} FC )`;
        }
    };

    const handleAiAnalysis = async () => {
        if (!formData.description || !formData.poidsKg || !formData.valeurEstimee) {
            alert("Veuillez remplir la description, le poids et la valeur estimée pour l'analyse.");
            return;
        }
        setLoading(true);
        try {
            const response = await api.post('/courriers/analyser-ia', {
                description: formData.description, poidsKg: parseFloat(formData.poidsKg),
                valeurEstimee: parseFloat(formData.valeurEstimee), devise: formData.devise, estFragile: formData.estFragile
            });
            setAiReport(response.data);
            setFormData(prev => ({ ...prev, prix: response.data.prixSuggereIa || response.data.prixSuggereIA || '' }));
            setStep(2);
        } catch (error) {
            alert("Impossible de contacter le service d'IA.");
        } finally {
            setLoading(false); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                poidsKg: parseFloat(formData.poidsKg),
                valeurEstimee: parseFloat(formData.valeurEstimee),
                prix: parseFloat(formData.prix),
                trajet: { id: parseInt(formData.trajetId) },
                niveauRisqueIA: aiReport ? (aiReport.niveauRisqueIa || aiReport.niveauRisqueIA) : 'NON_EVALUE',
                prixSuggereIA: aiReport ? (aiReport.prixSuggereIa || aiReport.prixSuggereIA) : null,
                explicationIA: aiReport ? (aiReport.explication || aiReport.explicationIA) : null
            };
            if (selectedColis) {
                await api.put(`/courriers/${selectedColis.id}`, payload);
            } else {
                await api.post('/courriers/envoyer', payload);
            }
            fetchCourriers();
            fetchDemandesAttente();
            handleCloseModal();
        } catch (error) {
            console.error("Erreur d'enregistrement:", error);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false); setSelectedColis(null);
        setFormData({
            nomExpediteur: '', telExpediteur: '', nomDestinataire: '', telDestinataire: '',
            type: 'COLIS', description: '', poidsKg: '', valeurEstimee: '', devise: 'FC',
            estFragile: false, trajetId: '', prix: ''
        });
        setAiReport(null); setIsAiMode(false); setStep(1);
    };

    const handleOpenEdit = (colis) => {
        setSelectedColis(colis);
        setFormData({
            nomExpediteur: colis.nomExpediteur || '', telExpediteur: colis.telExpediteur || '',
            nomDestinataire: colis.nomDestinataire || '', telDestinataire: colis.telDestinataire || '',
            type: colis.type || 'COLIS', description: colis.description || '', poidsKg: colis.poidsKg || '',
            valeurEstimee: colis.valeurEstimee || '', devise: colis.devise || 'FC', estFragile: colis.estFragile || false,
            trajetId: colis.trajet ? colis.trajet.id.toString() : '', prix: colis.prix || ''
        });
        const risque = colis.niveauRisqueIA || colis.niveauRisqueIa;
        if (risque && risque !== 'NON_EVALUE') {
            setAiReport({
                niveauRisqueIa: risque, prixSuggereIa: colis.prixSuggereIA || colis.prixSuggereIa || null,
                explication: colis.explicationIA || colis.explicationIa || ''
            });
            setIsAiMode(true);
        } else {
            setAiReport(null); setIsAiMode(false);
        }
        setStep(1); setShowModal(true);
    };

    const handleDelete = async (id) => {
        if(window.confirm("Voulez-vous vraiment supprimer ce colis ?")) {
            try {
                await api.delete(`/courriers/${id}`);
                fetchCourriers();
                fetchDemandesAttente();
            } catch (error) {
                console.error("Erreur de suppression", error);
            }
        }
    };

    const handlePrintTicket = (colis) => {
        const ticketWindow = window.open('', '_blank', 'width=400,height=600');
        const formattedPrice = renderDoubleDevise(colis.prix, colis.devise);
        const trajetLabel = colis.trajet ? (colis.trajet.label || `${colis.trajet.depart || ''} → ${colis.trajet.destination || ''}`) : 'Non assigné';
        const dateTicket = new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        ticketWindow.document.write(`
            <html>
            <head>
                <title>Ticket Colis - ${colis.codeRetrait || 'N/A'}</title>
                <style>
                    @page { size: auto; margin: 0mm; }
                    body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 20px; font-size: 13px; line-height: 1.4; }
                    .ticket-container { max-width: 320px; margin: 0 auto; border: 1px dashed #000; padding: 15px; border-radius: 8px; }
                    .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                    .company-name { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                    .subtitle { font-size: 11px; color: #555; }
                    .code-section { text-align: center; margin: 15px 0; background: #f0f0f0; padding: 8px; border-radius: 4px; border: 1px solid #000; }
                    .code-title { font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
                    .code-value { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
                    .section-title { font-weight: bold; text-transform: uppercase; font-size: 11px; margin-top: 12px; margin-bottom: 4px; border-bottom: 1px solid #000; width: fit-content; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                    .label { font-weight: bold; }
                    .value { text-align: right; max-width: 180px; word-wrap: break-word; }
                    .total-box { margin-top: 15px; border-top: 1px dashed #000; padding-top: 8px; }
                    .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; }
                    .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 8px; }
                    .fragile { color: red; font-weight: bold; border: 1px solid red; padding: 2px 5px; display: inline-block; margin-top: 5px; border-radius: 3px; font-size: 11px; }
                </style>
            </head>
            <body>
                <div class="ticket-container">
                    <div class="header">
                        <div class="company-name">TRANSIT AGENCE</div>
                        <div class="subtitle">Gestion et Expédition Express</div>
                        <div style="font-size: 10px; margin-top: 5px;">Date: ${dateTicket}</div>
                    </div>
                    
                    <div class="code-section">
                        <div class="code-title">Code de Retrait</div>
                        <div class="code-value">${colis.codeRetrait || '---'}</div>
                    </div>
                    <div class="row"><span class="label">Type:</span><span class="value">${colis.type}</span></div>
                    <div class="row"><span class="label">Trajet:</span><span class="value">${trajetLabel}</span></div>
                    <div class="section-title">Expéditeur</div>
                    <div class="row"><span class="label">Nom:</span><span class="value">${colis.nomExpediteur}</span></div>
                    <div class="row"><span class="label">Tél:</span><span class="value">${colis.telExpediteur}</span></div>
                    <div class="section-title">Destinataire</div>
                    <div class="row"><span class="label">Nom:</span><span class="value">${colis.nomDestinataire}</span></div>
                    <div class="row"><span class="label">Tél:</span><span class="value">${colis.telDestinataire}</span></div>
                    <div class="section-title">Détails Colis</div>
                    <div class="row"><span class="label">Poids:</span><span class="value">${colis.poidsKg} kg</span></div>
                    <div class="row"><span class="label">Description:</span><span class="value">${colis.description}</span></div>
                    ${colis.estFragile ? '<div style="text-align:center;"><span class="fragile"> ⚠️  ATTENTION: FRAGILE</span></div>' : ''}
                    <div class="total-box">
                        <div class="total-row">
                            <span>TOTAL NET:</span>
                            <span>${formattedPrice}</span>
                        </div>
                    </div>
                    <div class="footer">
                        Merci pour votre confiance !<br>
                        Conservez ce ticket pour le retrait du colis.
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        ticketWindow.document.close();
    };

    const searchMatch = (c) => {
        const search = searchTerm.toLowerCase();
        const nomExp = c?.nomExpediteur ? String(c.nomExpediteur).toLowerCase() : '';
        const nomDest = c?.nomDestinataire ? String(c.nomDestinataire).toLowerCase() : '';
        const code = c?.codeRetrait ? String(c.codeRetrait).toLowerCase() : '';
        return nomExp.includes(search) || nomDest.includes(search) || code.includes(search);
    };

    const filteredCourriers = Array.isArray(courriers) ? courriers.filter(searchMatch) : [];
    const filteredDemandes = Array.isArray(demandesAttente) ? demandesAttente.filter(searchMatch) : [];

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <FaBox className="text-xl" />
                        </div>
                        Gestion des Colis & Courriers
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Espace de transit de l'agence.</p>
                </div>

                {/* Taux */}
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-4 py-2 rounded-xl text-amber-800 dark:text-amber-400">
                    <FaMoneyBillWave className="text-xl text-amber-600 dark:text-amber-500 shrink-0" />
                    <div>
                        <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">Taux Courant</div>
                        <div className="flex items-center gap-1.5 font-bold text-sm mt-0.5">
                            <span>1 USD = </span>
                            <div className="relative flex items-center gap-1">
                                <input
                                    type="number"
                                    value={tauxEchange}
                                    onChange={(e) => setTauxEchange(e.target.value)}
                                    className="w-20 bg-white dark:bg-gray-700 border border-amber-300 dark:border-amber-800 rounded px-1.5 py-0.5 text-center text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                <button
                                    onClick={handleSaveTauxEchange}
                                    disabled={updatingTaux}
                                    title="Sauvegarder le taux"
                                    className="p-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors disabled:opacity-50 text-xs flex items-center justify-center"
                                >
                                    {updatingTaux ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                </button>
                            </div>
                            <span>FC</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-sm"
                >
                    <FaPlus className="text-sm" /> Nouveau Colis
                </button>
            </div>
            
            {/* Onglets */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-px">
                <button
                    onClick={() => setViewMode('liste')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                        viewMode === 'liste'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                >
                    <FaBox className="text-xs" /> Liste Générale ({filteredCourriers.length})
                </button>
                <button
                    onClick={() => setViewMode('validation')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                        viewMode === 'validation'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                >
                    <FaClipboardList className="text-xs" /> Hub de Validation Agence
                    <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">
                        {filteredDemandes.length}
                    </span>
                </button>
            </div>
            
            {/* Barre de recherche */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <FaSearch className="text-gray-400 dark:text-gray-500" />
                <input
                    type="text"
                    placeholder="Rechercher par expéditeur, destinataire ou code de retrait..."
                    className="w-full bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* TABLEAU 1 : Liste Générale */}
            {viewMode === 'liste' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/75 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="py-4 px-6">Code & Type</th>
                                    <th className="py-4 px-6">Expéditeur</th>
                                    <th className="py-4 px-6">Destinataire</th>
                                    <th className="py-4 px-6">Détails Colis</th>
                                    <th className="py-4 px-6">Trajet</th>
                                    <th className="py-4 px-6">Prix (Double Devise)</th>
                                    <th className="py-4 px-6">Risque IA</th>
                                    <th className="py-4 px-6">Statut</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
                                {filteredCourriers.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-8 text-center text-gray-400 dark:text-gray-500 font-medium">Aucun colis dans la liste générale.</td>
                                    </tr>
                                ) : (
                                    filteredCourriers.map((colis) => (
                                        <tr key={colis.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-indigo-600 dark:text-indigo-400">{colis.codeRetrait || '---'}</div>
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium mt-1 ${
                                                    colis.type === 'COLIS' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    {colis.type === 'COLIS' ? <FaBox className="text-[10px]" /> : <FaEnvelopeOpenText className="text-[10px]" />}
                                                    {colis.type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900 dark:text-white">{colis.nomExpediteur}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{colis.telExpediteur}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900 dark:text-white">{colis.nomDestinataire}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{colis.telDestinataire}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="max-w-[200px] truncate font-medium">{colis.description}</div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><FaWeightHanging className="text-[10px]" /> {colis.poidsKg} kg</span>
                                                    {colis.estFragile && <span className="text-red-500 font-medium"> ⚠️  Fragile</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                                                {colis.trajet ? (colis.trajet.label || `${colis.trajet.depart || ''} → ${colis.trajet.destination || ''}`) : 'Non assigné'}
                                            </td>
                                            <td className="py-4 px-6 font-semibold whitespace-nowrap">
                                                {renderDoubleDevise(colis.prix, colis.devise)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700">
                                                    <FaRobot className="text-[10px]" /> {colis.niveauRisqueIA || colis.niveauRisqueIa || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    colis.statut === 'EN_ATTENTE' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                                                }`}>
                                                    {colis.statut}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <StatutActions currentStatut={colis.statut} courrierId={colis.id} onStatusUpdate={fetchCourriers} />
                                                    <button onClick={() => handlePrintTicket(colis)} title="Imprimer le ticket" className="p-2 text-gray-400 hover:text-green-600 rounded-lg"><FaPrint /></button>
                                                    <button onClick={() => handleOpenEdit(colis)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg"><FaEdit /></button>
                                                    <button onClick={() => handleDelete(colis.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><FaTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* TABLEAU 2 : Hub de Validation */}
            {viewMode === 'validation' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/75 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="py-4 px-6">Code Retrait</th>
                                    <th className="py-4 px-6">Expéditeur</th>
                                    <th className="py-4 px-6">Destinataire</th>
                                    <th className="py-4 px-6">Détails de la Demande</th>
                                    <th className="py-4 px-6">Trajet</th>
                                    <th className="py-4 px-6">Montant Dû (Double Devise)</th>
                                    <th className="py-4 px-6">Risque IA</th>
                                    <th className="py-4 px-6 text-right">Action Agence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
                                {filteredDemandes.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-8 text-center text-gray-400 dark:text-gray-500 font-medium">Aucune demande en attente de validation.</td>
                                    </tr>
                                ) : (
                                    filteredDemandes.map((colis) => (
                                        <tr key={colis.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="py-4 px-6 font-semibold text-indigo-600 dark:text-indigo-400">{colis.codeRetrait || 'PRÉ-ENREGISTRÉ'}</td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900 dark:text-white">{colis.nomExpediteur}</div>
                                                <div className="text-xs text-gray-500">{colis.telExpediteur}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900 dark:text-white">{colis.nomDestinataire}</div>
                                                <div className="text-xs text-gray-500">{colis.telDestinataire}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium truncate max-w-[185px]">{colis.description}</div>
                                                <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                                                    <span>{colis.poidsKg} kg</span>
                                                    {colis.estFragile && <span className="text-red-500">Fragile</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                                                {colis.trajet ? (colis.trajet.label || `${colis.trajet.depart || ''} → ${colis.trajet.destination || ''}`) : 'Non assigné'}
                                            </td>
                                            <td className="py-4 px-6 font-bold whitespace-nowrap">{renderDoubleDevise(colis.prix, colis.devise)}</td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30">
                                                    {colis.niveauRisqueIA || colis.niveauRisqueIa || 'NON_EVALUE'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleValiderDemande(colis)}
                                                    disabled={submittingValidation[colis.id]}
                                                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                                >
                                                    {submittingValidation[colis.id] ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                                    Valider la prise en charge
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* BOÎTE DE DIALOGUE (MODAL) REPLACÉE ET COMPLÈTE */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {selectedColis ? 'Modifier/Compléter le Colis' : 'Enregistrer un nouveau colis'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"><FaTimes /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Toggle Mode Standard / Assistant IA */}
                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                <button type="button" onClick={() => setIsAiMode(false)} className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${!isAiMode ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>Mode Standard</button>
                                <button type="button" onClick={() => { setIsAiMode(true); setStep(1); }} className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${isAiMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'}`}><FaRobot /> Tarification Assistée par IA</button>
                            </div>
                            
                            {(!isAiMode || step === 1) && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nom Expéditeur</label>
                                            <input type="text" name="nomExpediteur" required value={formData.nomExpediteur} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Téléphone Expéditeur</label>
                                            <input type="text" name="telExpediteur" required value={formData.telExpediteur} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nom Destinataire</label>
                                            <input type="text" name="nomDestinataire" required value={formData.nomDestinataire} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Téléphone Destinataire</label>
                                            <input type="text" name="telDestinataire" required value={formData.telDestinataire} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                                            <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm">
                                                <option value="COLIS">Colis</option>
                                                <option value="COURRIER">Courrier</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Poids (kg)</label>
                                            <input type="number" step="0.1" name="poidsKg" required value={formData.poidsKg} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trajet</label>
                                            <select name="trajetId" required value={formData.trajetId} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm">
                                                <option value="">Sélectionner un itinéraire</option>
                                                {trajets.map(t => (
                                                    <option key={t.id} value={t.id}>{t.label || `${t.depart} → ${t.destination}`}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Valeur Estimée</label>
                                            <input type="number" name="valeurEstimee" required value={formData.valeurEstimee} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Devise Déclaration</label>
                                            <select name="devise" value={formData.devise} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm">
                                                <option value="FC">Franc Congolais (FC)</option>
                                                <option value="USD">Dollar Américain ($)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description du contenu</label>
                                        <textarea name="description" rows="2" required value={formData.description} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: Vêtements, pièces de rechange, documents officiels..."></textarea>
                                    </div>
                                    <div className="flex items-center gap-2 py-2">
                                        <input type="checkbox" name="estFragile" id="estFragile" checked={formData.estFragile} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                        <label htmlFor="estFragile" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">Ce colis contient des objets fragiles</label>
                                    </div>
                                    {!isAiMode && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prix d'expédition fixé</label>
                                            <input type="number" name="prix" required value={formData.prix} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm" />
                                        </div>
                                    )}
                                    {isAiMode && (
                                        <button type="button" onClick={handleAiAnalysis} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50">
                                            {loading ? <FaSpinner className="animate-spin" /> : <FaRobot />} Lancer l'analyse et l'estimation IA
                                        </button>
                                    )}
                                </div>
                            )}
                            {isAiMode && step === 2 && aiReport && (
                                <div className="space-y-4 bg-indigo-50/50 dark:bg-indigo-950/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0"><FaRobot className="text-xl" /></div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">Rapport d'Analyse Automatique</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Généré instantanément sur la base des caractéristiques du colis.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Évaluation Risque</span>
                                            <span className={`inline-flex items-center gap-1 text-sm font-bold mt-1 ${aiReport.niveauRisqueIa === 'ELEVE' || aiReport.niveauRisqueIA === 'ELEVE' ? 'text-red-500' : 'text-emerald-500'}`}>{aiReport.niveauRisqueIa || aiReport.niveauRisqueIA || 'NON_EVALUE'}</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Prix Suggéré IA</span>
                                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">{aiReport.prixSuggereIa || aiReport.prixSuggereIA || 'N/A'} {formData.devise}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Justificatif de l'estimation</span>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{aiReport.explication || aiReport.explicationIA || 'Aucune justification fournie.'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ajuster ou Confirmer le Prix final ({formData.devise})</label>
                                        <input type="number" name="prix" required value={formData.prix} onChange={handleChange} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold" />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 font-medium py-2.5 rounded-xl transition-all text-sm">Retour aux champs</button>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                                <button type="submit" disabled={isAiMode && step === 1} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
                                    {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {selectedColis ? 'Sauvegarder les modifications' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourriersPage;
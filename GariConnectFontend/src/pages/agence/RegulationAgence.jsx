import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const RegulationAgence = ({ isDarkMode: propIsDarkMode }) => {
    // 1. Gestion du thème synchronisée (Prop externe ou localStorage de la Navbar)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (propIsDarkMode !== undefined) return propIsDarkMode;
        return localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
        if (propIsDarkMode !== undefined) {
            setIsDarkMode(propIsDarkMode);
        }
    }, [propIsDarkMode]);

    // Écoute également les changements du localStorage provoqués par la Navbar (inter-onglets et intra-page)
    useEffect(() => {
        const handleThemeChange = () => {
            setIsDarkMode(localStorage.getItem('theme') === 'dark');
        };

        // Événement standard pour les autres onglets
        window.addEventListener('storage', handleThemeChange);
        
        // Événement personnalisé au cas où votre Navbar émet un CustomEvent, 
        // ou interception des clics globaux sur le bouton de thème pour forcer la réévaluation instantanée
        window.addEventListener('themeChange', handleThemeChange);
        document.addEventListener('click', handleThemeChange);

        return () => {
            window.removeEventListener('storage', handleThemeChange);
            window.removeEventListener('themeChange', handleThemeChange);
            document.removeEventListener('click', handleThemeChange);
        };
    }, []);

    // Listes de données
    const [trajets, setTrajets] = useState([]);
    const [trajetSelectionneId, setTrajetSelectionneId] = useState('');
    const [arrets, setArrets] = useState([]);
    
    // Sélections et détails
    const [arretSelectionne, setArretSelectionne] = useState(null);
    const [clientsEnAttente, setClientsEnAttente] = useState([]);
    
    // États UI
    const [loading, setLoading] = useState(false);
    const [isSearchingLoc, setIsSearchingLoc] = useState(false); // État pour la recherche API
    const [ongletActif, setOngletActif] = useState('liste'); // 'liste' ou 'creer'

    // Formulaire Nouveau arrêt
    const [nouveauArret, setNouveauArret] = useState({ nom: '', latitude: '0.0', longitude: '0.0' });

    // Récupération des en-têtes d'authentification JWT
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }, []);

    // Configuration des couleurs selon le mode
    const theme = {
        background: isDarkMode ? '#0f172a' : '#f1f5f9',
        surface: isDarkMode ? '#1e293b' : '#ffffff',
        surfaceSecondary: isDarkMode ? '#334155' : '#f8fafc',
        text: isDarkMode ? '#f8fafc' : '#0f172a',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        border: isDarkMode ? '#475569' : '#e2e8f0',
        accent: isDarkMode ? '#3b82f6' : '#1e40af',
        accentHover: isDarkMode ? '#2563eb' : '#1d4ed8',
        inputBg: isDarkMode ? '#1e293b' : '#ffffff',
        tableHeaderBg: isDarkMode ? '#1e293b' : '#e2e8f0',
        rowHover: isDarkMode ? '#334155' : '#f1f5f9',
        selectedRow: isDarkMode ? '#1e3a8a' : '#dbeafe'
    };

    // 1. Charger la liste des trajets disponibles au démarrage
    useEffect(() => {
        const chargerTrajets = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/trajets', getAuthHeaders());
                setTrajets(response.data);
            } catch (err) {
                console.error("Erreur lors du chargement des trajets", err);
            }
        };
        chargerTrajets();
    }, [getAuthHeaders]);

    // 2. Charger les arrêts et leurs statistiques pour le trajet sélectionné
    const chargerStatsArrets = useCallback(async () => {
        if (!trajetSelectionneId) {
            setArrets([]);
            return;
        }
        try {
            const url = `http://localhost:8080/api/arrets/statistiques?trajetId=${trajetSelectionneId}`;
            const response = await axios.get(url, getAuthHeaders());
            
            if (Array.isArray(response.data)) {
                setArrets(response.data);
                
                if (arretSelectionne) {
                    const arretMisAJour = response.data.find(a => a.id === arretSelectionne.id);
                    if (arretMisAJour) setArretSelectionne(arretMisAJour);
                }
            } else {
                console.warn("L'API n'a pas renvoyé un tableau d'arrêts :", response.data);
                setArrets([]);
            }
        } catch (err) {
            console.error("Erreur de chargement des arrêts", err);
            setArrets([]); 
        }
    }, [trajetSelectionneId, arretSelectionne, getAuthHeaders]);

    // Déclencheur du rafraîchissement
    useEffect(() => {
        chargerStatsArrets();
        const interval = setInterval(chargerStatsArrets, 8000);
        return () => clearInterval(interval);
    }, [chargerStatsArrets]);

    // 3. Cliquer sur un arrêt pour voir ses clients
    const handleSelectArret = async (arret) => {
        setArretSelectionne(arret);
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/arrets/${arret.id}/clients`, getAuthHeaders());
            setClientsEnAttente(response.data || []);
            
            if (window.innerWidth < 1024) {
                document.getElementById('details-panel')?.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (err) {
            console.error("Erreur de chargement des clients de l'arrêt", err);
            setClientsEnAttente([]);
        } finally {
            setLoading(false);
        }
    };

    // 📍 4. API OPENSTREETMAP : Rechercher les coordonnées d'après le nom saisi
    const rechercherCoordonnees = async () => {
        if (!nouveauArret.nom) {
            alert("Veuillez d'abord saisir le nom de l'arrêt à chercher.");
            return;
        }
        setIsSearchingLoc(true);
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: nouveauArret.nom,
                    format: 'json',
                    limit: 1
                }
            });
            if (response.data && response.data.length > 0) {
                const { lat, lon } = response.data[0];
                setNouveauArret(prev => ({
                    ...prev,
                    latitude: parseFloat(lat).toFixed(6),
                    longitude: parseFloat(lon).toFixed(6)
                }));
            } else {
                alert("Coordonnées introuvables. Essayez d'ajouter la ville (ex: 'Victoire, Kinshasa').");
            }
        } catch (error) {
            console.error("Erreur de géocodage", error);
            alert("Erreur lors de la communication avec le service de cartographie.");
        } finally {
            setIsSearchingLoc(false);
        }
    };

    // 5. Soumettre la création d'un nouvel arrêt
    const handleCreerArret = async (e) => {
        e.preventDefault();
        
        if (!trajetSelectionneId) {
            alert("Veuillez sélectionner un trajet avant d'ajouter un arrêt.");
            return;
        }
        if (!nouveauArret.nom) {
            alert("Le nom de l'arrêt est obligatoire.");
            return;
        }
        try {
            const payload = {
                nom: nouveauArret.nom,
                latitude: parseFloat(nouveauArret.latitude || 0),
                longitude: parseFloat(nouveauArret.longitude || 0),
                trajetId: parseInt(trajetSelectionneId, 10)
            };
            await axios.post('http://localhost:8080/api/arrets', payload, getAuthHeaders());
            alert("Arrêt ajouté avec succès !");
            
            setNouveauArret({ nom: '', latitude: '0.0', longitude: '0.0' });
            setOngletActif('liste');
            await chargerStatsArrets();
            
        } catch (err) {
            console.error("Erreur de création de l'arrêt:", err.response?.data || err.message);
            
            if (err.response && err.response.data && err.response.data.message) {
                 alert(`Erreur: ${err.response.data.message}`);
            } else {
                 alert("Impossible d'enregistrer l'arrêt. Veuillez vérifier vos autorisations.");
            }
        }
    };

    return (
        <div className={`regulation-dashboard ${isDarkMode ? 'dark' : 'light'}`}>
            <div className="dashboard-grid">
                
                {/* --- PANNEAU DE GAUCHE : SÉLECTION DU TRAJET & TABLEAU DES ARRÊTS --- */}
                <div className="panel left-panel">
                    <div className="section-header">
                        <h2>Lignes & Arrêts Réseau</h2>
                    </div>
                    <div className="filter-card">
                        <label className="form-label">Sélectionner un trajet à réguler</label>
                        <div className="select-wrapper">
                            <select 
                                value={trajetSelectionneId} 
                                onChange={(e) => {
                                    setTrajetSelectionneId(e.target.value);
                                    setArretSelectionne(null);
                                    setClientsEnAttente([]);
                                    setArrets([]);
                                }}
                                className="custom-select"
                            >
                                <option value="">-- Choisir une ligne de transport --</option>
                                {trajets.map(t => (
                                    <option key={t.id} value={t.id}>{t.depart} ➔ {t.destination}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="content-card">
                        <div className="table-header-flex">
                            <h3>Arrêts sur la ligne</h3>
                            {trajetSelectionneId && (
                                <button 
                                    onClick={() => setOngletActif(ongletActif === 'creer' ? 'liste' : 'creer')}
                                    className={`btn-action ${ongletActif === 'creer' ? 'btn-danger' : 'btn-primary'}`}
                                >
                                    {ongletActif === 'creer' ? 'Fermer' : '➕ Ajouter un arrêt'}
                                </button>
                            )}
                        </div>
                        {!trajetSelectionneId ? (
                            <div className="empty-state-inline">
                                <p>Veuillez sélectionner un trajet ci-dessus pour charger les arrêts.</p>
                            </div>
                        ) : arrets.length === 0 ? (
                            <div className="empty-state-inline">
                                <p>Aucun arrêt n'a pu être chargé pour ce trajet. Cliquez sur "Ajouter un arrêt" pour en créer un.</p>
                            </div>
                        ) : (
                            <div className="responsive-table-container">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Code ID</th>
                                            <th>Nom de l'Arrêt</th>
                                            <th style={{ textAlign: 'center' }}>Passagers à Quai</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {arrets.map((arret) => {
                                            const estSelectionne = arretSelectionne?.id === arret.id;
                                            return (
                                                <tr 
                                                    key={arret.id} 
                                                    onClick={() => handleSelectArret(arret)}
                                                    className={`interactive-row ${estSelectionne ? 'selected-row' : ''}`}
                                                >
                                                    <td className="td-id">#{arret.id}</td>
                                                    <td className="td-name">
                                                        <span className="icon-stop">🚏</span> {arret.nom || 'Arrêt sans nom'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`badge-count ${arret.nombrePassagersEnAttente > 0 ? 'badge-danger' : 'badge-success'}`}>
                                                            {arret.nombrePassagersEnAttente || 0}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PANNEAU DE DROITE : FORMULAIRE DE CRÉATION OU TABLEAU DES CLIENTS --- */}
                <div id="details-panel" className="panel right-panel">
                    {ongletActif === 'creer' ? (
                        <div className="content-card content-card-full">
                            <h3 className="panel-title">➕ Ajouter un nouvel arrêt</h3>
                            <form onSubmit={handleCreerArret} className="modern-form">
                                <div className="form-group">
                                    <label className="form-label">Nom de la Station / Arrêt :</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Arrêt Rond-point Victoire" 
                                            value={nouveauArret.nom}
                                            onChange={(e) => setNouveauArret({ ...nouveauArret, nom: e.target.value })}
                                            className="modern-input"
                                            style={{ flex: 1 }}
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            onClick={rechercherCoordonnees}
                                            disabled={isSearchingLoc}
                                            className="btn-action btn-secondary"
                                            style={{ padding: '0 16px', whiteSpace: 'nowrap' }}
                                        >
                                            {isSearchingLoc ? '⏳...' : '📍 Localiser'}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label label-muted">Latitude :</label>
                                        <input 
                                            type="text" 
                                            value={nouveauArret.latitude}
                                            onChange={(e) => setNouveauArret({ ...nouveauArret, latitude: e.target.value })}
                                            className="modern-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label label-muted">Longitude :</label>
                                        <input 
                                            type="text" 
                                            value={nouveauArret.longitude}
                                            onChange={(e) => setNouveauArret({ ...nouveauArret, longitude: e.target.value })}
                                            className="modern-input"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-submit">
                                    Enregistrer la station
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="content-card content-card-full">
                            {!arretSelectionne ? (
                                <div className="full-empty-state">
                                    <div className="empty-icon">👥</div>
                                    <h3>Visualisation des Clients</h3>
                                    <p>
                                        Sélectionnez un arrêt dans le tableau de gauche pour inspecter en temps réel la liste des passagers à quai.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="details-header">
                                        <div>
                                            <h2 className="selected-title">{arretSelectionne.nom}</h2>
                                            <span className="subtitle-pill">
                                                File d'embarquement • {clientsEnAttente.length} voyageurs
                                            </span>
                                        </div>
                                    </div>
                                    {loading ? (
                                        <div className="spinner-container">
                                            <div className="spinner"></div>
                                            <p>Mise à jour des flux passagers...</p>
                                        </div>
                                    ) : clientsEnAttente.length === 0 ? (
                                        <div className="full-empty-state compact">
                                            <p>Aucun passager enregistré à cet arrêt sur ce créneau.</p>
                                        </div>
                                    ) : (
                                        <div className="responsive-table-container">
                                            <table className="modern-table">
                                                <thead>
                                                    <tr>
                                                        <th>Nom & Prénom</th>
                                                        <th>Code Ticket</th>
                                                        <th style={{ textAlign: 'center' }}>N° Siège</th>
                                                        <th style={{ textAlign: 'right' }}>Statut</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {clientsEnAttente.map((c) => (
                                                        <tr key={c.id}>
                                                            <td className="td-passenger-name">
                                                                {c.client?.nom} {c.client?.prenom}
                                                            </td>
                                                            <td>
                                                                <span className="ticket-code">{c.codeTicket}</span>
                                                            </td>
                                                            <td style={{ textAlign: 'center', fontWeight: '600' }}>
                                                                {c.numeroSiege || '—'}
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <span className="status-badge">À quai</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .regulation-dashboard.light {
                    --bg-main: #f8fafc;
                    --bg-surface: #ffffff;
                    --bg-card: #ffffff;
                    --bg-input: #f1f5f9;
                    --border-color: #e2e8f0;
                    --text-main: #0f172a;
                    --text-muted: #64748b;
                    --accent: #2563eb;
                    --accent-hover: #1d4ed8;
                    --secondary: #e2e8f0;
                    --secondary-hover: #cbd5e1;
                    --secondary-text: #0f172a;
                    --row-hover: #f1f5f9;
                    --row-selected: #eff6ff;
                    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
                }
                .regulation-dashboard.dark {
                    --bg-main: #0f172a;
                    --bg-surface: #1e293b;
                    --bg-card: #1e293b;
                    --bg-input: #334155;
                    --border-color: #334155;
                    --text-main: #f8fafc;
                    --text-muted: #94a3b8;
                    --accent: #3b82f6;
                    --accent-hover: #60a5fa;
                    --secondary: #334155;
                    --secondary-hover: #475569;
                    --secondary-text: #f8fafc;
                    --row-hover: #334155;
                    --row-selected: #1e3a8a;
                    --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                }
                .regulation-dashboard {
                    background-color: var(--bg-main);
                    color: var(--text-main);
                    min-height: 100vh;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    transition: background-color 0.3s ease, color 0.3s ease;
                    box-sizing: border-box;
                }
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                    padding: 24px;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                @media (min-width: 1024px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr 1.2fr;
                        height: calc(100vh - 48px);
                        overflow: hidden;
                    }
                    .panel { height: 100%; overflow-y: auto; }
                }
                .panel { display: flex; flex-direction: column; gap: 20px; }
                .section-header h2 { font-size: 1.5rem; font-weight: 700; margin: 0; letter-spacing: -0.025em; }
                .filter-card, .content-card {
                    background-color: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: var(--shadow);
                }
                .content-card-full { flex: 1; display: flex; flex-direction: column; }
                
                .form-label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 8px; }
                .label-muted { color: var(--text-muted); }
                .custom-select, .modern-input {
                    width: 100%; padding: 12px 16px; background-color: var(--bg-input);
                    color: var(--text-main); border: 1px solid var(--border-color);
                    border-radius: 8px; font-size: 0.95rem; outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
                }
                .custom-select:focus, .modern-input:focus {
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
                }
                .form-grid-2 { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 16px; }
                @media (min-width: 640px) { .form-grid-2 { grid-template-columns: 1fr 1fr; } }
                .modern-form { display: flex; flex-direction: column; gap: 16px; margin-top: 12px; }
                .responsive-table-container { overflow-x: auto; width: 100%; border-radius: 8px; }
                .modern-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
                .modern-table th {
                    background-color: var(--bg-input); padding: 14px 16px; font-weight: 600;
                    color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem;
                    letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color);
                }
                .modern-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
                .interactive-row { cursor: pointer; transition: background-color 0.15s ease; }
                .interactive-row:hover { background-color: var(--row-hover); }
                .selected-row { background-color: var(--row-selected) !important; font-weight: 500; }
                .td-id { font-family: monospace; font-weight: bold; color: var(--text-muted); }
                .td-name { font-weight: 500; }
                .icon-stop { margin-right: 6px; }
                .btn-action {
                    padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;
                    border: none; cursor: pointer; transition: background-color 0.2s, transform 0.1s;
                }
                .btn-action:active { transform: scale(0.98); }
                .btn-action:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-primary { background-color: var(--accent); color: white; }
                .btn-primary:hover { background-color: var(--accent-hover); }
                .btn-secondary { background-color: var(--secondary); color: var(--secondary-text); border: 1px solid var(--border-color); }
                .btn-secondary:hover { background-color: var(--secondary-hover); }
                .btn-danger { background-color: #ef4444; color: white; }
                .btn-danger:hover { background-color: #dc2626; }
                .btn-submit {
                    background-color: var(--accent); color: white; padding: 14px; border: none;
                    border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.95rem;
                    margin-top: 12px; transition: background-color 0.2s;
                }
                .btn-submit:hover { background-color: var(--accent-hover); }
                .badge-count { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: white; }
                .badge-danger { background-color: #ef4444; }
                .badge-success { background-color: #10b981; }
                .status-badge {
                    background-color: #e0f2fe; color: #0369a1; padding: 4px 10px;
                    border-radius: 6px; font-size: 0.75rem; font-weight: 600;
                }
                .dark .status-badge { background-color: #0369a1; color: #e0f2fe; }
                .ticket-code {
                    font-family: 'Courier New', Courier, monospace; font-weight: 700;
                    color: var(--accent); letter-spacing: 0.05em;
                }
                .empty-state-inline { text-align: center; padding: 30px 10px; color: var(--text-muted); font-style: italic; font-size: 0.9rem; }
                .full-empty-state {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    text-align: center; gap: 12px; flex: 1; padding: 60px 20px;
                }
                .full-empty-state.compact { padding: 40px 20px; color: var(--text-muted); }
                .empty-icon { font-size: 3.5rem; opacity: 0.7; }
                .full-empty-state h3 { margin: 0; font-size: 1.25rem; font-weight: 600; }
                .full-empty-state p { margin: 0; color: var(--text-muted); max-width: 360px; font-size: 0.9rem; line-height: 1.5; }
                .table-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .table-header-flex h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
                .details-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); }
                .selected-title { margin: 0 0 6px 0; font-size: 1.4rem; font-weight: 700; }
                .subtitle-pill { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
                .spinner-container { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 0; color: var(--text-muted); font-size: 0.9rem; }
                .spinner { width: 28px; height: 28px; border: 3px solid var(--border-color); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default RegulationAgence;
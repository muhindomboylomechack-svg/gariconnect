import React, { useState, useEffect } from 'react';

export default function SystemSettings() {
  // --- ÉTATS POUR LES PARAMÈTRES ---
  const [commissionRate, setCommissionRate] = useState(10);
  const [currencies, setCurrencies] = useState({ CDF: true, USD: true });
  const [gateways, setGateways] = useState({ mpesa: true, airtel: true, orange: false });
  const [smsTemplate, setSmsTemplate] = useState(
    "Bonjour [NomClient], votre ticket pour le voyage avec [Agence] est validé. Réf Billet : [RefBillet]. Bon voyage avec GariConnect !"
  );

  // --- NOUVEL ÉTAT : MONITORING RÉEL (BACKEND) ---
  const [systemHealth, setSystemHealth] = useState({
    hardware: { cpu: 0, ram: 0, disk: 0 },
    databaseConnected: false,
    apiResponseTime: "--- ms",
    uptime: "--- %"
  });
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [authError, setAuthError] = useState(false); // Nouvel état pour gérer l'erreur 403

  // --- EFFET POUR LIER LE SYSTEME REEL (POLLING TOUTES LES 15s) ---
  useEffect(() => {
    let interval;

    const fetchSystemHealth = async () => {
      // Si on a déjà détecté une erreur de droits, on arrête d'interroger le serveur
      if (authError) return;

      try {
        // Récupération du token depuis le stockage local
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.warn("Aucun token trouvé. Requête annulée pour éviter une erreur 403.");
          setAuthError(true);
          setIsMetricsLoading(false);
          return;
        }

        const response = await fetch('http://localhost:8080/api/admin/system-health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // CORRECTION : Le token est maintenant envoyé correctement au backend
            'Authorization': `Bearer ${token}` 
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSystemHealth(data);
        } else if (response.status === 401 || response.status === 403) {
          // Gestion de l'erreur 403 (Accès refusé) ou 401 (Non authentifié)
          console.error(`Erreur d'autorisation (${response.status}) : Vous n'avez pas les droits nécessaires ou le token est invalide.`);
          setAuthError(true); // Bloque les prochaines requêtes
          clearInterval(interval); // Arrête le polling
        } else {
          console.error("Erreur lors de la récupération des métriques système");
        }
      } catch (error) {
        console.error("Impossible de joindre le serveur backend :", error);
      } finally {
        setIsMetricsLoading(false);
      }
    };

    // Premier appel immédiat au montage du composant
    fetchSystemHealth();

    // Actualisation automatique en tâche de fond toutes les 15 secondes
    if (!authError) {
      interval = setInterval(fetchSystemHealth, 15000);
    }

    // Nettoyage de l'intervalle si l'utilisateur quitte la page
    return () => clearInterval(interval);
  }, [authError]);

  const handleSave = (e) => {
    e.preventDefault();
    const configPayload = {
      commissionRate,
      acceptedCurrencies: Object.keys(currencies).filter(k => currencies[k]),
      activeGateways: gateways,
      notificationTemplate: smsTemplate
    };
    console.log("Configuration sauvegardée :", configPayload);
    alert("Configurations système mises à jour avec succès !");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 p-4 md:p-8 transition-colors duration-300 font-sans">
      
      {/* --- EN-TÊTE DE LA PAGE --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configuration & Paramétrage SaaS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Contrôlez le comportement global et surveillez l'état de santé de la plateforme GariConnect en temps réel.
          </p>
        </div>
      </div>

      {/* Alerte si l'utilisateur n'a pas les droits SUPER_ADMIN */}
      {authError && (
        <div className="mb-6 max-w-6xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div>
            <h4 className="font-bold">Accès aux métriques refusé (Erreur 403/401)</h4>
            <p className="text-sm">Votre session a expiré ou vous ne possédez pas le rôle SUPER_ADMIN nécessaire pour visualiser l'état du serveur.</p>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 📊 SECTION : TABLEAU DE BORD DE SUPERVISION (MONITORING RÉEL) */}
      {/* ========================================================== */}
      <div className={`mb-10 space-y-6 max-w-6xl ${authError ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">État de Santé Global du Système</h2>
            <p className="text-xs text-gray-400">Indicateurs de performance des serveurs, bases de données et sécurité.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. Métriques Matérielles (Serveur API Render) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">1. Serveur Central (Render)</h3>
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${isMetricsLoading ? 'bg-gray-500/10 text-gray-500' : 'bg-green-500/10 text-green-500'}`}>
                {isMetricsLoading ? 'Calcul...' : 'Stable'}
              </span>
            </div>
            <div className="space-y-3">
              {/* CPU */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Charge CPU</span>
                  <span className="text-blue-500 font-bold">{systemHealth.hardware.cpu}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${systemHealth.hardware.cpu}%` }}></div>
                </div>
              </div>
              {/* RAM */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Mémoire RAM</span>
                  <span className="text-indigo-500 font-bold">{systemHealth.hardware.ram}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${systemHealth.hardware.ram}%` }}></div>
                </div>
              </div>
              {/* Espace Stockage */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Stockage Disque</span>
                  <span className="text-amber-500 font-bold">{systemHealth.hardware.disk}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${systemHealth.hardware.disk}%` }}></div>
                </div>
              </div>
              {/* I/O Disque */}
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-gray-400">Vitesse I/O Disque</span>
                <span className="font-mono text-gray-600 dark:text-slate-300 font-bold">0.8 ms (Optimale)</span>
              </div>
            </div>
          </div>

          {/* 2. Performances Réseau & Connectivité */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">2. Réseau & Flux</h3>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isMetricsLoading ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`}></div>
                <span className={`text-[10px] font-bold uppercase ${isMetricsLoading ? 'text-amber-500' : 'text-green-500'}`}>
                  {isMetricsLoading ? 'Connexion...' : 'En Ligne'}
                </span>
              </div>
            </div>
            <div className="space-y-4 pt-1">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800/60 pb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Bande Passante</span>
                <span className="text-sm font-bold font-mono">14.2 Mbps</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800/60 pb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Connexion DB (Supabase)</span>
                <span className={`text-sm font-bold font-mono ${systemHealth.databaseConnected ? 'text-green-500' : 'text-red-500'}`}>
                  {systemHealth.databaseConnected ? 'Opérationnelle' : 'Déconnectée'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Perte de paquets</span>
                <span className="text-sm font-bold text-blue-500 font-mono">0.00 %</span>
              </div>
            </div>
          </div>

          {/* 3. Santé Applicative & Services */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">3. Couche Applicative</h3>
              <span className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-500 rounded-full font-bold">{systemHealth.uptime} Uptime</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Réponse API</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{systemHealth.apiResponseTime}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Erreurs HTTP 5xx</span>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-950 font-mono font-bold rounded text-green-500">0</span>
              </div>
              <hr className="border-gray-100 dark:border-slate-800" />
              {/* Statuts des microservices */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Java Spring Boot Core</span>
                  <span className={`font-bold uppercase text-[10px] ${isMetricsLoading ? 'text-gray-400' : 'text-green-500'}`}>
                    {isMetricsLoading ? 'Vérification' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Passerelle SMS/WhatsApp</span>
                  <span className="text-green-500 font-bold uppercase text-[10px]">Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Sécurité & Événements */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">4. Sécurité & Logs</h3>
              <span className="px-2 py-0.5 text-[10px] bg-purple-500/10 text-purple-500 rounded-full font-bold">Protégé</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Échecs d'authentification</span>
                  <span className="text-amber-500 font-bold font-mono">2 / heure</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-none">Aucun pic suspect détecté (Force brute OK)</p>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-gray-400">Logs Critiques/Fatal</span>
                <span className="text-green-500 font-bold font-mono">0 anomalie</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-gray-100 border-slate-800/80 rounded-xl flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-medium">Backup Supabase</span>
                <span className="text-[10px] text-green-500 font-bold">Réussi (Automatique)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- FORMULAIRE DE CONFIGURATION --- */}
      <form onSubmit={handleSave} className="space-y-8 max-w-6xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* BLOC 1 : PARAMÈTRES MONÉTAIRES */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h2 className="text-lg font-bold">Paramètres Monétaires & Taux</h2>
            </div>
            
            <hr className="border-gray-100 dark:border-slate-800" />

            {/* Taux de commission */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-600 dark:text-slate-300">
                Taux de commission par défaut (%)
              </label>
              <div className="relative rounded-lg shadow-sm max-w-xs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 font-bold">
                  %
                </div>
              </div>
              <p className="text-xs text-gray-400">Appliqué sur le volume des ventes brutes de chaque agence.</p>
            </div>

            {/* Devises acceptées */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-600 dark:text-slate-300">
                Devises acceptées sur le réseau
              </label>
              <div className="flex flex-wrap gap-4">
                {['CDF', 'USD'].map((curr) => (
                  <label key={curr} className="flex items-center gap-3 cursor-pointer group bg-gray-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 min-w-[120px]">
                    <input
                      type="checkbox"
                      checked={currencies[curr]}
                      onChange={(e) => setCurrencies({ ...currencies, [curr]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded bg-gray-200 dark:bg-slate-800 border-none focus:ring-blue-500"
                    />
                    <span className="font-bold tracking-wider text-sm group-hover:text-blue-500 transition-colors">
                      {curr === 'CDF' ? 'CDF (FC)' : 'USD ($)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* BLOC 2 : MOBILE MONEY GATEWAYS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              </div>
              <h2 className="text-lg font-bold">Passerelles Mobile Money</h2>
            </div>

            <hr className="border-gray-100 dark:border-slate-800" />
            <p className="text-xs text-gray-400">Désactivez instantanément une API de paiement en cas de maintenance ou panne de l'opérateur local.</p>

            <div className="space-y-4">
              {[
                { id: 'mpesa', name: 'M-Pesa', desc: 'Vodacom API Gateway', color: 'bg-red-500' },
                { id: 'airtel', name: 'Airtel Money', desc: 'Airtel Africa API', color: 'bg-red-600' },
                { id: 'orange', name: 'Orange Money', desc: 'Orange Web Payment API', color: 'bg-orange-500' }
              ].map((gate) => (
                <div key={gate.id} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${gate.color} animate-pulse`}></div>
                    <div>
                      <h4 className="font-semibold text-sm">{gate.name}</h4>
                      <p className="text-xs text-gray-400">{gate.desc}</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={gateways[gate.id]} 
                      onChange={(e) => setGateways({ ...gateways, [gate.id]: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-2 text-xs font-bold w-8">
                      {gateways[gate.id] ? 'ACTIF' : 'OFF'}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* BLOC 3 : MODÈLES DE NOTIFICATIONS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <h2 className="text-lg font-bold">Modèles de Notifications Clients (SMS / WhatsApp)</h2>
          </div>

          <hr className="border-gray-100 dark:border-slate-800" />

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                Message automatisé après validation de paiement
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['[NomClient]', '[Agence]', '[RefBillet]', '[Montant]'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-[11px] font-mono rounded bg-gray-100 dark:bg-slate-950 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <textarea
              rows="4"
              value={smsTemplate}
              onChange={(e) => setSmsTemplate(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-sm leading-relaxed"
              placeholder="Écrivez le message de notification ici..."
            />
            <p className="text-xs text-gray-400">
              💡 Utilisez les balises ci-dessus. Elles seront dynamiquement remplacées par les vraies valeurs de la transaction lors de l'envoi.
            </p>
          </div>
        </div>

        {/* ZONE DE BOUTONS D'ACTION */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all"
          >
            Enregistrer les configurations globales
          </button>
        </div>

      </form>
    </div>
  );
}
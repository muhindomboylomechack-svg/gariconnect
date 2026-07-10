import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  FaUsers, FaHandshake, FaTicketAlt, 
  FaSync, FaExclamationTriangle, FaBuilding, FaInfoCircle 
} from 'react-icons/fa';

import api from '../../services/api'; 

const DashboardAdmin = () => {
  const [data, setData] = useState({
    totalUsers: 0,
    totalReservations: 0,
    totalCommissions: 0, 
    activeTenants: 0,
    chartData: [], 
    paymentMethodsData: [],
    recentActivities: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('commissions');

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [financesRes, agenciesRes] = await Promise.all([
        api.get('/admin/finances/stats-globales'),
        api.get('/users/count-agencies')
      ]);

      const serverData = financesRes.data;
      const totalAgencesBDD = agenciesRes.data?.count || 0;

      const mappedData = {
        totalCommissions: serverData.revenusGariConnectNet || 0,
        activeTenants: totalAgencesBDD,
        totalReservations: serverData.billetsConfirmes || 0,
        totalUsers: serverData.totalUsers || 0,
        chartData: serverData.chartData || [], 
        paymentMethodsData: serverData.paymentMethodsData || [], 
        recentActivities: serverData.recentActivities || []
      };
      
      setData(mappedData);
    } catch (error) {
      console.error("Erreur Backend SuperAdmin:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="h-[60vh] flex flex-col justify-center items-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Synchronisation des flux SaaS...</p>
    </div>
  );

  if (error) return (
    <div className="h-[60vh] flex flex-col justify-center items-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-10 shadow-xl">
      <FaExclamationTriangle className="text-rose-500 text-5xl mb-6" />
      <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Erreur Système</h2>
      <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest text-center">Impossible de charger la vue d'ensemble du réseau.</p>
      <button onClick={loadData} className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-colors">
        <FaSync /> Réessayer
      </button>
    </div>
  );

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
            Gari<span className="text-blue-600">Stats</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Console Super Admin Centralisée</p>
          </div>
        </div>
        <button onClick={loadData} className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500 transition-all font-black text-xs uppercase flex items-center gap-3 shadow-sm text-slate-800 dark:text-slate-200">
          <FaSync className={loading ? "animate-spin" : ""} /> Actualiser la grille
        </button>
      </div>

      {/* 4-STATS GRID CONNECTÉE EN TEMPS RÉEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Revenus GariConnect" value={`${data.totalCommissions.toLocaleString()} FC`} icon={<FaHandshake/>} color="bg-blue-600" />
        <StatCard title="Tenants Partenaires" value={`${data.activeTenants} Actifs`} icon={<FaBuilding/>} color="bg-violet-600" />
        <StatCard title="Réservations Réseau" value={data.totalReservations} icon={<FaTicketAlt/>} color="bg-orange-500" />
        <StatCard title="Comptes Utilisateurs" value={data.totalUsers} icon={<FaUsers/>} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRAPHIQUES CONFIGURABLES */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
              Analyses Métriques <span className="text-blue-600">Plateforme</span>
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
              <button 
                onClick={() => setActiveTab('commissions')}
                className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'commissions' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Commissions / Agence
              </button>
              <button 
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'payments' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Modes de Paiement
              </button>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '350px' }}>
            {activeTab === 'commissions' ? (
              data.chartData && data.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc2" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10}}
                      unit=" FC"
                    />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9', radius: 10}}
                      contentStyle={{borderRadius: '1rem', border:'none', backgroundColor:'#1e293b', color:'#fff'}} 
                    />
                    <Bar dataKey="commission" radius={[10, 10, 0, 0]} barSize={40}>
                      {data.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyStateMessage message="Aucune statistique d'agence répertoriée" />
              )
            ) : (
              data.paymentMethodsData && data.paymentMethodsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentMethodsData}
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.paymentMethodsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '1rem', border:'none', backgroundColor:'#1e293b', color:'#fff'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase'}}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyStateMessage message="En attente des données transactionnelles" />
              )
            )}
          </div>
        </div>

        {/* FLUX D'AUDIT GLOBAL + MODULE LÉGENDE */}
        <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Flux d'audit global</h3>
            </div>
            
            <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {data.recentActivities && data.recentActivities.length > 0 ? (
                data.recentActivities.map((act, index) => (
                  <div key={index} className="flex gap-6 relative group">
                    <div className="w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-950 z-10 transition-transform group-hover:scale-125"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-black text-sm italic text-slate-200 uppercase truncate max-w-[130px]">{act.user}</p>
                        <p className="text-[9px] text-blue-400 font-black bg-blue-500/10 px-2 py-0.5 rounded whitespace-nowrap">{act.time}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mt-1 leading-relaxed">{act.action}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 text-xs italic pl-6 tracking-widest uppercase font-black">Aucun mouvement réseau détecté</p>
              )}
            </div>

            {/* ZONE EXPLICATIVE INTÉGRÉE POUR LES HISTOGRAMMES & DIAGRAMMES */}
            <div className="mt-6 pt-5 border-t border-slate-900 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <FaInfoCircle className="text-xs" />
                <h4 className="text-[10px] font-black uppercase tracking-wider">Guide d'interprétation</h4>
              </div>
              <ul className="space-y-2 text-[10px] text-slate-400 font-semibold uppercase tracking-tight">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-black">•</span>
                  <span><strong>Histogramme :</strong> Représente les commissions nettes générées par les frais SaaS prélevés sur chaque réservation par agence.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-black">•</span>
                  <span><strong>Camembert :</strong> Analyse la répartition des volumes financiers selon les canaux utilisés (Orange Money, M-Pesa, Airtel, Espèces).</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">GariConnect SaaS Engine v1.0</p>
          </div>
        </div>

      </div>
    </div>
  );
};

// COMPOSANT COMPACT : StatCard
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 shrink-0 ${color} text-white rounded-2xl flex items-center justify-center text-lg shadow-lg`}>
      {icon}
    </div>
    <div className="text-center xl:text-left">
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{title}</p>
      <p className="text-xl font-black text-slate-800 dark:text-white tracking-tighter italic uppercase mt-0.5">{value}</p>
    </div>
  </div>
);

const EmptyStateMessage = ({ message }) => (
  <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
    <p className="text-slate-400 font-black uppercase text-[10px] italic tracking-widest">{message}</p>
  </div>
);

export default DashboardAdmin;
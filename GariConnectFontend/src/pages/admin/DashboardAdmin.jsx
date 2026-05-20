import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { 
  FaUsers, FaHandshake, FaMoneyBillWave, FaTicketAlt, 
  FaSync, FaExclamationTriangle 
} from 'react-icons/fa';
import axios from 'axios';

const DashboardAdmin = () => {
  const [data, setData] = useState({
    totalUsers: 0,
    totalReservations: 0,
    totalRevenue: 0, 
    totalCommissions: 0, 
    chartData: [], 
    recentActivities: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:8080/api/admin/finances/stats-globales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const serverData = response.data;

      const mappedData = {
        totalRevenue: serverData.volumeAffairesTotal || 0,
        totalCommissions: serverData.revenusGariConnectNet || 0,
        totalUsers: serverData.totalUsers || 0,
        totalReservations: serverData.billetsConfirmes || 0,
        chartData: serverData.chartData || [], 
        recentActivities: serverData.recentActivities || []
      };
      
      setData(mappedData);
    } catch (error) {
      console.error("Erreur Backend:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="h-[60vh] flex flex-col justify-center items-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Synchronisation des flux...</p>
    </div>
  );

  if (error) return (
    <div className="h-[60vh] flex flex-col justify-center items-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-10 shadow-xl">
      <FaExclamationTriangle className="text-rose-500 text-5xl mb-6" />
      <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Erreur de Connexion</h2>
      <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest text-center">Impossible de joindre le serveur API.</p>
      <button onClick={loadData} className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3">
        <FaSync /> Réessayer
      </button>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
            Gari<span className="text-blue-600">Stats</span>
          </h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Supervision Réelle</p>
        </div>
        <button onClick={loadData} className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500 transition-all font-black text-xs uppercase flex items-center gap-3 shadow-sm">
          <FaSync className={loading ? "animate-spin" : ""} /> Actualiser
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Volume Global" value={`${data.totalRevenue?.toLocaleString()} FC`} icon={<FaMoneyBillWave/>} color="bg-indigo-600" />
        <StatCard title="Total Commissions" value={`${data.totalCommissions?.toLocaleString()} FC`} icon={<FaHandshake/>} color="bg-blue-500" />
        <StatCard title="Utilisateurs" value={data.totalUsers} icon={<FaUsers/>} color="bg-emerald-500" />
        <StatCard title="Réservations" value={data.totalReservations} icon={<FaTicketAlt/>} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRAPHIQUE DE PERFORMANCE PAR AGENCE */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic mb-10 tracking-tighter italic">
            Performance Agences <span className="text-blue-600">(Commissions)</span>
          </h3>
          
          <div style={{ width: '100%', height: '350px' }}>
            {data.chartData && data.chartData.length > 0 ? (
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
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
                <p className="text-slate-400 font-black uppercase text-[10px] italic tracking-widest">En attente de données...</p>
              </div>
            )}
          </div>
        </div>

        {/* FLUX DIRECT (ACTIVITÉS RÉCENTES) */}
        <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl border border-slate-800">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Flux Direct</h3>
          </div>
          
          <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
            {data.recentActivities && data.recentActivities.length > 0 ? (
              data.recentActivities.map((act, index) => (
                <div key={index} className="flex gap-6 relative group">
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-950 z-10 transition-transform group-hover:scale-125"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-black text-sm italic text-slate-200 uppercase">{act.user}</p>
                      <p className="text-[9px] text-blue-500 font-black bg-blue-500/10 px-2 py-1 rounded">{act.time}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-1 leading-relaxed">{act.action}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-600 text-xs italic pl-6 tracking-widest uppercase font-black">Aucun mouvement</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center text-xl shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter italic uppercase">{value}</p>
    </div>
  </div>
);

export default DashboardAdmin;
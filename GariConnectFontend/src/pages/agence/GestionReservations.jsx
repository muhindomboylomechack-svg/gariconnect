import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaTicketAlt, FaSearch, FaPrint, FaCheckCircle, 
  FaClock, FaBus, FaUserFriends, FaPhoneAlt, FaTrash
} from 'react-icons/fa';
import api from '../../services/api';
import { QRCodeCanvas } from 'qrcode.react';

const GestionReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [ticketToPrint, setTicketToPrint] = useState(null);
  const [nomAgence, setNomAgence] = useState("CHARGEMENT...");

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // MODIFICATION : Appel de l'URL globale des réservations de l'application
      const response = await api.get('/reservations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Inspection des données reçues pour le débogage (F12 -> Console)
      console.log("Données reçues du backend :", response.data);

      // Gestion de la structure de données (Tableau direct ou enveloppé dans un objet/pagination)
      let rawData = [];
      if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data && Array.isArray(response.data.content)) {
        rawData = response.data.content; // Si pagination Spring
      } else if (response.data && Array.isArray(response.data.reservations)) {
        rawData = response.data.reservations;
      }

      setReservations(rawData);
    } catch (error) {
      console.error("Erreur de chargement des réservations dans le manifeste :", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgenceInfo = () => {
    const agenceStockee = localStorage.getItem('nomAgence');
    if (agenceStockee && agenceStockee !== "null" && agenceStockee !== "undefined") {
      setNomAgence(agenceStockee.toUpperCase());
    } else if (reservations.length > 0) {
      const autoName = reservations[0]?.agence?.nom || reservations[0]?.trajet?.agenceNom || "AGENCE BENI";
      setNomAgence(autoName.toUpperCase());
    } else {
      setNomAgence("NOM DE L'AGENCE");
    }
  };

  useEffect(() => {
    fetchReservations();
    const handleAfterPrint = () => setTicketToPrint(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  useEffect(() => {
    fetchAgenceInfo();
  }, [reservations]);

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Supprimer définitivement cette réservation ?")) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/reservations/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setReservations(prev => prev.filter(res => res.id !== id));
    } catch (error) {
      alert("Erreur lors de la suppression.");
    }
  };

  // MODIFICATION : Utilisation de l'Optional Chaining (?.) pour éviter les crashs si une donnée est manquante
  const filtered = useMemo(() => {
    return reservations.filter(r => {
      const nomPassager = r?.client?.nom?.toLowerCase() || "";
      const codeTicket = r?.codeTicket?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return nomPassager.includes(term) || codeTicket.includes(term);
    });
  }, [reservations, searchTerm]);

  // AJOUT AJUSTEMENT : Prise en compte de 'PAYE' ou 'CONFIRMEE'
  const stats = useMemo(() => ({
    total: reservations.length,
    confirmees: reservations.filter(r => r?.statut === 'CONFIRMEE' || r?.statut === 'PAYE').length,
    enAttente: reservations.filter(r => r?.statut !== 'CONFIRMEE' && r?.statut !== 'PAYE').length,
  }), [reservations]);

  const handlePrintTicket = (reservation) => {
    setTicketToPrint(reservation);
    setTimeout(() => window.print(), 300);
  };

  return (
    <>
      <style type="text/css">
        {`
          @media print {
            nav, .no-print, button, .sidebar, header { display: none !important; }
            body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
            
            #ticket-print-section { 
                display: ${ticketToPrint ? 'block' : 'none'} !important; 
                width: 80mm;
                margin: 0 auto;
                padding: 5mm;
            }

            #manifeste-print-section {
                display: ${!ticketToPrint ? 'block' : 'none'} !important;
                width: 100%;
                padding: 1cm;
            }

            @page { size: ${ticketToPrint ? 'portrait' : 'landscape'}; margin: 0; }

            .print-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .print-table th { border: 1px solid black !important; padding: 8px; background: #f0f0f0 !important; font-size: 10px; text-transform: uppercase; }
            .print-table td { border: 1px solid black !important; padding: 8px; font-size: 11px; }
            .print-header { display: flex; justify-content: space-between; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
          }
          
          #ticket-print-section, #manifeste-print-section { display: none; }
        `}
      </style>

      {/* INTERFACE ÉCRAN */}
      <div className="p-4 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen no-print transition-colors duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                <FaTicketAlt className="text-white text-xl" />
              </div>
              {nomAgence}
            </h1>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm ml-14 uppercase tracking-tighter">Gestion du Manifeste Voyageurs</p>
          </div>
          
          <button 
            onClick={() => window.print()} 
            className="w-full lg:w-auto bg-slate-800 dark:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-700 dark:hover:bg-blue-700 transition-all shadow-xl active:scale-95"
          >
            <FaPrint /> IMPRIMER LE MANIFESTE
          </button>
        </div>

        {/* Stats Responsives */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatMiniCard label="Total Passagers" value={stats.total} icon={<FaUserFriends />} color="blue" />
          <StatMiniCard label="Confirmés" value={stats.confirmees} icon={<FaCheckCircle />} color="emerald" />
          <StatMiniCard label="En attente" value={stats.enAttente} icon={<FaClock />} color="orange" />
        </div>

        {/* Recherche */}
        <div className="relative w-full max-w-md">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text"
            placeholder="Rechercher un nom ou un ticket..."
            className="w-full pl-14 pr-6 py-4 rounded-2xl border-none shadow-sm dark:shadow-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tableau Responsive */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl dark:shadow-none overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Passager</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trajet & Ticket</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Statut</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                    <tr><td colSpan="4" className="p-20 text-center text-blue-500 font-black animate-pulse">Chargement du manifeste...</td></tr>
                ) : filtered.length === 0 ? (
                    <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold">Aucune réservation trouvée.</td></tr>
                ) : filtered.map((res) => (
                  <tr key={res.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-700 dark:text-slate-200 uppercase block text-sm">
                        {res.client ? res.client.nom : "Passager Inconnu"}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1 mt-1">
                        <FaPhoneAlt size={10}/> {res.client?.telephone || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-slate-600 dark:text-slate-400">
                        {res.trajet?.depart} <FaBus className="inline mx-2 text-blue-400" size={12}/> {res.trajet?.destination}
                      </div>
                      <div className="text-[10px] text-blue-500 dark:text-blue-400 font-mono font-bold mt-1 tracking-tighter">REF: {res.codeTicket || 'SANS TICKET'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {/* AJOUT AJUSTEMENT : Statut Vert pour PAYE ou CONFIRMEE */}
                      <div className={`mx-auto w-fit px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm ${
                        res.statut === 'CONFIRMEE' || res.statut === 'PAYE' 
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {res.statut}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleDelete(res.id)} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition-all active:scale-90">
                          <FaTrash size={14} />
                        </button>
                        {/* AJOUT AJUSTEMENT : Autoriser l'impression si le statut est PAYE ou CONFIRMEE */}
                        {(res.statut === 'CONFIRMEE' || res.statut === 'PAYE') && (
                          <button onClick={() => handlePrintTicket(res)} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 dark:hover:bg-red-600 hover:text-white transition-all active:scale-90">
                            <FaPrint size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------------- SECTION IMPRESSION : MANIFESTE GLOBAL ---------------- */}
      <div id="manifeste-print-section" className="text-black bg-white">
        <div className="print-header">
          <div>
            <h2 className="text-2xl font-black text-blue-700">{nomAgence}</h2>
            <p className="text-xs font-bold uppercase tracking-widest">Manifeste Officiel des Passagers</p>
            <p className="text-[10px]">Ville de Beni, RDC</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold">Date: {new Date().toLocaleDateString()}</p>
            <p className="text-xs font-bold font-mono">Total passagers: {filtered.length}</p>
          </div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Nom du Passager</th>
              <th>Téléphone</th>
              <th>Trajet</th>
              <th>Siège</th>
              <th>Code Ticket</th>
              <th>Observation</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((res, index) => (
              <tr key={res.id}>
                <td className="text-center font-bold">{index + 1}</td>
                <td className="font-bold uppercase">{res.client?.nom}</td>
                <td>{res.client?.telephone}</td>
                <td className="font-bold">{res.trajet?.depart} - {res.trajet?.destination}</td>
                <td className="text-center font-bold">{res.numeroSiege || '-'}</td>
                <td className="font-mono text-xs">{res.codeTicket}</td>
                <td className="w-24"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-20 grid grid-cols-3 gap-8 text-center">
          <div><p className="text-[10px] font-bold border-t border-black pt-2 uppercase">Chef d'Agence</p></div>
          <div><p className="text-[10px] font-bold border-t border-black pt-2 uppercase">Conducteur</p></div>
          <div><p className="text-[10px] font-bold border-t border-black pt-2 uppercase">Service de Contrôle</p></div>
        </div>
      </div>

      {/* ---------------- SECTION IMPRESSION : TICKET INDIVIDUEL ---------------- */}
      {ticketToPrint && (
        <div id="ticket-print-section" className="text-black bg-white font-sans">
          <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
            <h2 className="text-xl font-black">{nomAgence}</h2>
            <p className="text-[10px] font-bold tracking-widest">TRANSPORT INTERURBAIN</p>
            <p className="text-[10px] italic">Beni, Nord-Kivu, RDC</p>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-bold">
              <span>PASSAGER:</span>
              <span className="uppercase">{ticketToPrint.client?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span>TRAJET:</span>
              <span className="font-bold">{ticketToPrint.trajet?.depart} - {ticketToPrint.trajet?.destination}</span>
            </div>
            <div className="flex justify-between">
              <span>SIÈGE:</span>
              <span className="text-lg font-black bg-black text-white px-2">#{ticketToPrint.numeroSiege || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>DATE VOYAGE:</span>
              <span className="font-bold">{new Date(ticketToPrint.date_reservation).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-6 py-4 border-y border-dashed border-black">
            <QRCodeCanvas value={ticketToPrint.codeTicket || "INVALID"} size={140} />
            <p className="font-mono mt-3 font-black text-lg tracking-wider">{ticketToPrint.codeTicket}</p>
          </div>

          <div className="text-center">
            <p className="text-[9px] font-bold">Ticket non remboursable</p>
            <p className="text-[10px] mt-2 italic">Merci de votre confiance avec GariConnect.</p>
          </div>
        </div>
      )}
    </>
  );
};

const StatMiniCard = ({ label, value, icon, color }) => {
  const colors = { 
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", 
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", 
    orange: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" 
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className={`p-4 rounded-2xl ${colors[color]} text-xl shadow-inner`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter">{label}</p>
        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{value}</p>
      </div>
    </div>
  );
};

export default GestionReservations;
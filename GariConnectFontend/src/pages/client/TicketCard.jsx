import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next'; // Intégration des langues
import { FaBus, FaCalendarAlt, FaClock, FaChair, FaDownload } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import html2pdf from 'html2pdf.js';

const TicketCard = ({ ticket }) => {
  const { t } = useTranslation();
  const ticketRef = useRef();

  // PROTECTION : Si l'objet ticket est absent
  if (!ticket) {
    return (
      <div className="max-w-md mx-auto p-6 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[2.5rem] text-center text-slate-400 font-bold">
        {t('loading_trip')}...
      </div>
    );
  }

  // Extraction sécurisée des données
  const {
    depart = "...",
    destination = "...",
    date = "2024-01-01",
    heure = "00:00",
    siege = "??",
    code = "XXXXXX",
    prix = "0",
    statut = "ATTENTE",
    nomPassager = "Voyageur"
  } = ticket;

  // Fonction pour générer le PDF
  const handleDownloadPDF = () => {
    const element = ticketRef.current;
    const opt = {
      margin: 10,
      filename: `Ticket_GariConnect_${code}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-md mx-auto pb-10">
      {/* SECTION TICKET (Contenu du PDF) */}
      <div 
        ref={ticketRef} 
        className="filter drop-shadow-2xl animate-in slide-in-from-bottom duration-500"
      >
        {/* --- PARTIE SUPÉRIEURE --- */}
        <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 border-x border-t border-slate-100 dark:border-slate-800 relative">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">GariConnect</span>
              <span className="text-xs font-bold text-slate-500">{t('checkout.your_seat')}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
              statut === 'CONFIRME' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {statut}
            </div>
          </div>

          <div className="flex justify-between items-center relative py-4">
            <div className="z-10 bg-white dark:bg-slate-900 pr-3">
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase">{depart.substring(0, 3)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{depart}</p>
            </div>

            <div className="absolute left-0 right-0 flex items-center justify-center pointer-events-none">
               <div className="w-full border-t-2 border-dashed border-slate-100 dark:border-slate-800 flex justify-center items-center">
                  <FaBus className="text-indigo-600 mx-2" size={16} />
               </div>
            </div>

            <div className="z-10 bg-white dark:bg-slate-900 pl-3 text-right">
              <p className="text-3xl font-black text-indigo-600 uppercase">{destination.substring(0, 3)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{destination}</p>
            </div>
          </div>
        </div>

        {/* --- DÉCOUPE VISUELLE (Pointillés) --- */}
        <div className="relative flex items-center bg-white dark:bg-slate-900 border-x border-slate-100 dark:border-slate-800 h-8">
          <div className="absolute -left-4 w-8 h-8 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-100 dark:border-slate-800"></div>
          <div className="w-full border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-6"></div>
          <div className="absolute -right-4 w-8 h-8 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-100 dark:border-slate-800"></div>
        </div>

        {/* --- PARTIE INFÉRIEURE --- */}
        <div className="bg-white dark:bg-slate-900 rounded-b-[2.5rem] p-6 border-x border-b border-slate-100 dark:border-slate-800 space-y-6">
          <div className="grid grid-cols-3 gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
            <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase">Date</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200">{date}</p>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase">{t('time') || 'Heure'}</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200">{heure}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">{t('seat_number') || 'Siège'}</p>
              <p className="text-sm font-black text-indigo-600">#{siege}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <QRCodeCanvas 
                value={code} 
                size={140} 
                level={"H"}
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('reference') || 'Code de Réservation'}</p>
              <p className="text-lg font-mono font-black text-slate-800 dark:text-slate-100 tracking-widest">{code}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-end">
             <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Passager</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{nomPassager}</p>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase">{t('total') || 'Prix Payé'}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                    {prix.toLocaleString()} <span className="text-xs font-medium text-slate-400 tracking-normal uppercase">FC</span>
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* BOUTON D'ACTION (Indigo Style) */}
      <div className="mt-8 flex justify-center">
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all"
        >
          <FaDownload /> {t('save_ticket') || 'Enregistrer mon ticket'}
        </button>
      </div>
    </div>
  );
};

export default TicketCard;
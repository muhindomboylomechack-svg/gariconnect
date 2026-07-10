import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next'; // Intégration des langues
import { FaBus, FaDownload } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';

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

  // 🔴 CORRECTION : Remplacement de html2pdf par l'impression native sécurisée
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=750');
    
    if (!printWindow) {
        alert("⚠️ L'impression a été bloquée. Veuillez autoriser les pop-ups (fenêtres contextuelles) dans la barre d'adresse de votre navigateur pour télécharger votre billet.");
        return;
    }

    const dateImpression = new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const isPaid = statut === 'CONFIRME' || statut === 'PAYE' || statut === 'VALIDE' || statut === 'EMBARQUE';

    printWindow.document.write(`
        <html>
        <head>
            <title>Billet GariConnect - ${code}</title>
            <style>
                @page { size: auto; margin: 0mm; }
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 24px; text-align: center; background: #fff; }
                .ticket-container { max-width: 360px; margin: 0 auto; border: 2px dashed #94a3b8; padding: 24px; border-radius: 12px; }
                h2 { color: #4f46e5; margin-bottom: 5px; font-weight: 900; text-transform: uppercase; font-size: 22px; }
                .subtitle { font-size: 11px; color: #64748b; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
                .code { font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: 2px; margin: 10px 0; font-family: monospace; }
                .divider { border-top: 1px solid #e2e8f0; margin: 15px 0; }
                .info-grid { text-align: left; margin: 20px 0; }
                .info-row { margin-bottom: 12px; }
                .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
                .value { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; }
                .footer { font-size: 10px; color: #94a3b8; margin-top: 20px; }
                .status { display: inline-block; padding: 6px 12px; background: ${isPaid ? '#dcfce7' : '#ffedd5'}; color: ${isPaid ? '#16a34a' : '#ea580c'}; font-size: 11px; font-weight: 900; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }
            </style>
        </head>
        <body>
            <div class="ticket-container">
                <h2>GariConnect</h2>
                <div class="subtitle">Titre de Transport Officiel</div>
                
                <div class="status">${statut}</div>
                <div class="code">${code}</div>
                
                <div class="divider"></div>
                
                <div class="info-grid">
                    <div class="info-row">
                        <div class="label">Passager</div>
                        <div class="value">${nomPassager}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="label">Itinéraire</div>
                        <div class="value">${depart} ➔ ${destination}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="label">Date & Heure de départ</div>
                        <div class="value">${date} à ${heure}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="label">Information Siège</div>
                        <div class="value">${siege}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="label">Montant Payé</div>
                        <div class="value" style="color: #4f46e5; font-size: 18px;">${parseFloat(prix).toLocaleString('fr-FR')} FC</div>
                    </div>
                </div>
                
                <div class="divider"></div>
                
                <div class="footer">
                    Document généré le ${dateImpression}<br>
                    Veuillez présenter ce billet ou votre QR Code lors de l'embarquement.
                </div>
            </div>
            <script>
                window.onload = function() { 
                    window.print(); 
                    setTimeout(function() { window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-md mx-auto pb-10">
      {/* SECTION TICKET (Interface Web Intacte) */}
      <div 
        ref={ticketRef} 
        className="filter drop-shadow-2xl animate-in slide-in-from-bottom duration-500"
      >
        {/* --- PARTIE SUPÉRIEURE --- */}
        <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 border-x border-t border-slate-100 dark:border-slate-800 relative">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">GariConnect</span>
              <span className="text-xs font-bold text-slate-500">{t('checkout.your_seat') || 'Votre Billet'}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
              statut === 'CONFIRME' || statut === 'PAYE' || statut === 'VALIDE' || statut === 'EMBARQUE' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
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
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase">{t('time') || 'Heure'}</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200">{heure}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">{t('seat_number') || 'Siège'}</p>
              <p className="text-sm font-black text-indigo-600">{siege}</p>
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
             <div className="text-left max-w-[50%]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Passager</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate" title={nomPassager}>{nomPassager}</p>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase">{t('total') || 'Montant Total'}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                    {parseFloat(prix).toLocaleString('fr-FR')} <span className="text-xs font-medium text-slate-400 tracking-normal uppercase">FC</span>
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* BOUTON D'ACTION (Indigo Style) */}
      <div className="mt-8 flex justify-center">
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all cursor-pointer border-none"
        >
          <FaDownload /> {t('save_ticket') || 'Enregistrer mon ticket'}
        </button>
      </div>
    </div>
  );
};

export default TicketCard;
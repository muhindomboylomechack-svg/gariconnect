import React from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Installez avec: npm install qrcode.react

const TicketPrint = React.forwardRef(({ data }, ref) => {
    if (!data) return null;

    return (
        <div ref={ref} className="p-8 bg-white text-black w-[80mm] border-dashed border-2 border-gray-300">
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold uppercase">{data.agenceNom || 'GARICONNECT'}</h2>
                <p className="text-[10px] italic">Voyagez en toute sécurité</p>
                <div className="border-b border-black my-2"></div>
            </div>

            {/* Infos Voyage */}
            <div className="space-y-1 mb-4 text-sm">
                <p><strong>TICKET # :</strong> {data.id.toString().padStart(5, '0')}</p>
                <p><strong>DATE :</strong> {new Date(data.trajet.dateDepart).toLocaleDateString()}</p>
                <p><strong>DEPART :</strong> {data.trajet.depart}</p>
                <p><strong>DESTINATION :</strong> {data.trajet.destination}</p>
                <p><strong>SIEGE :</strong> <span className="text-lg font-bold">{data.numSiege}</span></p>
            </div>

            {/* Passager */}
            <div className="bg-gray-100 p-2 rounded mb-4 text-xs">
                <p><strong>PASSAGER :</strong> {data.nomPassager}</p>
                <p><strong>TEL :</strong> {data.telephone}</p>
            </div>

            {/* QR Code pour contrôle */}
            <div className="flex justify-center my-4">
                <QRCodeCanvas value={`GARI-${data.id}`} size={100} />
            </div>

            {/* Footer */}
            <div className="text-center text-[9px]">
                <p>Prix : {data.prix} FC</p>
                <p>Merci de votre confiance !</p>
                <p>{new Date().toLocaleString()}</p>
            </div>
        </div>
    );
});

export default TicketPrint;
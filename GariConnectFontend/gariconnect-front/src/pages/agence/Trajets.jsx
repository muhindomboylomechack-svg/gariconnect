import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FaBus, FaEdit, FaTrash, FaTimes, 
  FaSave, FaCalendarAlt, FaClock, FaUserTie, 
  FaMapMarkerAlt, FaPlus, FaUsers, FaArrowRight, FaMoneyBillWave
} from 'react-icons/fa';

const Trajets = () => {
  const [trajets, setTrajets] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]); 
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);

  const JOURS_SEMAINE = [
    "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche", "Tous les jours"
  ];

  const [formData, setFormData] = useState({
    depart: '', 
    destination: '', 
    joursSemaine: '', 
    heureDepart: '',  
    prix: '', 
    vehiculeId: '', 
    chauffeurId: '', 
    statut: 'PROGRAMME', 
    placesDisponibles: ''
  });

  useEffect(() => { 
    fetchTrajets(); 
  }, []);

  const fetchTrajets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trajets/mes-trajets');
      setTrajets(res.data);
    } catch (e) { 
      console.error("Erreur chargement trajets:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  // Chargement dynamique des ressources quand le jour change
  useEffect(() => {
    if (formData.joursSemaine) {
      fetchRessourcesParJour(formData.joursSemaine);
    } else {
      setVehicules([]);
      setChauffeurs([]);
    }
  }, [formData.joursSemaine]);

  const fetchRessourcesParJour = async (jourChoisi) => {
    try {
      const paramJour = jourChoisi === "Tous les jours" ? "TOUS" : jourChoisi;
      const res = await api.get(`/trajets/ressources-disponibles?jour=${paramJour}`);
      
      let vDispo = res.data.vehicules || [];
      let cDispo = res.data.chauffeurs || [];

      // LOGIQUE ÉDITION : Si on modifie, on garde les ressources actuelles dans la liste pour éviter qu'elles disparaissent
      if (isEditing && currentId) {
          const trajetActuel = trajets.find(t => t.id === currentId);
          if (trajetActuel) {
              if (trajetActuel.vehicule && !vDispo.some(v => v.id === trajetActuel.vehicule.id)) {
                  vDispo = [...vDispo, trajetActuel.vehicule];
              }
              if (trajetActuel.chauffeur && !cDispo.some(c => c.id === trajetActuel.chauffeur.id)) {
                  cDispo = [...cDispo, trajetActuel.chauffeur];
              }
          }
      }

      setVehicules(vDispo);
      setChauffeurs(cDispo);
    } catch (e) {
      console.error("Erreur filtrage ressources:", e);
    }
  };

  const handleVehiculeChange = (vId) => {
    const v = vehicules.find(item => item.id === parseInt(vId));
    setFormData(prev => ({
      ...prev, 
      vehiculeId: vId,
      placesDisponibles: v ? (v.capacite || v.capaciteTotale || prev.placesDisponibles) : prev.placesDisponibles
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!formData.vehiculeId || !formData.chauffeurId) {
        alert("⚠️ Veuillez sélectionner un véhicule et un chauffeur.");
        return;
    }

    const aujourdhui = new Date().toISOString().split('T')[0];
    const dateComplete = `${aujourdhui}T${formData.heureDepart}:00`;

    const payload = {
      depart: formData.depart,
      destination: formData.destination,
      joursSemaine: formData.joursSemaine === "Tous les jours" ? "TOUS" : formData.joursSemaine,
      dateHeureDepart: dateComplete,
      prix: parseFloat(formData.prix),
      statut: formData.statut,
      placesDisponibles: parseInt(formData.placesDisponibles),
      vehicule: { id: parseInt(formData.vehiculeId) },
      chauffeur: { id: parseInt(formData.chauffeurId) }
    };

    try {
      if (isEditing) {
        await api.put(`/trajets/${currentId}`, payload);
      } else {
        await api.post('/trajets', payload);
      }
      setShowModal(false);
      fetchTrajets(); 
      alert("✅ Trajet enregistré avec succès !");
    } catch (err) {
      // INTERCEPTION DU MESSAGE D'ERREUR PERSONNALISÉ DU BACKEND
      const errorMsg = err.response?.data?.message || err.response?.data?.erreur || "Erreur lors de l'enregistrement";
      alert("⚠️ " + errorMsg);
    }
  };

  const handleEditClick = (trajet) => {
    const heureExtraite = trajet.dateHeureDepart ? trajet.dateHeureDepart.split('T')[1].substring(0, 5) : '';

    setFormData({
      depart: trajet.depart || '',
      destination: trajet.destination || '',
      joursSemaine: trajet.joursSemaine === "TOUS" ? "Tous les jours" : (trajet.joursSemaine || ''),
      heureDepart: heureExtraite,
      prix: trajet.prix || '',
      vehiculeId: trajet.vehicule?.id || '',
      chauffeurId: trajet.chauffeur?.id || '',
      statut: trajet.statut || 'PROGRAMME',
      placesDisponibles: trajet.placesDisponibles || ''
    });
    setCurrentId(trajet.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette programmation définitivement ?")) {
      try {
        await api.delete(`/trajets/${id}`);
        fetchTrajets();
      } catch (e) { 
        alert("Impossible de supprimer ce trajet."); 
      }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl">
              <FaMapMarkerAlt className="text-white text-xl" />
            </div>
            Planning GariConnect (Beni)
          </h1>
          <p className="text-slate-400 font-bold text-xs mt-1 italic uppercase">Gestion des rotations véhicules et chauffeurs</p>
        </div>
        <button 
          onClick={() => { 
            setIsEditing(false); 
            setFormData({depart:'', destination:'', joursSemaine:'', heureDepart:'', prix:'', vehiculeId:'', chauffeurId:'', statut:'PROGRAMME', placesDisponibles: ''}); 
            setShowModal(true); 
          }}
          className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <FaPlus /> Nouvelle programmation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : trajets.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-4 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase">
                   {t.joursSemaine === "TOUS" ? "Tous les jours" : t.joursSemaine}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{t.prix} FC</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Départ</p>
                  <span className="font-black text-slate-800 dark:text-white uppercase">{t.depart}</span>
                </div>
                <FaArrowRight className="text-slate-300" />
                <div className="flex-1 text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Destination</p>
                  <span className="font-black text-blue-600 dark:text-blue-400 uppercase">{t.destination}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <FaBus className="text-blue-500"/> {t.vehicule?.plaque_immatriculation || 'No Camion'}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <FaUserTie className="text-blue-500"/> {t.chauffeur?.nom || 'No Driver'}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => handleEditClick(t)} className="p-3 bg-slate-100 dark:bg-slate-800 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><FaEdit/></button>
                <button onClick={() => handleDelete(t.id)} className="p-3 bg-slate-100 dark:bg-slate-800 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><FaTrash/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] border dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">
                {isEditing ? "Editer le trajet" : "Nouveau trajet"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400"><FaTimes /></button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormGroup label="Jour de passage" icon={<FaCalendarAlt />}>
                <select 
                  className="form-input-custom" 
                  value={formData.joursSemaine} 
                  onChange={(e) => setFormData({...formData, joursSemaine: e.target.value})} 
                  required
                >
                  <option value="">Choisir un jour...</option>
                  {JOURS_SEMAINE.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </FormGroup>

              <FormGroup label="Heure de départ" icon={<FaClock />}>
                <input type="time" className="form-input-custom" value={formData.heureDepart} onChange={(e) => setFormData({...formData, heureDepart: e.target.value})} required />
              </FormGroup>

              <FormGroup label="Véhicule (Disponible)" icon={<FaBus />}>
                <select 
                  className={`form-input-custom ${!formData.joursSemaine && 'opacity-50 cursor-not-allowed'}`} 
                  value={formData.vehiculeId} 
                  onChange={(e) => handleVehiculeChange(e.target.value)} 
                  disabled={!formData.joursSemaine}
                  required
                >
                  <option value="">{formData.joursSemaine ? "Sélectionner véhicule..." : "Sélectionnez d'abord un jour"}</option>
                  {vehicules.map(v => (
                    <option key={v.id} value={v.id}>{v.plaque_immatriculation} ({v.marque})</option>
                  ))}
                </select>
              </FormGroup>

              <FormGroup label="Chauffeur (Disponible)" icon={<FaUserTie />}>
                <select 
                  className={`form-input-custom ${!formData.joursSemaine && 'opacity-50 cursor-not-allowed'}`} 
                  value={formData.chauffeurId} 
                  onChange={(e) => setFormData({...formData, chauffeurId: e.target.value})} 
                  disabled={!formData.joursSemaine}
                  required
                >
                  <option value="">{formData.joursSemaine ? "Sélectionner chauffeur..." : "Sélectionnez d'abord un jour"}</option>
                  {chauffeurs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </FormGroup>

              <FormGroup label="Ville de Départ" icon={<FaMapMarkerAlt />}>
                <input className="form-input-custom" value={formData.depart} onChange={(e) => setFormData({...formData, depart: e.target.value})} placeholder="Ex: Beni" required />
              </FormGroup>
              
              <FormGroup label="Ville de Destination" icon={<FaArrowRight />}>
                <input className="form-input-custom" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} placeholder="Ex: Butembo" required />
              </FormGroup>

              <FormGroup label="Prix du ticket (FC)" icon={<FaMoneyBillWave />}>
                <input type="number" className="form-input-custom" value={formData.prix} onChange={(e) => setFormData({...formData, prix: e.target.value})} required />
              </FormGroup>

              <FormGroup label="Places Disponibles" icon={<FaUsers />}>
                <input 
                  type="number" 
                  className="form-input-custom bg-blue-50/50 dark:bg-blue-900/10" 
                  value={formData.placesDisponibles} 
                  onChange={(e) => setFormData({...formData, placesDisponibles: e.target.value})} 
                  placeholder="Capacité"
                  required 
                />
              </FormGroup>

              <button type="submit" className="col-span-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 mt-4">
                <FaSave /> {isEditing ? "Enregistrer les modifications" : "Valider la programmation"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        /* Style des inputs avec support complet Dark Mode */
        .form-input-custom {
          width: 100%;
          padding: 0.875rem 1rem;
          background: #f8fafc;
          color: #1e293b;
          border-radius: 1.25rem;
          font-weight: 700;
          font-size: 0.85rem;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .form-input-custom:focus {
          border-color: #2563eb;
          background: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
          outline: none;
        }

        /* Mode sombre pour les inputs et sélecteurs */
        @media (prefers-color-scheme: dark) {
          .form-input-custom {
            background: #1e293b;
            color: #f1f5f9;
            border-color: #334155;
          }
          .form-input-custom:focus {
            background: #0f172a;
            border-color: #3b82f6;
          }
          /* Style spécifique pour les options des select en mode sombre */
          select.form-input-custom option {
            background: #1e293b;
            color: #f1f5f9;
          }
        }

        /* Si vous utilisez une classe .dark sur le body/html */
        :global(.dark) .form-input-custom {
            background: #1e293b;
            color: #f1f5f9;
            border-color: #334155;
        }
      `}</style>
    </div>
  );
};

const FormGroup = ({ label, icon, children }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 ml-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
      <span className="text-blue-500">{icon}</span> {label}
    </label>
    {children}
  </div>
);

export default Trajets;
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FaBus, FaEdit, FaTrash, FaTimes, 
  FaSave, FaCalendarAlt, FaClock, FaUserTie, 
  FaMapMarkerAlt, FaPlus, FaUsers, FaArrowRight, FaMoneyBillWave
} from 'react-icons/fa';

// Déclaration locale du sous-composant FormGroup pour éviter les erreurs de portée (Scope)
const FormGroup = ({ label, icon, children }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 ml-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
      <span className="text-blue-500">{icon}</span> {label}
    </label>
    {children}
  </div>
);

const Trajets = () => {
  const [trajets, setTrajets] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]); 
  const [agences, setAgences] = useState([]); // Pour le cas d'un SUPER_ADMIN
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    depart: '', 
    destination: '', 
    joursSemaine: '', 
    heureDepart: '',  
    prix: '', 
    vehiculeId: '', 
    chauffeurId: '', 
    statut: 'PROGRAMME', 
    placesDisponibles: '',
    agenceId: '' 
  });

  const userRole = localStorage.getItem('role') || localStorage.getItem('user_role');

  useEffect(() => { 
    fetchTrajets();
    if (userRole === 'SUPER_ADMIN') {
      fetchAgences(); // Charger les agences si l'utilisateur est un super administrateur
    }
  }, [userRole]);

  const fetchTrajets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await api.get('/trajets/tous', {
          headers: { Authorization: `Bearer ${token}` }
      });
      setTrajets(Array.isArray(res.data) ? res.data : []);
    } catch (e) { 
      console.error("Erreur chargement trajets:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchAgences = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/users/agencies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgences(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Erreur lors du chargement des agences :", e);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchRessourcesDisponibles();
    } else {
      setVehicules([]);
      setChauffeurs([]);
    }
  }, [showModal, isEditing, currentId]);

  const fetchRessourcesDisponibles = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resVehicules, resChauffeurs] = await Promise.all([
          api.get('/vehicules/disponibles', { headers }).catch(err => {
              console.warn("Erreur chargement véhicules", err);
              return { data: [] };
          }),
          api.get('/chauffeurs/disponibles', { headers }).catch(err => {
              console.warn("Erreur chargement chauffeurs", err);
              return { data: [] };
          })
      ]);
      
      let vDispo = Array.isArray(resVehicules.data) ? resVehicules.data : [];
      let cDispo = Array.isArray(resChauffeurs.data) ? resChauffeurs.data : [];

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
      console.error("Erreur récupération des ressources:", e);
    }
  };

  const handleVehiculeChange = (vId) => {
    const v = vehicules.find(item => item.id === parseInt(vId, 10));
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

    const today = new Date().toISOString().split('T')[0];
    const dateIsoPropre = `${today}T${formData.heureDepart}:00`;

    const payload = {
      depart: formData.depart,
      destination: formData.destination,
      joursSemaine: formData.joursSemaine,
      dateHeureDepart: dateIsoPropre, 
      prix: parseFloat(formData.prix),
      statut: formData.statut,
      placesDisponibles: parseInt(formData.placesDisponibles, 10),
      vehicule: { id: parseInt(formData.vehiculeId, 10) },
      chauffeur: { id: parseInt(formData.chauffeurId, 10) }
    };

    if (userRole === 'SUPER_ADMIN' && formData.agenceId) {
      payload.agence = { id: parseInt(formData.agenceId, 10) };
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (isEditing) {
        await api.put(`/trajets/${currentId}`, payload, config);
        alert("✅ Trajet mis à jour avec succès !");
      } else {
        await api.post('/trajets', payload, config);
        alert("✅ Trajet enregistré avec succès !");
      }
      setShowModal(false);
      fetchTrajets(); 
    } catch (err) {
      console.error("Erreur détaillée du serveur :", err.response?.data);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.response?.data || "Erreur de traitement réseau";
      alert("⚠️ " + errorMsg);
    }
  };

  const handleEditClick = (trajet) => {
    const heureExtraite = trajet.dateHeureDepart ? trajet.dateHeureDepart.substring(11, 16) : '';

    setFormData({
      depart: trajet.depart || '',
      destination: trajet.destination || '',
      joursSemaine: trajet.joursSemaine || '',
      heureDepart: heureExtraite,
      prix: trajet.prix || '',
      vehiculeId: trajet.vehicule?.id || '',
      chauffeurId: trajet.chauffeur?.id || '',
      statut: trajet.statut || 'PROGRAMME',
      placesDisponibles: trajet.placesDisponibles || '',
      agenceId: trajet.agence?.id || ''
    });
    setCurrentId(trajet.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette programmation définitivement ?")) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/trajets/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
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
            Planning GariConnect
          </h1>
          <p className="text-slate-400 font-bold text-xs mt-1 italic uppercase">Gestion des rotations véhicules et chauffeurs</p>
        </div>
        <button 
          onClick={() => { 
            setIsEditing(false); 
            setFormData({depart:'', destination:'', joursSemaine:'', heureDepart:'', prix:'', vehiculeId:'', chauffeurId:'', statut:'PROGRAMME', placesDisponibles: '', agenceId: ''}); 
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
                   {t.joursSemaine || (t.dateHeureDepart && new Date(t.dateHeureDepart).toLocaleDateString('fr-FR', { weekday: 'long' }))}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{t.prix} FC</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Départ</p>
                  <span className="font-black text-slate-800 dark:text-white uppercase">{t.depart}</span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full mb-1">
                      {t.dateHeureDepart ? t.dateHeureDepart.substring(11, 16) : '--:--'}
                   </span>
                   <FaArrowRight className="text-slate-300" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Destination</p>
                  <span className="font-black text-blue-600 dark:text-blue-400 uppercase">{t.destination}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <FaBus className="text-blue-500"/> {t.vehicule ? `${t.vehicule.plaqueImmatriculation || t.vehicule.plaque_immatriculation} (${t.vehicule.marque})` : 'Non assigné'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded w-fit">
                      <FaUsers /> {t.placesDisponibles} places restantes
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 self-start">
                  <FaUserTie className="text-blue-500"/> {t.chauffeur ? `${t.chauffeur.prenom || ''} ${t.chauffeur.nom}` : 'Non assigné'}
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
              
              {userRole === 'SUPER_ADMIN' && (
                <div className="col-span-full">
                  <FormGroup label="Agence propriétaire" icon={<FaUsers />}>
                    <select
                      className="form-input-custom"
                      value={formData.agenceId}
                      onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner une agence...</option>
                      {agences.map(a => (
                        <option key={a.id} value={a.id}>{a.nom || a.email}</option>
                      ))}
                    </select>
                  </FormGroup>
                </div>
              )}

              <FormGroup label="Jours de la semaine" icon={<FaCalendarAlt />}>
                <select 
                  className="form-input-custom" 
                  value={formData.joursSemaine} 
                  onChange={(e) => setFormData({...formData, joursSemaine: e.target.value})} 
                  required
                >
                  <option value="">Sélectionner un jour...</option>
                  <option value="LUNDI">Lundi</option>
                  <option value="MARDI">Mardi</option>
                  <option value="MERCREDI">Mercredi</option>
                  <option value="JEUDI">Jeudi</option>
                  <option value="VENDREDI">Vendredi</option>
                  <option value="SAMEDI">Samedi</option>
                  <option value="DIMANCHE">Dimanche</option>
                  <option value="TOUS LES JOURS">Tous les jours</option>
                </select>
              </FormGroup>

              <FormGroup label="Heure de départ" icon={<FaClock />}>
                <input type="time" className="form-input-custom" value={formData.heureDepart} onChange={(e) => setFormData({...formData, heureDepart: e.target.value})} required />
              </FormGroup>

              <FormGroup label="Véhicule (Libre)" icon={<FaBus />}>
                <select 
                  className="form-input-custom" 
                  value={formData.vehiculeId} 
                  onChange={(e) => handleVehiculeChange(e.target.value)} 
                  required
                >
                  <option value="">Sélectionner un véhicule...</option>
                  {vehicules.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plaqueImmatriculation || v.plaque_immatriculation} - {v.marque} {v.modele}
                    </option>
                  ))}
                </select>
              </FormGroup>

              <FormGroup label="Chauffeur (Libre)" icon={<FaUserTie />}>
                <select 
                  className="form-input-custom" 
                  value={formData.chauffeurId} 
                  onChange={(e) => setFormData({...formData, chauffeurId: e.target.value})} 
                  required
                >
                  <option value="">Sélectionner un chauffeur...</option>
                  {chauffeurs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                    </option>
                  ))}
                </select>
              </FormGroup>

              <FormGroup label="Ville de Départ" icon={<FaMapMarkerAlt />}>
                <input className="form-input-custom" value={formData.depart} onChange={(e) => setFormData({...formData, depart: e.target.value})} placeholder="Ex: Kinshasa" required />
              </FormGroup>
              
              <FormGroup label="Ville de Destination" icon={<FaArrowRight />}>
                <input className="form-input-custom" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} placeholder="Ex: Matadi" required />
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
                  placeholder="Se remplit automatiquement..."
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
          select.form-input-custom option {
            background: #1e293b;
            color: #f1f5f9;
          }
        }
      `}</style>
    </div>
  );
};

export default Trajets;
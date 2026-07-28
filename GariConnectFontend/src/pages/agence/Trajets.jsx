import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FaBus, FaEdit, FaTrash, FaTimes, 
  FaSave, FaCalendarAlt, FaClock, FaUserTie, 
  FaMapMarkerAlt, FaPlus, FaUsers, FaArrowRight, FaMoneyBillWave, FaExchangeAlt
} from 'react-icons/fa';

const FormGroup = ({ label, icon, children }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 ml-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
      <span className="text-blue-500">{icon}</span> {label}
    </label>
    {children}
  </div>
);

// 🟢 Constante Tailwind remplaçant l'ancien bloc <style>
const inputClass = "w-full px-4 py-3.5 bg-slate-50 text-slate-800 rounded-[1.25rem] font-bold text-[0.85rem] border-2 border-transparent transition-all duration-200 focus:border-blue-600 focus:bg-white focus:shadow-[0_4px_12px_rgba(37,99,235,0.1)] focus:outline-none dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:focus:bg-slate-900 dark:focus:border-blue-500";

const Trajets = () => {
  const [trajets, setTrajets] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]); 
  const [agences, setAgences] = useState([]); 
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);

  // State du trajet principal (Aller)
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

  // 🟢 Nouveaux states pour gérer la suggestion de trajet retour
  const [creerRetour, setCreerRetour] = useState(false);
  const [formDataRetour, setFormDataRetour] = useState({
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

  const getUserAgenceId = () => {
    let id = localStorage.getItem('agenceId') || localStorage.getItem('agence_id');
    if (id) return id;
    const storedUser = localStorage.getItem('user') || localStorage.getItem('userData');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        const foundId = u.agenceId || u.agence?.id || u.agence_id;
        if (foundId) {
          localStorage.setItem('agenceId', foundId.toString());
          return foundId.toString();
        }
      } catch (e) {
        console.error("Erreur lecture user local :", e);
      }
    }
    if (trajets && trajets.length > 0) {
      const trajetAvecAgence = trajets.find(t => t.agence?.id);
      if (trajetAvecAgence) {
        const autoDetectedId = trajetAvecAgence.agence.id.toString();
        localStorage.setItem('agenceId', autoDetectedId);
        return autoDetectedId;
      }
    }
    return null;
  };

  const userAgenceId = getUserAgenceId();

  useEffect(() => {
    const autoHealAgenceId = async () => {
      const token = localStorage.getItem('token');
      if (!token || userRole === 'SUPER_ADMIN' || userAgenceId) return;
      try {
        const res = await api.get('/trajets/session', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const foundId = res.data?.agenceId;
        if (foundId) {
          console.log("🔹 [GariConnect] Agence ID récupéré et réparé automatiquement :", foundId);
          localStorage.setItem('agenceId', foundId.toString());
          fetchTrajets(); 
        }
      } catch (e) {
        console.error("❌ Impossible de synchroniser la session de l'agence :", e);
      }
    };
    autoHealAgenceId();
  }, [userRole, userAgenceId]);

  const formaterDateLocale = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const obtenirDatePourJourSemaine = (jour) => {
    const joursMap = {
      'DIMANCHE': 0, 'LUNDI': 1, 'MARDI': 2, 'MERCREDI': 3,
      'JEUDI': 4, 'VENDREDI': 5, 'SAMEDI': 6
    };
    const parsedJour = jour ? jour.replace(/_/g, ' ').toUpperCase() : '';
    const targetDay = joursMap[parsedJour];
    const d = new Date();
    
    if (targetDay === undefined) return formaterDateLocale(d); 
    
    const currentDay = d.getDay();
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7; 
    d.setDate(d.getDate() + diff);
    
    return formaterDateLocale(d);
  };

  const estRessourceOccupee = (ressourceId, type, jourSelectionne, trajetIdActuel) => {
    if (!ressourceId || !jourSelectionne) return false;
    
    const jourChoisiNormalise = jourSelectionne.toUpperCase().replace(/_/g, ' ');
    return trajets.some(t => {
      if (t.id === trajetIdActuel) return false;
      const ressourceTrajetId = type === 'vehicule' ? t.vehicule?.id : t.chauffeur?.id;
      if (ressourceTrajetId !== ressourceId) return false;
      const jourTrajetNormalise = (t.joursSemaine || '').toUpperCase().replace(/_/g, ' ');
      if (jourChoisiNormalise === 'TOUS LES JOURS' || jourTrajetNormalise === 'TOUS LES JOURS') {
        return true;
      }
      if (jourTrajetNormalise === jourChoisiNormalise && jourTrajetNormalise !== '') {
        return true;
      }
      if (!jourTrajetNormalise && t.dateHeureDepart) {
        const dateObj = new Date(t.dateHeureDepart);
        const mapJours = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
        if (mapJours[dateObj.getDay()] === jourChoisiNormalise) {
          return true;
        }
      }
      return false;
    });
  };

  useEffect(() => { 
    fetchTrajets();
    if (userRole === 'SUPER_ADMIN') {
      fetchAgences();
    }
  }, [userRole]);

  const fetchTrajets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = userRole === 'SUPER_ADMIN' ? '/trajets/tous' : '/trajets';
      const res = await api.get(endpoint, {
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
  }, [showModal, isEditing, currentId, formData.joursSemaine]);

  const fetchRessourcesDisponibles = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const dateFiltre = obtenirDatePourJourSemaine(formData.joursSemaine);
      
      const [resVehicules, resChauffeurs] = await Promise.all([
          api.get(`/vehicules/disponibles?date=${dateFiltre}`, { headers }).catch(() => ({ data: [] })),
          api.get(`/chauffeurs/disponibles?date=${dateFiltre}`, { headers }).catch(() => ({ data: [] }))
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

  // 🟢 Mettre à jour automatiquement le formulaire Retour si la case est activée
  const handleToggleCreerRetour = (e) => {
    const checked = e.target.checked;
    setCreerRetour(checked);
    if (checked) {
      setFormDataRetour({
        depart: formData.destination,
        destination: formData.depart,
        joursSemaine: formData.joursSemaine,
        heureDepart: formData.heureDepart,
        prix: formData.prix,
        vehiculeId: formData.vehiculeId,
        chauffeurId: formData.chauffeurId,
        statut: formData.statut,
        placesDisponibles: formData.placesDisponibles,
        agenceId: formData.agenceId
      });
    }
  };

  const handleVehiculeChange = (vId) => {
    const v = vehicules.find(item => item.id === parseInt(vId, 10));
    const updatedPlaces = v ? (v.capacite || v.capaciteTotale || formData.placesDisponibles) : formData.placesDisponibles;
    
    setFormData(prev => ({
      ...prev, 
      vehiculeId: vId,
      placesDisponibles: updatedPlaces
    }));
    if (creerRetour) {
      setFormDataRetour(prev => ({
        ...prev,
        vehiculeId: vId,
        placesDisponibles: updatedPlaces
      }));
    }
  };

  // Helper pour construire le payload d'un trajet
  const construirePayload = (data) => {
    const prixParsed = parseFloat(data.prix) || 0;
    const placesParsed = parseInt(data.placesDisponibles, 10) || 0;
    const vIdParsed = parseInt(data.vehiculeId, 10);
    const cIdParsed = parseInt(data.chauffeurId, 10);
    const dateCible = obtenirDatePourJourSemaine(data.joursSemaine);
    const dateFormattee = `${dateCible} ${data.heureDepart}:00`;
    const payload = {
      depart: data.depart,
      destination: data.destination,
      joursSemaine: data.joursSemaine,
      dateHeureDepart: dateFormattee, 
      prix: prixParsed,
      statut: data.statut,
      placesDisponibles: placesParsed,
      vehicule: { id: vIdParsed },
      chauffeur: { id: cIdParsed }
    };
    if (userRole === 'SUPER_ADMIN' && data.agenceId) {
      const aIdParsed = parseInt(data.agenceId, 10);
      payload.agence = { id: aIdParsed };
    } else if (userRole !== 'SUPER_ADMIN') {
      const resolvedAgenceId = getUserAgenceId();
      if (resolvedAgenceId) {
        const aIdParsed = parseInt(resolvedAgenceId, 10);
        payload.agence = { id: aIdParsed };
      }
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehiculeId || !formData.chauffeurId) {
        alert("⚠️ Veuillez sélectionner un véhicule et un chauffeur pour le trajet aller.");
        return;
    }
    if (creerRetour && (!formDataRetour.vehiculeId || !formDataRetour.chauffeurId)) {
        alert("⚠️ Veuillez sélectionner un véhicule et un chauffeur pour le trajet retour.");
        return;
    }

    const payloadAller = construirePayload(formData);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (isEditing) {
        // Modification d'un seul trajet
        await api.put(`/trajets/${currentId}`, payloadAller, config);
        alert("✅ Trajet mis à jour avec succès !");
      } else {
        if (creerRetour) {
          // 🟢 Envoi groupé (batch) pour la création simultanée de l'Aller et du Retour
          const payloadRetour = construirePayload(formDataRetour);
          const payloadBatch = [payloadAller, payloadRetour];
          
          await api.post('/trajets/batch', payloadBatch, config);
          alert("✅ Trajet aller ET trajet retour enregistrés simultanément avec succès !");
        } else {
          // Création simple d'un seul trajet
          await api.post('/trajets', payloadAller, config);
          alert("✅ Trajet enregistré avec succès !");
        }
      }

      setShowModal(false);
      setCreerRetour(false);
      fetchTrajets(); 
    } catch (err) {
      console.error("Erreur HTTP complète :", err);
      const errorData = err.response?.data;
      
      let msg = "Le serveur refuse les données transmises.";
      if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.errors && Array.isArray(errorData.errors)) {
          msg = errorData.errors.map(e => `• ${e.field} : ${e.defaultMessage}`).join('\n');
        } else if (errorData.message) {
          msg = errorData.message;
        } else if (!errorData.message && !errorData.error) {
          msg = Object.entries(errorData).map(([k, v]) => `• ${k}: ${v}`).join('\n');
        } else {
          msg = errorData.error || JSON.stringify(errorData);
        }
      } else if (typeof errorData === 'string') {
        msg = errorData;
      }
      alert("⚠️ Échec de l'enregistrement :\n\n" + msg);
    }
  };

  const handleEditClick = (trajet) => {
    let heureExtraite = '';
    if (trajet.dateHeureDepart) {
      const chaineDate = trajet.dateHeureDepart;
      const indexSeparateur = chaineDate.includes('T') ? chaineDate.indexOf('T') : chaineDate.indexOf(' ');
      if (indexSeparateur !== -1) {
        heureExtraite = chaineDate.substring(indexSeparateur + 1, indexSeparateur + 6);
      }
    }
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
    setCreerRetour(false);
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
              <FaMapMarkerAlt className="text-white text-xl"/>
            </div>
            Planning GariConnect
          </h1>
          <p className="text-slate-400 font-bold text-xs mt-1 italic uppercase">Gestion des rotations véhicules et chauffeurs</p>
        </div>
        <button 
          onClick={() => { 
            setIsEditing(false); 
            setFormData({depart:'', destination:'', joursSemaine:'', heureDepart:'', prix:'', vehiculeId:'', chauffeurId:'', statut:'PROGRAMME', placesDisponibles: '', agenceId: ''}); 
            setFormDataRetour({depart:'', destination:'', joursSemaine:'', heureDepart:'', prix:'', vehiculeId:'', chauffeurId:'', statut:'PROGRAMME', placesDisponibles: '', agenceId: ''});
            setCreerRetour(false);
            setShowModal(true); 
          }}
          className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <FaPlus/> Nouvelle programmation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          trajets
            .filter(t => {
              if (userRole === 'SUPER_ADMIN') return true; 
              if (!userAgenceId) return true; 
              return t.agence?.id === parseInt(userAgenceId, 10);
            })
            .map(t => (
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
                          {t.dateHeureDepart ? (t.dateHeureDepart.includes('T') ? t.dateHeureDepart.substring(11, 16) : t.dateHeureDepart.substring(11, 16)) : '--:--'}
                       </span>
                       <FaArrowRight className="text-slate-300"/>
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
                           <FaUsers/> {t.placesDisponibles} places restantes
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
            ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[90vh] border dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">
                {isEditing ? "Editer le trajet" : "Nouveau trajet"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400"><FaTimes/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {userRole === 'SUPER_ADMIN' && (
                  <div className="col-span-full">
                    <FormGroup icon={<FaUsers />} label="Agence propriétaire">
                      <select
                        className={inputClass}
                        value={formData.agenceId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, agenceId: val }));
                          if (creerRetour) setFormDataRetour(prev => ({ ...prev, agenceId: val }));
                        }}
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
                <FormGroup icon={<FaCalendarAlt />} label="Jours de la semaine (Aller)">
                  <select 
                    className={inputClass} 
                    value={formData.joursSemaine} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, joursSemaine: val }));
                      if (creerRetour) setFormDataRetour(prev => ({ ...prev, joursSemaine: val }));
                    }} 
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
                    <option value="TOUS_LES_JOURS">Tous les jours</option>
                  </select>
                </FormGroup>
                <FormGroup icon={<FaClock />} label="Heure de départ (Aller)">
                  <input 
                    type="time" 
                    className={inputClass} 
                    value={formData.heureDepart} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, heureDepart: val }));
                      if (creerRetour && !formDataRetour.heureDepart) setFormDataRetour(prev => ({ ...prev, heureDepart: val }));
                    }} 
                    required 
                  />
                </FormGroup>
                <FormGroup icon={<FaBus />} label="Véhicule (Libre)">
                  <select 
                    className={inputClass} 
                    value={formData.vehiculeId} 
                    onChange={(e) => handleVehiculeChange(e.target.value)} 
                    required
                  >
                    <option value="">Sélectionner un véhicule...</option>
                    {vehicules
                      .filter(v => {
                        if (isEditing && currentId) {
                          const trajetActuel = trajets.find(t => t.id === currentId);
                          if (trajetActuel && trajetActuel.vehicule?.id === v.id) return true;
                        }
                        return !estRessourceOccupee(v.id, 'vehicule', formData.joursSemaine, currentId);
                      })
                      .map(v => (
                        <option key={v.id} value={v.id}>
                          {v.plaqueImmatriculation || v.plaque_immatriculation} - {v.marque} {v.modele}
                        </option>
                      ))
                    }
                  </select>
                </FormGroup>
                <FormGroup icon={<FaUserTie />} label="Chauffeur (Libre)">
                  <select 
                    className={inputClass} 
                    value={formData.chauffeurId} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, chauffeurId: val }));
                      if (creerRetour) setFormDataRetour(prev => ({ ...prev, chauffeurId: val }));
                    }} 
                    required
                  >
                    <option value="">Sélectionner un chauffeur...</option>
                    {chauffeurs
                      .filter(c => {
                        if (isEditing && currentId) {
                          const trajetActuel = trajets.find(t => t.id === currentId);
                          if (trajetActuel && trajetActuel.chauffeur?.id === c.id) return true;
                        }
                        return !estRessourceOccupee(c.id, 'chauffeur', formData.joursSemaine, currentId);
                      })
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                        </option>
                      ))
                    }
                  </select>
                </FormGroup>
                <FormGroup icon={<FaMapMarkerAlt />} label="Ville de Départ">
                  <input 
                    className={inputClass} 
                    value={formData.depart} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, depart: val }));
                      if (creerRetour) setFormDataRetour(prev => ({ ...prev, destination: val }));
                    }} 
                    placeholder="Ex: Beni" 
                    required 
                  />
                </FormGroup>
                <FormGroup icon={<FaArrowRight />} label="Ville de Destination">
                  <input 
                    className={inputClass} 
                    value={formData.destination} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, destination: val }));
                      if (creerRetour) setFormDataRetour(prev => ({ ...prev, depart: val }));
                    }} 
                    placeholder="Ex: Butembo" 
                    required 
                  />
                </FormGroup>
                <FormGroup icon={<FaMoneyBillWave />} label="Prix du ticket (FC)">
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={formData.prix} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, prix: val }));
                      if (creerRetour) setFormDataRetour(prev => ({ ...prev, prix: val }));
                    }} 
                    required 
                  />
                </FormGroup>
                <FormGroup icon={<FaUsers />} label="Places Disponibles">
                  <input 
                    type="number" 
                    className={`${inputClass} bg-blue-50/50 dark:bg-blue-900/10`} 
                    value={formData.placesDisponibles} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, placesDisponibles: val }));
                      if (creerRetour) setFormDataRetour(prev => ({ ...prev, placesDisponibles: val }));
                    }} 
                    placeholder="Se remplit automatiquement..."
                    required 
                  />
                </FormGroup>
              </div>

              {/* 🟢 BLOC SUGGESTION TRAJET RETOUR (CORRIGÉ & ALIGNÉ) */}
              {!isEditing && formData.depart.trim() !== '' && formData.destination.trim() !== '' && (
                <div className="col-span-full p-4 bg-blue-50/60 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-2xl transition-all space-y-4 my-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={creerRetour} 
                      onChange={handleToggleCreerRetour}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-black text-xs md:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <FaExchangeAlt className="text-blue-600" /> 
                      Suggérer / Créer le trajet retour ({formData.destination} ➔ {formData.depart})
                    </span>
                  </label>
                  {creerRetour && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                      <p className="col-span-full text-xs font-bold text-blue-600 dark:text-blue-400">
                        💡 Informations du trajet retour pré-remplies (modifiables) :
                      </p>
                      <FormGroup icon={<FaMapMarkerAlt />} label="Départ Retour">
                        <input 
                          className={inputClass} 
                          value={formDataRetour.depart} 
                          onChange={(e) => setFormDataRetour(prev => ({ ...prev, depart: e.target.value }))} 
                          required 
                        />
                      </FormGroup>
                      <FormGroup icon={<FaArrowRight />} label="Destination Retour">
                        <input 
                          className={inputClass} 
                          value={formDataRetour.destination} 
                          onChange={(e) => setFormDataRetour(prev => ({ ...prev, destination: e.target.value }))} 
                          required 
                        />
                      </FormGroup>
                      <FormGroup icon={<FaCalendarAlt />} label="Jour (Retour)">
                        <select 
                          className={inputClass} 
                          value={formDataRetour.joursSemaine} 
                          onChange={(e) => setFormDataRetour(prev => ({ ...prev, joursSemaine: e.target.value }))} 
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
                          <option value="TOUS_LES_JOURS">Tous les jours</option>
                        </select>
                      </FormGroup>
                      <FormGroup icon={<FaClock />} label="Heure de départ (Retour)">
                        <input 
                          type="time" 
                          className={inputClass} 
                          value={formDataRetour.heureDepart} 
                          onChange={(e) => setFormDataRetour(prev => ({ ...prev, heureDepart: e.target.value }))} 
                          required 
                        />
                      </FormGroup>
                      <FormGroup icon={<FaMoneyBillWave />} label="Prix Ticket Retour (FC)">
                        <input 
                          type="number" 
                          className={inputClass} 
                          value={formDataRetour.prix} 
                          onChange={(e) => setFormDataRetour(prev => ({ ...prev, prix: e.target.value }))} 
                          required 
                        />
                      </FormGroup>
                      <FormGroup icon={<FaUsers />} label="Places Disponibles (Retour)">
                        <input 
                          type="number" 
                          className={inputClass} 
                          value={formDataRetour.placesDisponibles} 
                          onChange={(e) => setFormDataRetour(prev => ({ ...prev, placesDisponibles: e.target.value }))} 
                          required 
                        />
                      </FormGroup>
                    </div>
                  )}
                </div>
              )}
              <button 
                type="submit" 
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 mt-4"
              >
                <FaSave/> {isEditing ? "Enregistrer les modifications" : (creerRetour ? "Valider les 2 programmations (Aller & Retour)" : "Valider la programmation")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trajets;
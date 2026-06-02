import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api'; 
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaChevronRight, FaBus, FaUserTag, FaBuilding, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
  const [formData, setFormData] = useState({ 
    nom: '', 
    email: '', 
    password: '',
    role: 'CLIENT', // Valeur par défaut alignée avec le backend
    agenceId: '' 
  });
  
  const [agences, setAgences] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Chargement des agences actives pour le select des chauffeurs et manageurs
  useEffect(() => {
    const fetchAgences = async () => {
      try {
        const response = await api.get('/auth/agences-liste');
        setAgences(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des agences:", err);
      }
    };
    fetchAgences();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Vérifie si le rôle nécessite d'être rattaché à une agence parente
    const requiresAgency = formData.role === 'CHAUFFEUR' || formData.role === 'AGENCY_MANAGER';

    const dataToSubmit = {
      nom: formData.nom,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      agenceEmployeur: requiresAgency ? { id: formData.agenceId } : null
    };

    try {
      const response = await api.post('/auth/register', dataToSubmit);
      const userData = response.data;

      // Logique post-inscription en fonction du rôle
      if (formData.role === 'CLIENT') {
        login(userData); 
        navigate('/client');
      } else if (formData.role === 'AGENCY_ADMIN') {
        setSuccess("Inscription réussie ! Votre compte Entreprise/Agence de transport a été créé et est en attente de validation par le Super Administrateur de la plateforme.");
      } else {
        // Cas du Chauffeur ou du Manageur
        setSuccess(`Inscription réussie ! Votre compte ${formData.role === 'CHAUFFEUR' ? 'chauffeur' : 'manageur'} est en attente de validation par l'Administrateur de votre agence.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription. Vérifiez vos informations.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* FLOU ARTISTIQUE EN ARRIÈRE-PLAN */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full bg-gradient-to-tr from-blue-200/40 to-indigo-200/40 blur-[80px] sm:blur-[120px] -z-10" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] rounded-full bg-sky-200/30 blur-[100px] -z-10" />

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(15,23,42,0.08)] border border-slate-200/60 p-6 sm:p-10 md:p-14 flex flex-col"
      >
        
        {/* LOGO & ENTÊTE ÉPURÉS */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 shadow-sm border border-indigo-100/50">
            <FaBus size={26} />
          </div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">GariConnect</span>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight mb-2">Créer un compte</h1>
          <p className="text-slate-500 text-sm font-medium max-w-sm">
            Rejoignez le réseau pour gérer vos trajets, vos finances ou votre flotte en toute simplicité.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-3xl text-center"
            >
              <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <FaShieldAlt size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Inscription enregistrée !</h3>
              <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed px-4">{success}</p>
              <Link to="/login" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm shadow-md">
                Aller à l'écran de connexion <FaChevronRight size={10} />
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-2xl">
                  {error}
                </motion.div>
              )}

              {/* INPUTS SUR DEUX COLONNES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CHAMP NOM COMPLET */}
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                    <FaUser size={15} />
                  </span>
                  <input 
                    type="text" placeholder="Nom complet / Nom de l'agence" required 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-semibold text-slate-800 text-sm transition-all focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]"
                    onChange={(e) => setFormData({...formData, nom: e.target.value})} 
                  />
                </div>

                {/* CHAMP EMAIL */}
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                    <FaEnvelope size={15} />
                  </span>
                  <input 
                    type="email" placeholder="Adresse email" required 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-semibold text-slate-800 text-sm transition-all focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]"
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CHAMP RÔLE PUBLIQUEMENT AUTORISÉ */}
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none z-10">
                    <FaUserTag size={15} />
                  </span>
                  <select 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-semibold text-slate-700 text-sm appearance-none cursor-pointer relative z-0 transition-all focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]" 
                    value={formData.role} 
                    onChange={(e) => {
                      setFormData({...formData, role: e.target.value, agenceId: ''});
                    }}
                  >
                    <option value="CLIENT">Client / Passager</option>
                    <option value="CHAUFFEUR">Chauffeur</option>
                    <option value="AGENCY_MANAGER">Manageur de l'agence</option>
                    <option value="AGENCY_ADMIN">Agence de Transport (Créer une entreprise)</option>
                  </select>
                </div>

                {/* CHAMP MOT DE PASSE */}
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                    <FaLock size={15} />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mot de passe" 
                    required 
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-semibold text-slate-800 text-sm transition-all focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]"
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors focus:outline-none"
                  >
                    {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
              </div>

              {/* MESSAGE INFORMATIF LIÉ AU RÔLE DE L'AGENCE */}
              <AnimatePresence>
                {formData.role === 'AGENCY_ADMIN' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1, marginTop: 12 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs font-medium text-blue-800 flex items-start gap-3">
                      <div className="mt-0.5"><FaShieldAlt size={14} className="text-blue-600" /></div>
                      <p className="leading-relaxed">
                        Vous êtes sur le point d'inscrire une entreprise de transport sur GariConnect. Après soumission, le Super Administrateur de la plateforme devra examiner vos informations et activer manuellement votre espace de gestion.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SELECTION DE L'AGENCE (POUR CHAUFFEURS ET MANAGEURS) */}
              <AnimatePresence>
                {(formData.role === 'CHAUFFEUR' || formData.role === 'AGENCY_MANAGER') && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, marginTop: 0 }} 
                    animate={{ height: 'auto', opacity: 1, marginTop: 12 }} 
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="relative group overflow-hidden"
                  >
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 z-10 pointer-events-none">
                      <FaBuilding size={15} />
                    </span>
                    <select 
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-indigo-50/40 border border-indigo-100 focus:border-indigo-500 rounded-2xl outline-none font-bold text-indigo-900 text-sm appearance-none cursor-pointer focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)]" 
                      value={formData.agenceId}
                      onChange={(e) => setFormData({...formData, agenceId: e.target.value})}
                    >
                      <option value="">Sélectionnez votre agence employeur</option>
                      {agences.map((agence) => (
                        <option key={agence.id} value={agence.id}>{agence.nom}</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BOUTON DE SOUMISSION */}
              <motion.button 
                whileHover={{ y: -1, boxShadow: "0 12px 25px -5px rgba(79,70,229,0.2)" }}
                whileTap={{ y: 0 }}
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70 text-sm mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Créer le compte <FaChevronRight size={10} /></>
                )}
              </motion.button>
            </form>
          )}
        </AnimatePresence>

        {/* PIED DE PAGE DE L'INSCRIPTION */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400 font-medium">
          <p>
            Déjà inscrit ? 
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors ml-1 underline decoration-1 underline-offset-4">
              Connectez-vous
            </Link>
          </p>
          <div className="flex items-center gap-1 bg-slate-100/70 px-3 py-1.5 rounded-xl font-semibold text-slate-500">
            <FaShieldAlt size={12} className="text-indigo-500" /> Données chiffrées
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Register;
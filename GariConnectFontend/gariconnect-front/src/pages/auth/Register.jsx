import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaChevronRight, FaBus, FaUserTag, FaBuilding, FaShieldAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
  const [formData, setFormData] = useState({ 
    nom: '', 
    email: '', 
    password: '',
    role: 'CLIENT',
    agenceId: '' 
  });
  
  const [agences, setAgences] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgences = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/auth/agences-liste');
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

    const dataToSubmit = {
      nom: formData.nom,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      agenceEmployeur: formData.role === 'CHAUFFEUR' ? { id: formData.agenceId } : null
    };

    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', dataToSubmit);
      const userData = response.data;

      if (formData.role === 'CLIENT') {
        login(userData); 
        navigate('/client');
      } else {
        setSuccess(formData.role === 'AGENCE' 
          ? "Inscription réussie ! Votre agence est en attente de validation par l'administrateur."
          : "Inscription réussie ! Votre compte est en attente de validation par votre agence.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4 font-sans selection:bg-indigo-100">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden border border-slate-100"
      >
        
        {/* SECTION VISUELLE (GAUCHE) */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-[#4338ca] to-[#6366f1] p-10 md:p-12 flex flex-col justify-between text-white relative">
          <div className="z-10">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                <FaBus size={28} />
              </div>
              <span className="text-2xl font-black tracking-tighter">GariConnect</span>
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl font-black leading-tight mb-6">
              Rejoignez la <br /> 
              <span className="text-indigo-200">communauté</span>.
            </h2>
            <p className="text-indigo-100 text-sm font-medium opacity-80 leading-relaxed">
              Créez votre profil en quelques secondes et commencez à optimiser vos déplacements ou votre flotte.
            </p>
          </div>

          <div className="z-10 mt-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest">
              <FaShieldAlt className="text-indigo-300" /> Inscription Sécurisée
            </div>
          </div>
        </div>

        {/* SECTION FORMULAIRE (DROITE) */}
        <div className="w-full md:w-7/12 p-10 lg:p-16 flex flex-col justify-center bg-white">
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Créer un compte</h1>
            <div className="w-12 h-1.5 bg-indigo-600 rounded-full"></div>
          </motion.div>
          
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2rem] text-center"
              >
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
                  <FaShieldAlt size={30} />
                </div>
                <h3 className="text-xl font-black text-emerald-900 mb-2">Félicitations !</h3>
                <p className="text-emerald-700 font-medium mb-6 text-sm">{success}</p>
                <Link to="/login" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95">
                  Retour à la connexion <FaChevronRight size={12} />
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs font-bold rounded-r-xl">
                    {error}
                  </motion.div>
                )}

                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="text" placeholder="Nom complet" required 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-semibold text-slate-700 transition-all"
                      onChange={(e) => setFormData({...formData, nom: e.target.value})} 
                    />
                  </div>
                  <div className="relative group">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="email" placeholder="Email" required 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-semibold text-slate-700 transition-all"
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <FaUserTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors z-10" />
                    <select 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-semibold text-slate-700 appearance-none cursor-pointer relative z-0" 
                      value={formData.role} 
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="CLIENT">Client</option>
                      <option value="CHAUFFEUR">Chauffeur</option>
                      <option value="AGENCE">Agence</option>
                    </select>
                  </div>
                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="password" placeholder="Mot de passe" required 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-semibold text-slate-700 transition-all"
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />
                  </div>
                </motion.div>

                <AnimatePresence>
                  {formData.role === 'CHAUFFEUR' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="relative group overflow-hidden"
                    >
                      <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors z-10" />
                      <select 
                        required
                        className="w-full pl-12 pr-4 py-4 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-500 rounded-2xl outline-none font-bold text-indigo-900 appearance-none cursor-pointer" 
                        value={formData.agenceId}
                        onChange={(e) => setFormData({...formData, agenceId: e.target.value})}
                      >
                        <option value="">Choisir votre agence</option>
                        {agences.map((agence) => (
                          <option key={agence.id} value={agence.id}>{agence.nom}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-4 bg-slate-900 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-slate-200 transition-all flex justify-center items-center gap-3 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>CRÉER MON COMPTE <FaChevronRight size={14} /></>
                  )}
                </motion.button>
              </form>
            )}
          </AnimatePresence>

          <motion.p variants={itemVariants} className="mt-8 text-center text-slate-400 font-bold text-sm">
            Déjà inscrit ? <Link to="/login" className="text-indigo-600 hover:underline decoration-2 underline-offset-4">Connectez-vous</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
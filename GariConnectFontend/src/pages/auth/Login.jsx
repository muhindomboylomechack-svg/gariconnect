import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
// Remplacement de FaShieldAlt par FaEye et FaEyeSlash pour une meilleure UX de visibilité
import { FaEnvelope, FaLock, FaBus, FaChevronRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion'; // Import de Framer Motion

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // État pour afficher/masquer le mot de passe
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', credentials);
      const userData = response.data;

      if (userData.token) {
        localStorage.removeItem('nomAgence');
        login(userData);

        if (userData.nomAgence || userData.agenceNom) {
            localStorage.setItem('nomAgence', userData.nomAgence || userData.agenceNom);
        }

        if (userData.mustChangePassword) {
          navigate('/change-password-obligatoire');
          return;
        }

        const roleRoutes = {
          ADMIN: '/admin', AGENCE: '/agence', CHAUFFEUR: '/chauffeur', CLIENT: '/client'
        };
        
        navigate(roleRoutes[userData.role] || '/');
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      setError(serverMessage || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  // Variantes pour les animations de liste
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col md:flex-row-reverse w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden"
      >
        
        {/* SECTION VISUELLE AVEC ANIMATION DE FLOTTEMENT */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#1e1b4b] via-[#4338ca] to-[#6366f1] p-10 md:p-16 flex flex-col justify-between text-white relative">
          <div className="z-10">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                <FaBus size={28} />
              </div>
              <span className="text-2xl font-black tracking-tighter">GariConnect</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              L'avenir du <br /> 
              <span className="text-indigo-300 underline decoration-indigo-400/30">transport</span> à Beni.
            </h2>
          </div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="z-10 mt-10 p-4 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10"
          >
            <p className="text-sm font-medium opacity-90 leading-relaxed">
              "Gerez votre flotte, vos chauffeurs et vos finances sur une seule et même plateforme sécurisée."
            </p>
          </motion.div>
        </div>

        {/* SECTION FORMULAIRE AVEC APPARITION PROGRESSIVE */}
        <div className="w-full md:w-1/2 p-10 md:p-16 lg:p-20 flex flex-col justify-center bg-white">
          <motion.div variants={itemVariants} className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-2">Connexion</h1>
            <div className="w-12 h-1.5 bg-indigo-600 rounded-full"></div>
          </motion.div>

          {/* Affichage des erreurs si le serveur renvoie un problème */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-xl"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Email Professionnel</label>
              <div className="relative group">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="email" name="email" value={credentials.email} onChange={handleChange} required
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold text-slate-700"
                  placeholder="votre@agence.com"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Mot de passe</label>
              </div>
              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={credentials.password} 
                  onChange={handleChange} 
                  required
                  className="w-full pl-12 pr-14 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold text-slate-700"
                  placeholder="••••••••"
                />
                
                {/* Bouton pour basculer la visibilité du mot de passe */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1 transition-colors focus:outline-none"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.button 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all flex justify-center items-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>SE CONNECTER <FaChevronRight size={14} /></>
              )}
            </motion.button>

            <motion.div variants={itemVariants} className="pt-6 text-center border-t border-slate-50">
              <Link to="/register" className="text-slate-400 font-bold text-sm hover:text-indigo-600 transition-colors">
                Besoin d'un compte ? <span className="text-indigo-600 underline underline-offset-4">Inscrivez votre agence</span>
              </Link>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
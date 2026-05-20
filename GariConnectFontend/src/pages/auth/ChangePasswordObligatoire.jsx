
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FaLock, FaBus, FaCheckCircle, FaShieldAlt, FaArrowRight } from 'react-icons/fa';

const ChangePasswordObligatoire = () => {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Récupération de l'utilisateur stocké lors du login
  const user = JSON.parse(localStorage.getItem('user'));

  // Sécurité : Si aucun utilisateur n'est trouvé, on redirige vers le login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validation de correspondance
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    // 2. Validation de longueur
    if (passwords.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      // 3. Appel à l'API (Route : /api/auth/update-first-password)
      await api.post('/auth/update-first-password', {
        userId: user.id,
        newPassword: passwords.newPassword
      });

      // 4. Succès
      alert("Mot de passe mis à jour avec succès ! Veuillez vous reconnecter.");
      
      // On déconnecte proprement et on renvoie au login
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden min-h-[600px]">
        
        {/* SECTION GAUCHE : DESIGN IDENTIQUE AU LOGIN */}
        <div className="w-full md:w-5/12 bg-[#2347be] p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 opacity-10 text-[15rem] rotate-12">
            <FaShieldAlt />
          </div>
          
          <div className="z-10 text-center">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-[2rem] flex items-center justify-center mb-8 mx-auto shadow-2xl border border-white/20">
              <FaBus size={50} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-4">Sécurité</h1>
            <div className="w-16 h-1.5 bg-blue-400 mx-auto rounded-full mb-6"></div>
            <p className="text-blue-100 font-bold text-lg italic opacity-90 px-4">
              "Protégez votre compte avec un mot de passe personnel."
            </p>
          </div>
        </div>

        {/* SECTION DROITE : FORMULAIRE DE MISE À JOUR */}
        <div className="w-full md:w-7/12 p-12 lg:p-20 flex flex-col justify-center">
          <div className="mb-10">
            <span className="px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              Action Requise
            </span>
            <h2 className="text-4xl font-black text-slate-800 mt-4 mb-2">Nouveau mot de passe</h2>
            <p className="text-slate-400 font-bold italic">Veuillez remplacer le code provisoire fourni par l'administrateur.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-8 text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ Nouveau Mot de passe */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Définir un mot de passe</label>
              <div className="relative group">
                <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2347be] transition-colors" />
                <input 
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 6 caractères"
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#2347be] focus:bg-white rounded-[1.5rem] outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Champ Confirmation */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmer le mot de passe</label>
              <div className="relative group">
                <FaCheckCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2347be] transition-colors" />
                <input 
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Répétez le mot de passe"
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#2347be] focus:bg-white rounded-[1.5rem] outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-[#2347be] hover:bg-[#1a368f] text-white font-black rounded-[1.5rem] shadow-2xl shadow-blue-200 transition-all flex justify-center items-center gap-3 text-lg"
            >
              {loading ? "TRAITEMENT..." : <>ACTIVER MON COMPTE <FaArrowRight /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordObligatoire;
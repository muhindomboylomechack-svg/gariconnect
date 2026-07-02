import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FaLock, FaBus, FaCheckCircle, FaShieldAlt, FaArrowRight, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';

const ChangePasswordObligatoire = () => {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keepCurrentLoading, setKeepCurrentLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Récupération de l'utilisateur et de ses identifiants temporaires stockés lors du login
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

  /**
   * OPTION A : L'utilisateur choisit un NOUVEAU mot de passe personnalisé
   */
  const handleCustomPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/update-password', {
        newPassword: passwords.newPassword
      });

      alert("Mot de passe mis à jour avec succès ! Veuillez vous reconnecter.");
      logout();
      navigate('/login');
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data;
      setError(serverMessage || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * OPTION B : L'utilisateur décide de CONSERVER le code secret reçu
   * On renvoie le même mot de passe au backend pour simplement passer le flag 'mustChangePassword' à false.
   */
  const handleKeepCurrentPassword = async () => {
    setError('');
    
    // Récupération du mot de passe temporaire saisi à l'écran de login
    const temporaryPassword = localStorage.getItem('temp_login_password') || "Gari2026!";

    setKeepCurrentLoading(true);
    try {
      await api.post('/auth/update-password', {
        newPassword: temporaryPassword
      });

      alert("Le code secret a été enregistré comme votre mot de passe définitif !");
      
      // Nettoyage de la variable temporaire
      localStorage.removeItem('temp_login_password');
      
      logout();
      navigate('/login');
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data;
      setError(serverMessage || "Impossible de confirmer le code actuel.");
    } finally {
      setKeepCurrentLoading(false);
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
              "Validez votre accès ou personnalisez votre clé de sécurité."
            </p>
          </div>
        </div>

        {/* SECTION DROITE : DEUX OPTIONS PROPOSÉES */}
        <div className="w-full md:w-7/12 p-12 lg:p-20 flex flex-col justify-center">
          <div className="mb-8">
            <span className="px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              Première Connexion
            </span>
            <h2 className="text-3xl font-black text-slate-800 mt-4 mb-2">Activation de votre compte</h2>
            <p className="text-slate-400 font-bold italic text-sm">
              Souhaitez-vous conserver le code reçu ou configurer votre propre mot de passe ?
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-sm font-bold">
              {error}
            </div>
          )}

          {/* --- OPTION 1 : BOUTON DE CONFIRMATION RAPIDE --- */}
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Option Rapide :</h3>
            <button 
              type="button"
              onClick={handleKeepCurrentPassword}
              disabled={keepCurrentLoading || loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-100 transition-all flex justify-center items-center gap-3 text-sm uppercase"
            >
              {keepCurrentLoading ? "CONFIRMATION..." : <><FaKey /> Conserver le code secret actuel</>}
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Ou Personnaliser</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* --- OPTION 2 : FORMULAIRE DE CHANGEMENT COMPLET --- */}
          <form onSubmit={handleCustomPasswordSubmit} className="space-y-4">
            {/* Champ Nouveau Mot de passe */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
              <div className="relative group">
                <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2347be] transition-colors z-10" />
                <input 
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  required={!keepCurrentLoading}
                  placeholder="Minimum 6 caractères"
                  className="w-full pl-14 pr-14 py-4 bg-slate-50 border-2 border-transparent focus:border-[#2347be] focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2347be] transition-colors focus:outline-none"
                >
                  {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {/* Champ Confirmation */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmer le nouveau choix</label>
              <div className="relative group">
                <FaCheckCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2347be] transition-colors z-10" />
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  required={!keepCurrentLoading}
                  placeholder="Répétez le mot de passe"
                  className="w-full pl-14 pr-14 py-4 bg-slate-50 border-2 border-transparent focus:border-[#2347be] focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2347be] transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || keepCurrentLoading}
              className="w-full py-4 bg-[#2347be] hover:bg-[#1a368f] text-white font-black rounded-xl shadow-xl shadow-blue-100 transition-all flex justify-center items-center gap-3 text-sm uppercase"
            >
              {loading ? "TRAITEMENT..." : <>Enregistrer le nouveau mot de passe <FaArrowRight /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordObligatoire;
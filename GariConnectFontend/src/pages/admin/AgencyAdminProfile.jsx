import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const AgencyAdminProfile = () => {
  // Récupération de l'utilisateur connecté et de la méthode pour mettre à jour le contexte global
  const { user, updateUser } = useAuth(); 
  
  // Référence pour le sélecteur de fichier masqué
  const fileInputRef = useRef(null);

  // États pour les informations du profil (liés à /api/users/profile)
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState(''); // L'email reste en lecture seule car non modifiable côté backend
  const [photoUrl, setPhotoUrl] = useState('');

  // États pour le changement de mot de passe (liés à /api/users/change-password)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // États de gestion des retours utilisateur et chargements
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Initialisation des champs avec les données actuelles de l'utilisateur de l'AuthContext
  useEffect(() => {
    if (user) {
      setNom(user.nom || '');
      setTelephone(user.telephone || '');
      setEmail(user.email || '');
      setPhotoUrl(user.photoUrl || '');
    }
  }, [user]);

  // Base URL de votre API Spring Boot
  const API_BASE_URL = 'http://localhost:8080/api/users';

  // 1. GESTION DU CLIC ET DE L'UPLOAD DE L'AVATAR (POST ou PATCH /api/users/profile/avatar)
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation locale rapide : taille max 2 Mo
    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'La photo est trop lourde. Maximum 2 Mo.' });
      return;
    }

    setIsUploadingAvatar(true);
    setStatusMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('avatar', file); // Correspond à @RequestParam("avatar") MultipartFile file en Spring Boot

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'POST', 
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
          // ⚠️ ATTENTION : Ne pas mettre 'Content-Type': 'multipart/form-data'. 
          // Le navigateur doit le définir lui-même pour inclure la limite ("boundary").
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger l'avatar");
      }

      // On extrait l'URL de l'image renvoyée par le serveur (ex: stockée en local ou sur Cloudinary/S3)
      const updatedPhotoUrl = data.photoUrl;
      setPhotoUrl(updatedPhotoUrl);

      // Synchronisation immédiate avec l'AuthContext
      if (updateUser) {
        updateUser({
          ...user,
          photoUrl: updatedPhotoUrl
        });
      }

      setStatusMessage({ type: 'success', text: 'Photo de profil mise à jour avec succès !' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || "Erreur lors de l'envoi de la photo." });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 2. MISE À JOUR DES INFORMATIONS GÉNÉRALES (PATCH /api/users/profile)
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setIsSavingInfo(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          nom: nom,
          telephone: telephone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Impossible de mettre à jour le profil');
      }

      if (updateUser) {
        updateUser({
          ...user,
          nom: nom,
          telephone: telephone
        });
      }

      setStatusMessage({ type: 'success', text: data.message || 'Profil mis à jour avec succès !' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setIsSavingInfo(false);
    }
  };

  // 3. CHANGEMENT DU MOT DE PASSE (PATCH /api/users/change-password)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setIsSavingPassword(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      }

      setStatusMessage({ type: 'success', text: data.message || 'Mot de passe mis à jour avec succès !' });
      
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || "L'ancien mot de passe est incorrect." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête contextuel */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Mon Profil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gérez vos coordonnées d'agence et la sécurité de votre compte GariConnect.</p>
      </div>

      {/* Alerte de statut (Succès / Erreur) */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border animate-in fade-in duration-200 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
        }`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* =========================================================================
            SECTION VISUELLE : CARTE DE PRÉVISUALISATION + INPUT PHOTO
           ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center justify-center space-y-4 transition-colors">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Avatar Administrateur</span>
          
          {/* Conteneur de l'avatar cliquable avec effet de survol */}
          <div 
            className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-md ring-4 ring-indigo-500/10 dark:ring-indigo-400/20"
            onClick={handleAvatarClick}
            title="Modifier la photo de profil"
          >
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt="Profil" 
                className="w-32 h-32 object-cover transition-all group-hover:scale-105 group-hover:brightness-75"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-4xl transition-all group-hover:brightness-90">
                {nom ? nom.charAt(0).toUpperCase() : 'A'}
              </div>
            )}

            {/* Overlay icône caméra au survol */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            {/* Spinner de chargement pendant l'upload */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs">
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>

          {/* Input de type file masqué */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />

          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate max-w-[220px]">{nom || 'Admin Agence'}</h3>
            <p className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-full inline-block">Gérant d'Agence</p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px]">{email}</p>
        </div>

        {/* =========================================================================
            SECTION FORMULAIRE : INFORMATIONS GÉNÉRALES
           ========================================================================= */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Informations de l'administrateur
          </h2>
          
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nom complet</label>
                <input 
                  type="text" 
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all bg-slate-50/50 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Numéro de Téléphone</label>
                <input 
                  type="tel" 
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+243..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all bg-slate-50/50 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">Identifiant Email (Non modifiable)</label>
              <input 
                type="email" 
                value={email}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingInfo}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 transition-all flex items-center gap-2"
              >
                {isSavingInfo && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>

        {/* =========================================================================
            SECTION FORMULAIRE : SÉCURITÉ ET CHANGEMENT DE MOT DE PASSE
           ========================================================================= */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Sécurité du compte & Mot de passe
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Mot de passe actuel</label>
                <input 
                  type="password" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all bg-slate-50/50 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all bg-slate-50/50 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Confirmer le nouveau mot de passe</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all bg-slate-50/50 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingPassword || !oldPassword || !newPassword || !confirmPassword}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2"
              >
                {isSavingPassword && (
                  <svg className="animate-spin h-4 w-4 text-white dark:text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Mettre à jour le mot de passe
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AgencyAdminProfile;
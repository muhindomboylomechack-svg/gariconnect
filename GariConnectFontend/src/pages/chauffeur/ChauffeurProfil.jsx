import React, { useState, useEffect, useRef } from 'react';
import { 
    FaUserCircle, FaIdCard, FaPhone, FaLock, 
    FaEnvelope, FaBuilding, FaSave, FaCheckCircle, 
    FaCamera, FaExclamationCircle, FaEye, FaEyeSlash 
} from 'react-icons/fa';
import api from '../../services/api';

const ChauffeurProfil = () => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    
    // États pour le profil général
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        numero_permis: '',
        agence_nom: '',
        id_chauffeur: '',
        photo: ''
    });

    // États pour le changement de mot de passe
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [passwordData, setPasswordData] = useState({
        ancienMotDePasse: '',
        nouveauMotDePasse: '',
        confirmerMotDePasse: ''
    });

    // 🟢 NOUVEAU : États pour la visibilité des mots de passe
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/users/profile');
                const data = response.data;
                setFormData({
                    nom: data.nom || '',
                    prenom: data.prenom || '',
                    email: data.email || '',
                    telephone: data.telephone || '',
                    numero_permis: data.chauffeur_info?.numero_permis || 'Non renseigné',
                    agence_nom: data.agence?.nom || 'Indépendant',
                    id_chauffeur: data.id || '---',
                    photo: data.photoUrl || null // Correction de l'attribut backend (photoUrl au lieu de photo)
                });
            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // --- GESTION DU PROFIL ---
    const handleProfileChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const triggerFileSelect = () => fileInputRef.current.click();

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setUpdatingProfile(true);
        
        try {
            // 1. Mise à jour des informations textuelles (Le backend n'accepte que nom et telephone actuellement)
            await api.patch('/users/profile', {
                nom: formData.nom,
                telephone: formData.telephone
            });
            
            // 2. Mise à jour de l'avatar s'il a été modifié
            if (selectedFile) {
                const avatarData = new FormData();
                avatarData.append('avatar', selectedFile);
                
                await api.post('/users/profile/avatar', avatarData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la mise à jour du profil");
        } finally {
            setUpdatingProfile(false);
        }
    };

    // --- GESTION DU MOT DE PASSE ---
    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (passwordData.nouveauMotDePasse !== passwordData.confirmerMotDePasse) {
            setPasswordMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
            return;
        }

        if (passwordData.nouveauMotDePasse.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' });
            return;
        }

        setUpdatingPassword(true);
        setPasswordMessage({ type: '', text: '' });

        try {
            // 🟢 CORRECTION : Alignement avec le UserController.java (@PatchMapping("/change-password"))
            await api.patch('/users/change-password', {
                oldPassword: passwordData.ancienMotDePasse,
                newPassword: passwordData.nouveauMotDePasse
            });

            setPasswordMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
            setPasswordData({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmerMotDePasse: '' });
            
            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de la mise à jour du mot de passe.";
            setPasswordMessage({ type: 'error', text: errorMsg });
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-8">
            
            {/* EN-TÊTE */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Paramètres du Profil</h2>
            </div>
            
            {/* SECTION 1 : INFORMATIONS DU PROFIL */}
            <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Informations Personnelles</h3>
                    {profileSuccess && (
                        <span className="flex items-center gap-2 text-emerald-500 font-bold text-sm animate-pulse">
                            <FaCheckCircle /> Sauvegardé
                        </span>
                    )}
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-5xl font-black text-white shadow-2xl overflow-hidden border-4 border-transparent group-hover:border-blue-500 transition-all">
                            {previewUrl || formData.photo ? (
                                <img 
                                    src={previewUrl || formData.photo} 
                                    alt="Profil" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>{formData.nom?.charAt(0)}{formData.prenom?.charAt(0)}</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <FaCamera className="text-white text-2xl" />
                            </div>
                        </div>
                    </div>
                    <h3 className="text-xl font-black mt-4 dark:text-white">{formData.prenom} {formData.nom}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <FaBuilding className="text-blue-500 text-xs" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formData.agence_nom}</p>
                    </div>
                </div>

                {/* Champs du profil */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Nom</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 transition-all shadow-inner">
                            <FaUserCircle className="text-slate-400" />
                            <input name="nom" value={formData.nom} onChange={handleProfileChange} className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Prénom</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed">
                            <FaUserCircle className="text-slate-400" />
                            <input name="prenom" value={formData.prenom} disabled className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Email</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed">
                            <FaEnvelope className="text-slate-400" />
                            <input type="email" name="email" value={formData.email} disabled className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Téléphone</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 transition-all">
                            <FaPhone className="text-slate-400" />
                            <input name="telephone" value={formData.telephone} onChange={handleProfileChange} className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={updatingProfile}
                    className={`w-full mt-8 flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-[0.98] ${
                        updatingProfile 
                        ? 'bg-slate-400 cursor-not-allowed text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                    }`}
                >
                    {updatingProfile ? 'Synchronisation...' : <><FaSave /> Enregistrer les informations</>}
                </button>
            </form>

            {/* SECTION 2 : SÉCURITÉ & MOT DE PASSE */}
            <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <FaLock className="text-indigo-500" /> Sécurité & Mot de passe
                    </h3>
                </div>

                {passwordMessage.text && (
                    <div className={`p-4 mb-6 rounded-xl text-sm font-bold flex items-center gap-2 ${
                        passwordMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                        {passwordMessage.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle />}
                        {passwordMessage.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ancien Mot de passe */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Mot de passe actuel</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 transition-all">
                            <FaLock className="text-slate-400 shrink-0" />
                            <input 
                                type={showOldPassword ? "text" : "password"} 
                                name="ancienMotDePasse" 
                                value={passwordData.ancienMotDePasse} 
                                onChange={handlePasswordChange} 
                                required
                                placeholder="••••••••"
                                className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none shrink-0"
                            >
                                {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* Nouveau Mot de passe */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Nouveau mot de passe</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 transition-all">
                            <FaLock className="text-slate-400 shrink-0" />
                            <input 
                                type={showNewPassword ? "text" : "password"} 
                                name="nouveauMotDePasse" 
                                value={passwordData.nouveauMotDePasse} 
                                onChange={handlePasswordChange} 
                                required
                                placeholder="••••••••"
                                className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none shrink-0"
                            >
                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* Confirmer Nouveau Mot de passe */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Confirmer le nouveau mot de passe</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 transition-all">
                            <FaLock className="text-slate-400 shrink-0" />
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                name="confirmerMotDePasse" 
                                value={passwordData.confirmerMotDePasse} 
                                onChange={handlePasswordChange} 
                                required
                                placeholder="••••••••"
                                className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none shrink-0"
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={updatingPassword}
                    className={`w-full md:w-auto px-8 mt-6 flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-[0.98] ${
                        updatingPassword 
                        ? 'bg-slate-400 cursor-not-allowed text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                    }`}
                >
                    {updatingPassword ? 'Mise à jour...' : 'Changer le mot de passe'}
                </button>
            </form>
        </div>
    );
};

export default ChauffeurProfil;
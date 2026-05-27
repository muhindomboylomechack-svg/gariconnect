import React, { useState, useEffect } from 'react';
// Import de l'instance API centralisée
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Hook de traduction
import { 
    FaUser, FaPhone, FaLock, 
    FaMoon, FaSun, FaArrowLeft, FaEdit, 
    FaSave, FaBell, FaShieldAlt, FaGlobe 
} from 'react-icons/fa';

const Profil = () => {
    // --- HOOK DE TRADUCTION ---
    const { t, i18n } = useTranslation();

    // --- ÉTATS POUR LES DONNÉES UTILISATEUR ---
    const [userData, setUserData] = useState({
        nom: '',
        email: '',
        telephone: ''
    });
    
    // --- ÉTATS POUR LA SÉCURITÉ (MOT DE PASSE) ---
    const [passwords, setPasswords] = useState({ 
        oldPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    // --- ÉTATS POUR L'INTERFACE ---
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    // État pour le mode sombre
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.classList.contains('dark') || 
        localStorage.getItem('theme') === 'dark'
    );

    // Récupération des données au chargement
    useEffect(() => {
        const fetchProfil = async () => {
            try {
                // Utilisation de l'instance api centralisée
                const response = await api.get('/users/profile');

                setUserData({
                    nom: response.data.nom || '',
                    email: response.data.email || '',
                    telephone: response.data.telephone || ''
                });
            } catch (error) {
                console.error("Erreur chargement profil :", error);
                setMessage({ text: "Erreur", type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfil();
    }, []);

    // --- GESTION DU CHANGEMENT DE LANGUE ---
    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('i18nextLng', lng);
        setMessage({ text: t('success_msg'), type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 2000);
    };

    // Gestion du Mode Sombre
    const toggleDarkMode = () => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    // Gestion de la sauvegarde des informations
    const handleSave = async () => {
        setLoading(true);
        try {
            await api.patch('/users/profile', userData);
            
            setMessage({ text: t('success_msg'), type: 'success' });
            setIsEditing(false);
        } catch (error) {
            setMessage({ text: 'Erreur', type: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ text: 'Erreur mot de passe', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            await api.patch('/users/change-password', { 
                oldPassword: passwords.oldPassword, 
                newPassword: passwords.newPassword 
            });
            
            setMessage({ text: t('success_msg'), type: 'success' });
            setIsChangingPassword(false);
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ text: 'Erreur', type: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    if (loading && !userData.nom) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 animate-in fade-in duration-700">
            <div className="max-w-3xl mx-auto px-4 mt-6">
                
                {/* Header */}
                <div className="mb-10">
                    <Link to="/client/dashboard" className="text-blue-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mb-4 hover:gap-3 transition-all w-fit">
                        <FaArrowLeft /> {t('back')}
                    </Link>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                        {t('settings')}<span className="text-blue-600">.</span>
                    </h1>
                </div>

                {/* Message Flash */}
                {message.text && (
                    <div className={`p-4 mb-6 rounded-2xl font-bold text-sm flex items-center gap-3 animate-in slide-in-from-top-4 ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20'
                    }`}>
                        <FaShieldAlt /> {message.text}
                    </div>
                )}

                <div className="grid gap-8">
                    
                    {/* Carte 1 : Profil et Informations */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-bl-[100px] -z-10"></div>

                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/30">
                                    {userData.nom ? userData.nom.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{userData.nom}</h2>
                                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mt-1">{t('verified')}</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                    isEditing 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                                disabled={loading && isEditing}
                            >
                                {isEditing ? <><FaSave size={14}/> {t('save')}</> : <><FaEdit size={14}/> {t('edit')}</>}
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="group relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t('full_name')}</label>
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-transparent focus-within:border-blue-500 transition-colors">
                                    <FaUser className="text-slate-400" />
                                    <input 
                                        type="text" name="nom" value={userData.nom}
                                        onChange={handleChange} disabled={!isEditing}
                                        className="w-full bg-transparent outline-none font-bold text-slate-800 dark:text-white disabled:opacity-70"
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t('phone')}</label>
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-transparent focus-within:border-blue-500 transition-colors">
                                    <FaPhone className="text-slate-400" />
                                    <input 
                                        type="tel" name="telephone" value={userData.telephone}
                                        onChange={handleChange} disabled={!isEditing}
                                        className="w-full bg-transparent outline-none font-bold text-slate-800 dark:text-white disabled:opacity-70"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Carte 2 : LANGUE & RÉGION */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                            <FaGlobe className="text-blue-500" /> {t('language')}
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent focus-within:border-blue-500 transition-all">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('select_lang')}</p>
                                <select 
                                    className="w-full bg-transparent outline-none font-bold text-slate-800 dark:text-white cursor-pointer"
                                    value={i18n.language}
                                    onChange={(e) => changeLanguage(e.target.value)}
                                >
                                    <option value="fr" className="dark:text-slate-900">Français</option>
                                    <option value="en" className="dark:text-slate-900">English</option>
                                    <option value="sw" className="dark:text-slate-900">Kiswahili</option>
                                    <option value="lin" className="dark:text-slate-900">Lingala</option>
                                    <option value="nande" className="dark:text-slate-900">Kinande (Beni)</option>
                                    <option value="kon" className="dark:text-slate-900">Kikongo</option>
                                    <option value="lub" className="dark:text-slate-900">Kiluba</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Carte 3 : Sécurité */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-red-100 dark:border-red-900/30 shadow-xl shadow-red-500/5 dark:shadow-none">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                            <FaLock className="text-red-500" /> {t('security')}
                        </h3>
                        
                        {!isChangingPassword ? (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100/50 dark:border-red-900/20">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{t('password')}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t('edit')}</p>
                                </div>
                                <button onClick={() => setIsChangingPassword(true)} className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto">
                                    {t('edit')}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordUpdate} className="space-y-4 animate-in slide-in-from-bottom-2">
                                <input 
                                    type="password" placeholder="Ancien mot de passe"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-red-500 outline-none font-bold text-sm dark:text-white"
                                    value={passwords.oldPassword}
                                    onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                                    required
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input 
                                        type="password" placeholder="Nouveau mot de passe"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-red-500 outline-none font-bold text-sm dark:text-white"
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                        required
                                    />
                                    <input 
                                        type="password" placeholder="Confirmer le nouveau"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-red-500 outline-none font-bold text-sm dark:text-white"
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" disabled={loading} className="flex-1 py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20">
                                        {loading ? "..." : t('save')}
                                    </button>
                                    <button type="button" onClick={() => setIsChangingPassword(false)} className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl">
                                        {t('back')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Carte 4 : Préférences */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                            <FaBell className="text-blue-500" /> {t('preferences')}
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700 text-yellow-400' : 'bg-slate-200 text-slate-600'}`}>
                                        {isDarkMode ? <FaMoon size={18} /> : <FaSun size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{t('dark_mode')}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={toggleDarkMode}
                                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profil;
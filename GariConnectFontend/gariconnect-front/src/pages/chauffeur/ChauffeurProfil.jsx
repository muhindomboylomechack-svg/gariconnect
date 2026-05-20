import React, { useState, useEffect, useRef } from 'react';
import { 
    FaUserCircle, FaIdCard, FaPhone, FaLock, 
    FaEnvelope, FaBuilding, FaSave, FaCheckCircle, FaCamera 
} from 'react-icons/fa';
import api from '../../services/api';

const ChauffeurProfil = () => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);
    
    // États pour la photo
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
        photo: '' // URL venant de la DB
    });

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
                    photo: data.photo || null
                });
            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Gestion de la sélection d'image
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Créer une URL temporaire pour la prévisualisation
        }
    };

    const triggerFileSelect = () => fileInputRef.current.click();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        
        try {
            // Utilisation de FormData pour supporter l'envoi de fichier
            const dataToSend = new FormData();
            dataToSend.append('nom', formData.nom);
            dataToSend.append('prenom', formData.prenom);
            dataToSend.append('email', formData.email);
            dataToSend.append('telephone', formData.telephone);
            dataToSend.append('numero_permis', formData.numero_permis);
            
            if (selectedFile) {
                dataToSend.append('photo', selectedFile);
            }

            await api.put('/users/profile/update', dataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccessMessage(true);
            setTimeout(() => setSuccessMessage(false), 3000);
        } catch (err) {
            alert("Erreur lors de la mise à jour");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Paramètres du Profil</h2>
                {successMessage && (
                    <span className="flex items-center gap-2 text-emerald-500 font-bold text-sm animate-bounce">
                        <FaCheckCircle /> Profil mis à jour
                    </span>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                
                {/* Section Avatar avec changement de photo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
                        {/* Input invisible */}
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
                            
                            {/* Overlay au survol */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <FaCamera className="text-white text-2xl" />
                            </div>
                        </div>

                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-black mt-4 dark:text-white">{formData.prenom} {formData.nom}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <FaBuilding className="text-blue-500 text-xs" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formData.agence_nom}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Nom</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 transition-all shadow-inner">
                            <FaUserCircle className="text-slate-400" />
                            <input name="nom" value={formData.nom} onChange={handleChange} className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Email</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <FaEnvelope className="text-slate-400" />
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Numéro de Permis</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <FaIdCard className="text-slate-400" />
                            <input name="numero_permis" value={formData.numero_permis} onChange={handleChange} className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-4">Téléphone</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <FaPhone className="text-slate-400" />
                            <input name="telephone" value={formData.telephone} onChange={handleChange} className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white" />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={updating}
                    className={`w-full mt-10 flex items-center justify-center gap-3 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-[0.98] ${
                        updating 
                        ? 'bg-slate-400 cursor-not-allowed text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                    }`}
                >
                    {updating ? 'Synchronisation...' : <><FaSave /> Enregistrer les modifications</>}
                </button>
            </form>
        </div>
    );
};

export default ChauffeurProfil;
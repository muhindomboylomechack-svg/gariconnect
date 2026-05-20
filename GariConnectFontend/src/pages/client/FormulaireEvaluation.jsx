import React, { useState } from 'react';
import { Star, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const FormulaireEvaluation = ({ reservationId, onSubmited }) => {
    const { t } = useTranslation();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hover, setHover] = useState({});
    
    const [formData, setFormData] = useState({
        reservationId: reservationId,
        noteGlobale: 0,
        noteConduite: 0,
        noteConfort: 0,
        notePonctualite: 0,
        commentaire: ""
    });

    const handleRating = (category, value) => {
        setFormData({ ...formData, [category]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.noteGlobale === 0) {
            alert(t('eval.error_min_rating'));
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8080/api/evaluations/soumettre', formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSubmitted(true);
            if (onSubmited) onSubmited();
        } catch (error) {
            alert(error.response?.data?.erreur || t('eval.error_submit'));
        } finally {
            setLoading(false);
        }
    };

    const StarRating = ({ category, label }) => (
        <div className="mb-6">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-tight">{label}</p>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => handleRating(category, star)}
                        onMouseEnter={() => setHover({ ...hover, [category]: star })}
                        onMouseLeave={() => setHover({ ...hover, [category]: 0 })}
                        className="transition-transform active:scale-90"
                    >
                        <Star
                            size={32}
                            fill={(hover[category] || formData[category]) >= star ? "#eab308" : "none"}
                            className={(hover[category] || formData[category]) >= star ? "text-yellow-500" : "text-slate-300"}
                        />
                    </button>
                ))}
            </div>
        </div>
    );

    if (submitted) {
        return (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl text-center border border-green-100 dark:border-green-900/30 max-w-md mx-auto">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                        <CheckCircle2 size={48} className="text-green-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{t('eval.thank_you')}</h2>
                <p className="text-slate-500 dark:text-slate-400">{t('eval.success_desc')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-w-xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-yellow-500 rounded-xl shadow-lg shadow-yellow-100">
                        <Star className="text-white" size={20} fill="white" />
                    </div>
                    {t('eval.form_title')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{t('eval.form_subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <StarRating category="noteGlobale" label={t('eval.label_global')} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                    <StarRating category="noteConduite" label={t('eval.label_driving')} />
                    <StarRating category="noteConfort" label={t('eval.label_comfort')} />
                    <StarRating category="notePonctualite" label={t('eval.label_punctuality')} />
                </div>

                <div className="mt-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block uppercase">
                        {t('eval.label_comment')}
                    </label>
                    <div className="relative">
                        <textarea
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-slate-700"
                            placeholder={t('eval.comment_placeholder')}
                            value={formData.commentaire}
                            onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                        />
                        <MessageSquare className="absolute right-4 bottom-4 text-slate-300" size={20} />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full mt-8 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all ${
                        loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
                    }`}
                >
                    {loading ? t('eval.sending') : (
                        <>
                            {t('eval.submit_button')} <Send size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default FormulaireEvaluation;
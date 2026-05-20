import { useEffect, useState } from 'react';

export const useDarkMode = () => {
    // Initialiser l'état avec la valeur stockée ou la préférence système
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Retirer l'ancienne classe et ajouter la nouvelle
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return [theme, toggleTheme];
};
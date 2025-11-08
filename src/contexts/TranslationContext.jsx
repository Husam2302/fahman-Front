import React, { createContext, useContext, useState, useEffect } from 'react';
import arTranslations from '../assets/translations/ar.json';
import enTranslations from '../assets/translations/en.json';

const TranslationContext = createContext();

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within TranslationProvider');
    }
    return context;
};

export const TranslationProvider = ({ children, defaultLanguage = 'ar' }) => {
    const [language, setLanguage] = useState(defaultLanguage);

    const translations = {
        ar: arTranslations,
        en: enTranslations,
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            value = value?.[k];
        }

        return value || key;
    };

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    useEffect(() => {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
            setLanguage(savedLanguage);
        }
    }, []);

    return (
        <TranslationContext.Provider value={{ t, language, changeLanguage }}>
            {children}
        </TranslationContext.Provider>
    );
};





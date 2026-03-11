import React, { createContext, useContext, useState } from "react";
import en from "./i18n/en.json";
import hi from "./i18n/hi.json";

const translations = { en, hi };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(
        localStorage.getItem("lang") || "en"
    );

    const toggleLanguage = () => {
        const newLang = language === "en" ? "hi" : "en";
        setLanguage(newLang);
        localStorage.setItem("lang", newLang);
    };

    const t = (key) => {
        return translations[language]?.[key] || translations["en"]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

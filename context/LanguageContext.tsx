"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "si" | "ta";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Citizen Dashboard",
    ai_insights: "AI Insights",
    alerts: "Active Alerts",
    sos: "SOS",
    safe_routes: "Safe Routes",
    situation_map: "Situation Map",
    updates: "Official Updates",
    quick_actions: "Quick Actions",
    report_incident: "Report Incident",
    finding_safe_route: "Finding Safe Route",
    network_status: "Network Status",
    live: "Live",
    offline_resources: "Offline Resources",
    download_briefing: "Download Briefing",
    hydro_analysis: "Hydro-Analysis",
    seismic_monitor: "Seismic Monitor",
    dispatch: "Dispatch",
    verify: "Verify",
    log_request: "Log Request",
    confidential: "CONFIDENTIAL",
    executive_summary: "EXECUTIVE SUMMARY",
    recommended_actions: "RECOMMENDED ACTIONS",
    back_to_dashboard: "Back to Dashboard",
    generate_report: "Generate Full Report"
  },
  si: {
    dashboard: "පුරවැසි උපකරණ පුවරුව",
    ai_insights: "කෘතිම බුද්ධි තොරතුරු",
    alerts: "සක්‍රීය අනතුරු ඇඟවීම්",
    sos: "හදිසි සහය",
    safe_routes: "ආරක්ෂිත මාර්ග",
    situation_map: "තත්ව සිතියම",
    updates: "නිල යාවත්කාලීන කිරීම්",
    quick_actions: "කඩිනම් ක්‍රියාමාර්ග",
    report_incident: "සිදුවීමක් වාර්තා කරන්න",
    finding_safe_route: "ආරක්ෂිත මාර්ගය සෙවීම",
    network_status: "ජාල තත්ත්වය",
    live: "සජීවී",
    offline_resources: "නොබැඳි සම්පත්",
    download_briefing: "සාරාංශය බාගත කරන්න",
    hydro_analysis: "ජල විද්‍යාත්මක විශ්ලේෂණය",
    seismic_monitor: "භූ කම්පන නිරීක්ෂණය",
    dispatch: "යැවීම",
    verify: "තහවුරු කරන්න",
    log_request: "සටහන් කරන්න",
    confidential: "රහස්‍ය",
    executive_summary: "විධායක සාරාංශය",
    recommended_actions: "නිර්දේශිත ක්‍රියාමාර්ග",
    back_to_dashboard: "නැවත පුවරුවට",
    generate_report: "සම්පූර්ණ වාර්තාව"
  },
  ta: {
    dashboard: "குடிமக்கள் டாஷ்போர்டு",
    ai_insights: "AI நுண்ணறிவு",
    alerts: "செயலில் உள்ள எச்சரிக்கைகள்",
    sos: "அவசரகால உதவி",
    safe_routes: "பாதுகாப்பான பாதைகள்",
    situation_map: "நிலைமை வரைபடம்",
    updates: "அதிகாரப்பூர்வ அறிவிப்புகள்",
    quick_actions: "விரைவான நடவடிக்கைகள்",
    report_incident: "சம்பவத்தைப் புகாரளிக்கவும்",
    finding_safe_route: "பாதுகாப்பான பாதையைக் கண்டறிதல்",
    network_status: "பிணைய நிலை",
    live: "நேரடி",
    offline_resources: "ஆஃப்லைன் ஆதாரங்கள்",
    download_briefing: "சுருக்கத்தைப் பதிவிறக்கவும்",
    hydro_analysis: "நீரியல் பகுப்பாய்வு",
    seismic_monitor: "நில அதிர்வு கண்காணிப்பு",
    dispatch: "அனுப்பு",
    verify: "சரிபார்",
    log_request: "பதிவு செய்க",
    confidential: "ரகசியமானது",
    executive_summary: "நிர்வாகச் சுருக்கம்",
    recommended_actions: "பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்",
    back_to_dashboard: "டாஷ்போர்டுக்குத் திரும்பு",
    generate_report: "முழு அறிக்கையை உருவாக்கு"
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  // Load language from localStorage if available
  useEffect(() => {
    const savedLang = localStorage.getItem("outbreak_lang") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "si" || savedLang === "ta")) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("outbreak_lang", lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

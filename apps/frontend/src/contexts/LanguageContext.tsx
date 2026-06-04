'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'EN' | 'HI';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Core Translations Dictionary
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  EN: {
    // Navbar
    'nav.home': 'Home',
    'nav.about': 'About Us',
    'nav.services': 'Services',
    'nav.howWeWork': 'How We Work',
    'nav.contact': 'Contact',
    'nav.registerAdvisor': 'Register as Advisor',
    'nav.signIn': 'Sign In',
    'nav.bookConsultation': 'Book Consultation',
    'nav.trustedPlatform': 'Trusted Advisory Platform',
    'nav.discoverCatalog': 'Discover Catalog',
    'nav.myConsultations': 'My Consultations',
    'nav.advisorWorkspace': 'Advisor Workspace',
    'nav.adminSuite': 'Admin Suite',

    // Hero Section
    'hero.badge': 'Trusted by 10,000+ Indians for Legal & Property Consultation',
    'hero.title': 'Secure Professional Consultations via',
    'hero.titleGold': 'Escrow Protection',
    'hero.subtitle': 'Connect with RERA-verified brokers, high-experience legal advisors, wealth managers, and documentation experts. Safe, secure, and fully verified.',
    'hero.searchPlaceholder': 'Search legal advisors, RERA brokers, tax consultants...',
    'hero.popular': 'Popular:',
    'hero.tax': 'Tax',
    'hero.corporate': 'Corporate',
    'hero.rera': 'RERA',
    'hero.court': 'Court',

    // Services Catalog
    'services.title': 'Verified Advisory Services',
    'services.subtitle': 'Explore our catalog of highly-vetted advisors across core domains. Book instant audio/video appointments.',
    
    // Stats Section
    'stats.advisors': 'Verified Advisors',
    'stats.consultations': 'Consultations Done',
    'stats.rating': 'Success Rating',
    'stats.escrow': 'Escrow Protection',

    // How it works
    'how.title': 'How BrokerSaab Works',
    'how.subtitle': 'Book with confidence knowing your money is held in escrow until your consultation is completed successfully.',
    'how.step1.title': '1. Choose an Expert',
    'how.step1.desc': 'Browse RERA-verified brokers, BAR-registered lawyers, and certified advisors.',
    'how.step2.title': '2. Reserve Slot via Escrow',
    'how.step2.desc': 'Pay securely. The money is held safely in escrow and is not released immediately.',
    'how.step3.title': '3. Connect & Release',
    'how.step3.desc': 'Have your consultation via video/audio. Once satisfied, release funds to the advisor.',

    // Footer
    'footer.description': "India's trusted marketplace connecting users with verified legal advisors, property brokers, financial consultants, and documentation experts.",
    'footer.rights': 'All Rights Reserved.',
    'footer.securityDesc': 'All transactions are protected by bank-grade escrow technology. Advisors are verified manually.',
    'footer.quickLinks': 'Quick Links',
    'footer.services': 'Our Services',
    'footer.legal': 'Legal'
  },
  HI: {
    // Navbar
    'nav.home': 'होम',
    'nav.about': 'हमारे बारे में',
    'nav.services': 'सेवाएं',
    'nav.howWeWork': 'काम कैसे करता है',
    'nav.contact': 'संपर्क करें',
    'nav.registerAdvisor': 'सलाहकार के रूप में पंजीकरण करें',
    'nav.signIn': 'लॉग इन करें',
    'nav.bookConsultation': 'परामर्श बुक करें',
    'nav.trustedPlatform': 'विश्वसनीय सलाहकार मंच',
    'nav.discoverCatalog': 'कैटलॉग खोजें',
    'nav.myConsultations': 'मेरे परामर्श',
    'nav.advisorWorkspace': 'सलाहकार कार्यक्षेत्र',
    'nav.adminSuite': 'एडमिन सूट',

    // Hero Section
    'hero.badge': 'कानूनी और संपत्ति परामर्श के लिए 10,000+ भारतीयों द्वारा विश्वसनीय',
    'hero.title': 'सुरक्षित पेशेवर परामर्श प्राप्त करें',
    'hero.titleGold': 'एस्क्रो सुरक्षा के साथ',
    'hero.subtitle': 'RERA-सत्यापित दलालों, अनुभवी कानूनी सलाहकारों, धन प्रबंधकों और दस्तावेज़ीकरण विशेषज्ञों से जुड़ें। सुरक्षित और पूरी तरह से सत्यापित।',
    'hero.searchPlaceholder': 'कानूनी सलाहकार, RERA दलाल, कर सलाहकार खोजें...',
    'hero.popular': 'लोकप्रिय:',
    'hero.tax': 'टैक्स',
    'hero.corporate': 'कॉर्पोरेट',
    'hero.rera': 'RERA',
    'hero.court': 'कोर्ट',

    // Services Catalog
    'services.title': 'सत्यापित सलाहकार सेवाएं',
    'services.subtitle': 'मुख्य क्षेत्रों में हमारे अत्यधिक सत्यापित सलाहकारों के कैटलॉग का अन्वेषण करें। तुरंत ऑडियो/वीडियो अपॉइंटमेंट बुक करें।',

    // Stats Section
    'stats.advisors': 'सत्यापित सलाहकार',
    'stats.consultations': 'परामर्श संपन्न',
    'stats.rating': 'सफलता दर',
    'stats.escrow': 'एस्क्रो सुरक्षा',

    // How it works
    'how.title': 'ब्रोकरसाब कैसे काम करता है',
    'how.subtitle': 'विश्वास के साथ बुक करें यह जानते हुए कि आपका पैसा परामर्श सफलतापूर्वक पूरा होने तक सुरक्षित एस्क्रो में रखा जाता है।',
    'how.step1.title': '1. एक विशेषज्ञ चुनें',
    'how.step1.desc': 'RERA-सत्यापित दलालों, बार-पंजीकृत वकीलों और प्रमाणित सलाहकारों को खोजें।',
    'how.step2.title': '2. एस्क्रो के माध्यम से स्लॉट आरक्षित करें',
    'how.step2.desc': 'सुरक्षित रूप से भुगतान करें। पैसा सुरक्षित रूप से एस्क्रो में रखा जाता है और तुरंत जारी नहीं किया जाता है।',
    'how.step3.title': '3. जुड़ें और जारी करें',
    'how.step3.desc': 'वीडियो/ऑडियो के माध्यम से अपना परामर्श लें। संतुष्ट होने पर, सलाहकार को धनराशि जारी करें।',

    // Footer
    'footer.description': "भारत का विश्वसनीय बाज़ार जो उपयोगकर्ताओं को सत्यापित कानूनी सलाहकारों, संपत्ति दलालों, वित्तीय सलाहकारों और दस्तावेज़ीकरण विशेषज्ञों से जोड़ता है।",
    'footer.rights': 'सर्वाधिकार सुरक्षित।',
    'footer.securityDesc': 'सभी लेनदेन बैंक-ग्रेड एस्क्रो तकनीक द्वारा सुरक्षित हैं। सलाहकारों का सत्यापन मैन्युअल रूप से किया जाता है।',
    'footer.quickLinks': 'त्वरित लिंक',
    'footer.services': 'हमारी सेवाएं',
    'footer.legal': 'कानूनी'
  }
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('EN');

  // Load language preference from local storage if available
  useEffect(() => {
    const savedLanguage = localStorage.getItem('brokersaab_language') as Language;
    if (savedLanguage && (savedLanguage === 'EN' || savedLanguage === 'HI')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('brokersaab_language', lang);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

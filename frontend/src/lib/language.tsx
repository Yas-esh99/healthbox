import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type LanguageCode = "en" | "hi" | "gu" | "mr";

export const LANGUAGES: { code: LanguageCode; native: string; english: string }[] = [
  { code: "en", native: "English", english: "English" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "gu", native: "ગુજરાતી", english: "Gujarati" },
  { code: "mr", native: "मराठी", english: "Marathi" },
];

type Ctx = {
  language: LanguageCode | null;
  setLanguage: (code: LanguageCode) => void;
};

const LanguageContext = createContext<Ctx | undefined>(undefined);
const STORAGE_KEY = "app.language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved) setLanguageState(saved);
    } catch {}
  }, []);

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export const TRANSLATIONS = {
  en: {
    // Navigation
    home: "Home",
    schemes: "Schemes",
    camps: "Camps",
    chat: "Chat",
    sos: "Emergency SOS",
    back: "Back",
    next: "Next",
    finish: "Finish Setup",
    skip: "Skip",
    loading: "Loading...",

    // Login / OTP
    login_title: "Enter your mobile number",
    login_subtitle: "We will send you a 6-digit OTP",
    login_label: "Mobile number",
    get_otp: "Get OTP",
    enter_otp: "Enter OTP",
    sent_to: "Sent to",

    // Register
    register_title: "Create Account",
    name_label: "Full Name",
    state_label: "State",
    district_label: "District",
    age_label: "Age",
    gender_label: "Gender",
    ayushman_label: "Do you have Ayushman PM-JAY Card?",
    ayushman_card_number: "Ayushman Card Number",
    conditions_label: "Chronic Conditions",
    step_details: "Your Details",
    step_about: "About You",
    step_health: "Health Setup",
    step_text: "Step",
    of_text: "of",
    placeholder_name: "e.g. Ramesh Kumar",
    placeholder_state: "Choose your state",
    placeholder_district: "Choose district",
    placeholder_state_first: "Select state first",
    years_text: "years",
    gender_male: "Male",
    gender_female: "Female",
    gender_other: "Other",
    ayushman_sub: "Do you have a card?",
    scan_later: "Scan Card Later",
    condition_diabetes: "Diabetes",
    condition_bp: "Blood Pressure",
    condition_none: "None",
    terms_text: "By continuing you agree to our Terms & Privacy Policy",

    // Home
    namaste: "Namaste",
    welcome: "Welcome",
    help_today: "How can we help you today?",
    ai_triage: "AI Triage",
    check_symptoms: "Check Symptoms",
    speak_or_scan: "Speak or scan to get help",
    find_hospital: "Find Hospital",
    pharmacies_tile: "Pharmacies",
    govt_schemes: "Govt Schemes",
    my_records: "My Records",

    // Hospitals
    find_hospital_title: "Find a Hospital",
    hospital_subtitle: "Top empanelled health facilities and government centers",
    beds_available: "Beds Available",
    emergency: "Emergency",
    directions: "Directions",
    call_now: "Call Now",

    // Pharmacies
    find_pharmacy_title: "Find a Pharmacy",
    pharmacy_subtitle: "Verified stores with direct contact and medicine availability checks",
    medicines_prices: "Available Medicines & Prices",

    // Schemes
    govt_schemes_title: "Government Schemes",
    schemes_subtitle: "Upload your Ayushman card to view eligible welfare programs",
    upload_ayushman: "Upload Ayushman Card",
    choose_document: "Choose Document",
    matched_schemes: "Matched Schemes",
    required_docs: "Required Documents",
    scheme_benefits: "Scheme Benefits",
    treated_categories: "Treated Categories",
    coverage_limit: "Coverage Limit",
    apply_now: "Apply Now",
  },
  hi: {
    // Navigation
    home: "मुख्य पृष्ठ",
    schemes: "योजनाएं",
    camps: "शिविर",
    chat: "चैट",
    sos: "आपातकालीन SOS",
    back: "पीछे",
    next: "आगे",
    finish: "सेटिंग्स पूरी करें",
    skip: "छोड़ें",
    loading: "लोड हो रहा है...",

    // Login / OTP
    login_title: "अपना मोबाइल नंबर दर्ज करें",
    login_subtitle: "हम आपको 6 अंकों का ओटीपी भेजेंगे",
    login_label: "मोबाइल नंबर",
    get_otp: "ओटीपी प्राप्त करें",
    enter_otp: "ओटीपी दर्ज करें",
    sent_to: "भेजा गया",

    // Register
    register_title: "खाता बनाएं",
    name_label: "पूरा नाम",
    state_label: "राज्य",
    district_label: "जिला",
    age_label: "उम्र",
    gender_label: "लिंग",
    ayushman_label: "क्या आपके पास आयुष्मान पीएम-जय कार्ड है?",
    ayushman_card_number: "आयुष्मान कार्ड नंबर",
    conditions_label: "पुरानी बीमारियां",
    step_details: "आपका विवरण",
    step_about: "आपके बारे में",
    step_health: "स्वास्थ्य सेटअप",
    step_text: "चरण",
    of_text: "का",
    placeholder_name: "जैसे: रमेश कुमार",
    placeholder_state: "अपना राज्य चुनें",
    placeholder_district: "जिला चुनें",
    placeholder_state_first: "पहले राज्य चुनें",
    years_text: "वर्ष",
    gender_male: "पुरुष",
    gender_female: "महिला",
    gender_other: "अन्य",
    ayushman_sub: "क्या आपके पास कार्ड है?",
    scan_later: "कार्ड बाद में स्कैन करें",
    condition_diabetes: "मधुमेह (डायबिटीज)",
    condition_bp: "रक्तचाप (बीपी)",
    condition_none: "कोई नहीं",
    terms_text: "आगे बढ़कर आप हमारी शर्तों और गोपनीयता नीति से सहमत होते हैं",

    // Home
    namaste: "नमस्ते",
    welcome: "स्वागत है",
    help_today: "आज हम आपकी क्या मदद कर सकते हैं?",
    ai_triage: "एआई जांच",
    check_symptoms: "लक्षणों की जांच",
    speak_or_scan: "सहायता के लिए बोलें या स्कैन करें",
    find_hospital: "अस्पताल खोजें",
    pharmacies_tile: "दवा की दुकानें",
    govt_schemes: "सरकारी योजनाएं",
    my_records: "मेरे रिकॉर्ड",

    // Hospitals
    find_hospital_title: "अस्पताल ढूंढें",
    hospital_subtitle: "शीर्ष सूचीबद्ध स्वास्थ्य सुविधाएं और सरकारी केंद्र",
    beds_available: "उपलब्ध बेड",
    emergency: "आपातकालीन",
    directions: "मार्गदर्शन",
    call_now: "अभी कॉल करें",

    // Pharmacies
    find_pharmacy_title: "दवा की दुकान ढूंढें",
    pharmacy_subtitle: "सत्यापित स्टोर और दवाओं की उपलब्धता की जांच",
    medicines_prices: "उपलब्ध दवाएं और कीमतें",

    // Schemes
    govt_schemes_title: "सरकारी योजनाएं",
    schemes_subtitle: "पात्र कल्याणकारी कार्यक्रमों को देखने के लिए आयुष्मान कार्ड अपलोड करें",
    upload_ayushman: "आयुष्मान कार्ड अपलोड करें",
    choose_document: "दस्तावेज़ चुनें",
    matched_schemes: "योग्य योजनाएं",
    required_docs: "आवश्यक दस्तावेज़",
    scheme_benefits: "योजना के लाभ",
    treated_categories: "उपचार की श्रेणियां",
    coverage_limit: "कवरेज सीमा",
    apply_now: "अभी आवेदन करें",
  },
  gu: {
    // Navigation
    home: "મુખ્ય પૃષ્ઠ",
    schemes: "યોજનાઓ",
    camps: "કેમ્પ",
    chat: "ચેટ",
    sos: "ઇમરજન્સી SOS",
    back: "પાછા",
    next: "આગળ",
    finish: "સેટઅપ પૂર્ણ કરો",
    skip: "રદ કરો",
    loading: "લોડ થઈ રહ્યું છે...",

    // Login / OTP
    login_title: "તમારો મોબાઈલ નંબર દાખલ કરો",
    login_subtitle: "અમે તમને 6-આંકડાનો OTP મોકલીશું",
    login_label: "મોબાઈલ નંબર",
    get_otp: "OTP મેળવો",
    enter_otp: "OTP દાખલ કરો",
    sent_to: "મોકલેલ છે",

    // Register
    register_title: "ખાતું બનાવો",
    name_label: "પૂરું નામ",
    state_label: "રાજ્ય",
    district_label: "જિલ્લો",
    age_label: "ઉંમર",
    gender_label: "જાતિ",
    ayushman_label: "શું તમારી પાસે આયુષ્માન PM-JAY કાર્ડ છે?",
    ayushman_card_number: "આયુષ્માન કાર્ડ નંબર",
    conditions_label: "લાંબા ગાળાની બીમારીઓ",
    step_details: "તમારી વિગત",
    step_about: "તમારા વિશે",
    step_health: "આરોગ્ય સેટઅપ",
    step_text: "પગલું",
    of_text: "માંથી",
    placeholder_name: "દા.ત. રમેશ કુમાર",
    placeholder_state: "તમારું રાજ્ય પસંદ કરો",
    placeholder_district: "જિલ્લો પસંદ કરો",
    placeholder_state_first: "પહેલા રાજ્ય પસંદ કરો",
    years_text: "વર્ષ",
    gender_male: "પુરુષ",
    gender_female: "મહિલા",
    gender_other: "અન્ય",
    ayushman_sub: "શું તમારી પાસે કાર્ડ છે?",
    scan_later: "કાર્ડ પછીથી સ્કેન કરો",
    condition_diabetes: "મધુપ્રમેહ (ડાયાબિટીસ)",
    condition_bp: "બ્લડ પ્રેશર",
    condition_none: "કોઈ નહીં",
    terms_text: "ચાલુ રાખીને તમે અમારી શરતો અને ગોપનીયતા નીતિ સાથે સંમત થાઓ છો",

    // Home
    namaste: "નમસ્તે",
    welcome: "સ્વાગત છે",
    help_today: "આજે અમે તમને કેવી રીતે મદદ કરી શકીએ?",
    ai_triage: "AI તપાસ",
    check_symptoms: "લક્ષણો તપાસો",
    speak_or_scan: "મદદ માટે બોલો અથવા સ્કેન કરો",
    find_hospital: "હોસ્પિટલ શોધો",
    pharmacies_tile: "મેડિકલ સ્ટોર",
    govt_schemes: "સરકારી યોજનાઓ",
    my_records: "મારા રેકોર્ડ",

    // Hospitals
    find_hospital_title: "હોસ્પિટલ શોધો",
    hospital_subtitle: "ટોચની હોસ્પિટલો અને સરકારી આરોગ્ય કેન્દ્રો",
    beds_available: "બેડ ઉપલબ્ધ",
    emergency: "ઇમરજન્સી",
    directions: "દિશા-નિર્દેશ",
    call_now: "હમણાં કોલ કરો",

    // Pharmacies
    find_pharmacy_title: "મેડિકલ સ્ટોર શોધો",
    pharmacy_subtitle: "વેરિફાઇડ સ્ટોર અને ઉપલબ્ધ દવાઓની વિગત",
    medicines_prices: "ઉપલબ્ધ દવાઓ અને કિંમતો",

    // Schemes
    govt_schemes_title: "સરકારી યોજનાઓ",
    schemes_subtitle: "લાયક કલ્યાણકારી યોજનાઓ જોવા માટે આયુષ્માન કાર્ડ અપલોડ કરો",
    upload_ayushman: "આયુષ્માન કાર્ડ અપલોડ કરો",
    choose_document: "દસ્તાવેજ પસંદ કરો",
    matched_schemes: "લાયક યોજનાઓ",
    required_docs: "જરૂરી દસ્તાવેજો",
    scheme_benefits: "યોજનાના લાભો",
    treated_categories: "સારવારની શ્રેણીઓ",
    coverage_limit: "કવરેજ મર્યાદા",
    apply_now: "હમણાં અરજી કરો",
  },
  mr: {
    // Navigation
    home: "मुख्य पृष्ठ",
    schemes: "योजना",
    camps: "शिबिर",
    chat: "चॅट",
    sos: "आपातकालीन SOS",
    back: "मागे",
    next: "पुढे",
    finish: "सेटअप पूर्ण करा",
    skip: "वगळा",
    loading: "लोड होत आहे...",

    // Login / OTP
    login_title: "तुमचा मोबाईल नंबर टाका",
    login_subtitle: "आम्ही तुम्हाला 6-अंकी ओटीपी पाठवू",
    login_label: "मोबाईल नंबर",
    get_otp: "ओटीपी मिळवा",
    enter_otp: "ओटीपी टाका",
    sent_to: "वर पाठवला",

    // Register
    register_title: "खाते तयार करा",
    name_label: "पूर्ण नाव",
    state_label: "राज्य",
    district_label: "जिल्हा",
    age_label: "वय",
    gender_label: "लिंग",
    ayushman_label: "तुमच्याकडे आयुष्मान पीएम-जय कार्ड आहे का?",
    ayushman_card_number: "आयुष्मान कार्ड नंबर",
    conditions_label: "तीव्र आजार",

    // Home
    namaste: "नमस्ते",
    welcome: "स्वागत आहे",
    help_today: "आज आम्ही तुम्हाला कशी मदत करू शकतो?",
    ai_triage: "एआय तपासणी",
    check_symptoms: "लक्षणे तपासा",
    speak_or_scan: "मदत मिळवण्यासाठी बोला किंवा स्कॅन करा",
    find_hospital: "रुग्णालय शोधा",
    pharmacies_tile: "औषध विक्रेते",
    govt_schemes: "सरकारी योजना",
    my_records: "माझे रेकॉर्ड",

    // Hospitals
    find_hospital_title: "रुग्णालय शोधा",
    hospital_subtitle: "शीर्ष सूचीबद्ध आरोग्य सुविधा आणि सरकारी केंद्रे",
    beds_available: "उपलब्ध खाटा",
    emergency: "आपातकालीन",
    directions: "दिशा-निर्देश",
    call_now: "आता कॉल करा",

    // Pharmacies
    find_pharmacy_title: "औषध दुकान शोधा",
    pharmacy_subtitle: "सत्यापित दुकाने आणि औषधांच्या उपलब्धतेची तपासणी",
    medicines_prices: "उपलब्ध औषधे आणि किमती",

    // Schemes
    govt_schemes_title: "सरकारी योजना",
    schemes_subtitle: "पात्र कल्याणकारी योजना पाहण्यासाठी आयुष्मान कार्ड अपलोड करा",
    upload_ayushman: "आयुष्मान कार्ड अपलोड करा",
    choose_document: "दस्तऐवज निवडा",
    matched_schemes: "पात्र योजना",
    required_docs: "आवश्यक कागदपत्रे",
    scheme_benefits: "योजनेचे फायदे",
    treated_categories: "उपचार श्रेणी",
    coverage_limit: "कवरेज मर्यादा",
    apply_now: "आता अर्ज करा",
  },
} as const;

export type TranslationKey = keyof (typeof TRANSLATIONS)["en"];

export function useTranslation() {
  const { language } = useLanguage();
  const t = (key: TranslationKey): string => {
    const lang = language || "en";
    const dict = (TRANSLATIONS[lang] || TRANSLATIONS["en"]) as Record<TranslationKey, string>;
    return dict[key] || TRANSLATIONS["en"][key] || key;
  };
  return { t, currentLanguage: language || "en" };
}

import React, { useState } from "react";
import { 
  AlertTriangle, 
  MapPin, 
  Sparkles, 
  BarChart2, 
  Database, 
  Shield, 
  ArrowRight, 
  User, 
  Mail, 
  CheckCircle,
  Leaf,
  Lock,
  UserPlus,
  LogIn
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import PrivacyPolicy from "./PrivacyPolicy";

interface LoginPageProps {
  onLogin: (user: { name: string; email: string; role: "citizen" | "operator" | "admin" }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivacyAccepted, setIsPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Si prega di compilare il campo email.");
      return;
    }
    if (!password) {
      setErrorMsg("Si prega di inserire la password.");
      return;
    }
    if (activeTab === "register" && !name) {
      setErrorMsg("Si prega di inserire il proprio Nome.");
      return;
    }
    if (!isPrivacyAccepted) {
      setErrorMsg("È necessario accettare l'Informativa sulla Privacy per poter utilizzare l'applicazione.");
      return;
    }

    setIsSubmitting(true);
    const cleanedEmail = email.trim().toLowerCase();

    try {
      const userDocRef = doc(db, "registered_users", cleanedEmail);

      if (activeTab === "register") {
        // --- REGISTRAZIONE ---
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setErrorMsg("Questo indirizzo email è già registrato. Accedi invece.");
          setIsSubmitting(false);
          return;
        }

        const finalRole = cleanedEmail === "nacreatorita@gmail.com" ? "admin" : "operator";

        await setDoc(userDocRef, {
          name: name.trim(),
          email: cleanedEmail,
          password: password,
          role: finalRole,
          createdAt: new Date().toISOString()
        });

        setSuccessMsg("Registrazione completata con successo! Ora puoi effettuare l'accesso.");
        setActiveTab("login");
        setName("");
      } else {
        // --- ACCESSO ---
        const userDocSnap = await getDoc(userDocRef);

        // Special Admin Auto-Registration if nacreatorita@gmail.com logs in for the first time
        if (!userDocSnap.exists() && cleanedEmail === "nacreatorita@gmail.com") {
          await setDoc(userDocRef, {
            name: "Amministratore",
            email: cleanedEmail,
            password: password,
            role: "admin",
            createdAt: new Date().toISOString()
          });

          onLogin({
            name: "Amministratore",
            email: cleanedEmail,
            role: "admin"
          });
          setIsSubmitting(false);
          return;
        }

        if (!userDocSnap.exists()) {
          setErrorMsg("Utente non registrato nel database. Seleziona la scheda 'Registrati' per creare un account.");
          setIsSubmitting(false);
          return;
        }

        const userData = userDocSnap.data();
        if (userData?.password !== password) {
          setErrorMsg("La password inserita non è corretta. Riprova.");
          setIsSubmitting(false);
          return;
        }

        const finalRole = cleanedEmail === "nacreatorita@gmail.com" ? "admin" : (userData?.role || "operator");

        onLogin({
          name: userData?.name || "Operatore Rifiuti",
          email: cleanedEmail,
          role: finalRole
        });
      }
    } catch (err: any) {
      console.error("Firestore Auth error:", err);
      setErrorMsg("Errore di connessione al database Firestore. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4 md:p-8 select-none font-sans">
      <div className="max-w-5xl w-full bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* LEFT COLUMN: BRANDING & BENEFIT CARDS */}
        <div className="lg:col-span-7 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 md:p-12 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Leaf className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  EcoTracker <span className="text-emerald-300 font-medium">City Care</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  Sistema Gestionale Rifiuti v2.2
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Gestione professionale, un report alla volta.
              </h2>
              <p className="text-xs text-emerald-100 max-w-md leading-relaxed">
                Piattaforma avanzata per la segnalazione dei rifiuti abbandonati, classificazione automatica assistita da Gemini e monitoraggio in tempo reale dei ripristini sul territorio comunali.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-300">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Geolocalizzazione</h4>
                  <p className="text-[10px] text-emerald-200/90 mt-0.5">
                    Mappatura geografica esatta delle discariche abusive in tempo reale.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Riconoscimento IA</h4>
                  <p className="text-[10px] text-emerald-200/90 mt-0.5">
                    Analisi della foto, classificazione codice EER e indice di gravità.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-300">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Database Sicuro</h4>
                  <p className="text-[10px] text-emerald-200/90 mt-0.5">
                    Registrazione protetta su Firestore Cloud con credenziali verificate.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-300">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Interfaccia Statistiche</h4>
                  <p className="text-[10px] text-emerald-200/90 mt-0.5">
                    Grafici, conteggi interattivi e pulsanti per la gestione degli archivi.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Institutional note */}
          <div className="relative z-10 flex items-center gap-2 border-t border-white/15 pt-4 text-[10px] text-emerald-200/80">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistema riservato ed ottimizzato per operatori ecologici ed amministratori.</span>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN / REGISTER FORM */}
        <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header Text */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                {activeTab === "login" ? "Autenticazione Richiesta" : "Area Registrazione"}
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight pt-2">
                {activeTab === "login" ? "Accedi al portale" : "Crea un nuovo account"}
              </h3>
              <p className="text-xs text-slate-500">
                {activeTab === "login" 
                  ? "È necessario accedere con le tue credenziali verificate." 
                  : "Registra un account operatore per accedere alla gestione rifiuti."}
              </p>
            </div>

            {/* Accedi / Registrati Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === "login"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Accedi
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === "register"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Registrati
              </button>
            </div>

            {/* Error / Success Alerts */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-start gap-2.5 shadow-sm animate-fade-in animate-duration-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl flex items-start gap-2.5 shadow-sm animate-fade-in animate-duration-200">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Field (Only for Register) */}
              {activeTab === "register" && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nome e Cognome
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="E.g. Mario Rossi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Indirizzo Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mario.rossi@comune.it"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Privacy/GDPR Checkbox */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivacyAccepted}
                    onChange={(e) => setIsPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4"
                  />
                  <span className="text-[10px] text-slate-500 leading-normal">
                    Accetto l'Informativa sulla Privacy (GDPR) e acconsento al trattamento sicuro delle credenziali e dei report ambientali inseriti.
                  </span>
                </label>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-[9px] font-bold text-emerald-600 hover:underline hover:text-emerald-700"
                  >
                    Leggi l'Informativa Completa
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                  isSubmitting 
                    ? "bg-emerald-600/50 text-white cursor-wait" 
                    : !isPrivacyAccepted
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-600/15"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connessione in corso...
                  </>
                ) : (
                  <>
                    {activeTab === "login" ? "Accedi al Sistema" : "Completa la Registrazione"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-[9px] text-slate-400">
                EcoTracker City Care è conforme alle linee guida AGID per i servizi digitali comunali.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <PrivacyPolicy onClose={() => setShowPrivacyModal(false)} />
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import MapComponent from "./components/MapComponent";
import WasteForm from "./components/WasteForm";
import WasteList from "./components/WasteList";
import WasteStats from "./components/WasteStats";
import LoginPage from "./components/LoginPage";
import { WasteReport, StatusType } from "./types";
import { AlertTriangle, Trash2, MapPin, PlusCircle, CheckCircle, Info, Sparkles, Database, FileText, User, BarChart2 } from "lucide-react";
import { subscribeToReports, saveReportToFirestore, deleteReportFromFirestore } from "./lib/firebase";

// Seeding standard mock reports if localStorage is empty
const INITIAL_REPORTS: WasteReport[] = [
  {
    id: "rep-1",
    lat: 41.8902,
    lng: 12.4922,
    locationName: "Roma, nei pressi del Colosseo",
    eerCode: "20 03 07",
    wasteType: "Rifiuti ingombranti (Materassi e divani)",
    isDangerous: false,
    description: "Tre materassi matrimoniali e un divano a due posti abbandonati sul marciapiede, ostruiscono parzialmente il passaggio pedonale.",
    severity: "high",
    status: "reported",
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(), // 36h ago
    notes: "Segnalato da passanti",
    cleanupRecommendation: "Rimozione tramite mezzo compattatore standard per ingombranti.",
    reporterName: "Marco Rossi"
  },
  {
    id: "rep-2",
    lat: 45.4642,
    lng: 9.1900,
    locationName: "Milano, nei pressi di Piazza Duomo",
    eerCode: "20 01 23*",
    wasteType: "Apparecchiature contenenti CFC (Frigorifero)",
    isDangerous: true,
    description: "Frigorifero industriale abbandonato in un vicolo di servizio. C'è il rischio di sversamento di gas refrigeranti fluorurati.",
    severity: "critical",
    status: "in_progress",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), // 12h ago
    notes: "Potenziale perdita di refrigerante",
    cleanupRecommendation: "Manipolare con cautela per prevenire rotture del circuito refrigerante. Richiede recupero specializzato RAEE.",
    reporterName: "Ispettore Bianchi"
  },
  {
    id: "rep-3",
    lat: 40.8518,
    lng: 14.2681,
    locationName: "Napoli, nei pressi della Stazione Centrale",
    eerCode: "20 02 01",
    wasteType: "Rifiuti biodegradabili (Sfalci e potature)",
    isDangerous: false,
    description: "Cumulo di rami, foglie e residui di potatura di alberi depositati abusivamente a lato strada.",
    severity: "low",
    status: "cleaned",
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(), // 3 days ago
    notes: "Raccolta verde completata",
    cleanupRecommendation: "Rimozione tramite trituratore o camion con cassone.",
    reporterName: "Elena Verdi"
  }
];

export default function App() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReport, setEditingReport] = useState<WasteReport | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: "citizen" | "operator" | "admin" } | null>(null);

  // Tabs state: "form" for adding, "list" for displaying, "stats" for analytics
  const [activeTab, setActiveTab] = useState<"form" | "list" | "stats">("form");

  // Load from Firestore in real-time
  useEffect(() => {
    const unsubscribe = subscribeToReports((firebaseReports) => {
      setReports(firebaseReports);
      
      // Auto-cleanup initial/demo reports if they are detected, as requested by the user
      const demoIds = ["rep-1", "rep-2", "rep-3"];
      const detectedDemoReports = firebaseReports.filter(r => demoIds.includes(r.id));
      if (detectedDemoReports.length > 0) {
        detectedDemoReports.forEach(r => {
          deleteReportFromFirestore(r.id).catch(err => console.error("Error clearing demo report:", err));
        });
      }
    });

    // Load active login session
    const storedUser = localStorage.getItem("eco_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }

    return () => unsubscribe();
  }, []);

  // Submit handler (creates new or updates existing in Firestore)
  const handleFormSubmit = async (formData: Omit<WasteReport, "id" | "createdAt" | "status">) => {
    setIsSubmitting(true);

    try {
      if (editingReport) {
        const updatedReport: WasteReport = {
          ...editingReport,
          ...formData
        };
        await saveReportToFirestore(updatedReport);
        setEditingReport(null);
        alert("Segnalazione modificata con successo nel database!");
      } else {
        const newReport: WasteReport = {
          ...formData,
          id: `rep-${Date.now()}`,
          status: "reported",
          createdAt: new Date().toISOString(),
        };
        await saveReportToFirestore(newReport);
        setActiveReportId(newReport.id);
      }

      setSelectedLat(null);
      setSelectedLng(null);
      setIsPickingLocation(false);
      setActiveTab("list");
    } catch (err: any) {
      console.error("Firebase error during save:", err);
      alert("Si è verificato un errore nel salvataggio dei dati nel database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReport = (report: WasteReport) => {
    setEditingReport(report);
    setSelectedLat(report.lat);
    setSelectedLng(report.lng);
    setIsPickingLocation(true);
    setActiveTab("form");
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setSelectedLat(null);
    setSelectedLng(null);
    setIsPickingLocation(false);
    setActiveTab("list");
  };

  // Update report status in Firestore
  const handleUpdateStatus = async (id: string, status: StatusType) => {
    const report = reports.find((r) => r.id === id);
    if (report) {
      try {
        await saveReportToFirestore({ ...report, status });
      } catch (err) {
        console.error("Firebase update status error:", err);
      }
    }
  };

  // Delete report from Firestore
  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReportFromFirestore(id);
      if (activeReportId === id) {
        setActiveReportId(null);
      }
    } catch (err) {
      console.error("Firebase delete error:", err);
    }
  };

  // Svuota completamente il database delle segnalazioni
  const handleClearAllReports = async () => {
    if (window.confirm("Sei sicuro di voler CANCELLARE TUTTE le segnalazioni presenti nel database comunale? Questa azione eliminerà permanentemente tutti i record.")) {
      try {
        const deletePromises = reports.map((r) => deleteReportFromFirestore(r.id));
        await Promise.all(deletePromises);
        setActiveReportId(null);
        alert("Tutti i dati sono stati rimossi con successo dal database!");
      } catch (err) {
        console.error("Errore nello svuotamento del database:", err);
        alert("Si è verificato un errore durante la rimozione dei dati.");
      }
    }
  };

  // Carica i dati dimostrativi di esempio
  const handleLoadDemoReports = async () => {
    try {
      const savePromises = INITIAL_REPORTS.map((report) => saveReportToFirestore(report));
      await Promise.all(savePromises);
      alert("Dati dimostrativi di esempio caricati con successo nel database!");
    } catch (err) {
      console.error("Errore nel caricamento dei dati demo:", err);
      alert("Si è verificato un errore durante il caricamento dei dati dimostrativi.");
    }
  };

  // Select report (pan and highlight)
  const handleSelectReport = (id: string) => {
    setActiveReportId(id);
    const report = reports.find((r) => r.id === id);
    if (report) {
      setSelectedLat(report.lat);
      setSelectedLng(report.lng);
    }
  };

  // Pick location on map click
  const handleLocationSelect = (lat: number, lng: number) => {
    if (isPickingLocation || activeTab === "form") {
      setSelectedLat(lat);
      setSelectedLng(lng);
    }
  };

  // Calculate statistics
  const totalReports = reports.length;
  const activeReports = reports.filter((r) => r.status !== "cleaned").length;
  const dangerousReports = reports.filter((r) => r.isDangerous && r.status !== "cleaned").length;
  const cleanedReports = reports.filter((r) => r.status === "cleaned").length;

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem("eco_user", JSON.stringify(user));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* HEADER SECTION */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E5E5EA] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#34C759] to-[#30B0C7] flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#1C1C1E] flex items-center gap-2">
                EcoTracker <span className="text-[#34C759] font-medium">City Care</span>
                <span className="bg-[#E5V5EA] text-[#8E8E93] text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border border-[#D1D1D6]/40">
                  CER Catalogo
                </span>
              </h1>
              <p className="text-xs text-[#8E8E93]">
                Mappatura e analisi intelligente dei rifiuti abbandonati
              </p>
            </div>
          </div>

          {/* RIGHT CONTROLS: STATS & USER LOGIN */}
          <div className="flex flex-wrap items-center gap-3 justify-end">
            {/* QUICK STATS PANEL (Apple Widget Style) */}
            <div className="flex items-center gap-2 bg-[#E5E5EA]/50 p-1 rounded-2xl text-xs">
              <div className="px-3.5 py-1.5 rounded-xl bg-white text-center min-w-[70px] shadow-sm">
                <span className="text-[#8E8E93] text-[9px] uppercase tracking-wider block font-bold">Totali</span>
                <span className="text-[#1C1C1E] font-bold text-sm">{totalReports}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-[#FF3B30]/10 text-center text-[#FF3B30] min-w-[70px]">
                <span className="text-[9px] uppercase tracking-wider block font-bold">Critici</span>
                <span className="font-bold text-sm">{dangerousReports}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-[#34C759]/10 text-center text-[#34C759] min-w-[70px]">
                <span className="text-[9px] uppercase tracking-wider block font-bold">Risolti</span>
                <span className="font-bold text-sm">{cleanedReports}</span>
              </div>
            </div>

            {/* USER LOGIN PROFILE (Apple Style) */}
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-2xl text-xs shadow-sm">
              <div className="flex flex-col items-end">
                <span className="font-bold text-slate-800">{currentUser.name}</span>
                <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wide">
                  {currentUser.role === "admin" ? "👑 Amministratore" : currentUser.role === "operator" ? "👷 Operatore" : "👤 Cittadino"}
                </span>
              </div>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  localStorage.removeItem("eco_user");
                }}
                className="bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] font-bold px-2.5 py-1.5 rounded-xl transition text-[10px]"
              >
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: INTERACTIVE MAP */}
        <section className={`lg:col-span-7 flex flex-col gap-4 h-[400px] lg:h-auto min-h-[500px] transition-all duration-300 ${activeTab === "stats" ? "lg:hidden opacity-0" : "opacity-100"}`}>
          <div className="bg-white p-1 rounded-3xl border border-[#E5E5EA] flex-1 flex flex-col shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#F2F2F7] flex items-center justify-between text-xs text-[#8E8E93]">
              <span className="font-bold text-[#1C1C1E] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#34C759]" />
                Mappa Territoriale
              </span>
              <span className="text-[11px] bg-[#F2F2F7] px-2.5 py-0.5 rounded-full text-[#545456] font-mono">
                {selectedLat !== null ? `${selectedLat.toFixed(4)}°, ${selectedLng?.toFixed(4)}°` : "Posizione automatica attiva"}
              </span>
            </div>
            <div className="flex-1 relative">
              <MapComponent
                reports={reports}
                selectedLat={selectedLat}
                selectedLng={selectedLng}
                onLocationSelect={handleLocationSelect}
                activeReportId={activeReportId}
                onSelectReport={handleSelectReport}
                isPickingLocation={isPickingLocation}
              />
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: CONTROLS & FORM/LIST (Apple Pane Style) */}
        <section className={`transition-all duration-300 flex flex-col bg-white rounded-3xl border border-[#E5E5EA] overflow-hidden shadow-sm ${activeTab === "stats" ? "lg:col-span-12" : "lg:col-span-5"}`}>
          {/* TAB SWITCHERS (iOS Segmented Control Style) */}
          <div className="p-3 bg-[#F2F2F7]/80 border-b border-[#E5E5EA]">
            <div className="flex bg-[#E5E5EA]/60 p-1 rounded-2xl gap-0.5">
              <button
                onClick={() => {
                  setActiveTab("form");
                  setIsPickingLocation(true);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
                  activeTab === "form"
                    ? "bg-white text-[#1C1C1E] shadow-sm"
                    : "text-[#8E8E93] hover:text-[#1C1C1E]"
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Segnala
              </button>
              <button
                onClick={() => {
                  setActiveTab("list");
                  setIsPickingLocation(false);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
                  activeTab === "list"
                    ? "bg-white text-[#1C1C1E] shadow-sm"
                    : "text-[#8E8E93] hover:text-[#1C1C1E]"
                }`}
              >
                <FileText className="w-4 h-4" />
                Elenco ({reports.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("stats");
                  setIsPickingLocation(false);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
                  activeTab === "stats"
                    ? "bg-white text-[#1C1C1E] shadow-sm"
                    : "text-[#8E8E93] hover:text-[#1C1C1E]"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Statistiche
              </button>
            </div>
          </div>

          {/* TAB CONTENT AREA */}
          <div className="p-5 flex-1 overflow-y-auto text-[#1C1C1E] bg-white">
            {activeTab === "form" ? (
              <div className="space-y-4">
                <div className="border-b border-[#F2F2F7] pb-3">
                  <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#34C759]" />
                    {editingReport ? "Modifica Segnalazione" : "Nuova Segnalazione"}
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    {editingReport
                      ? "Aggiorna i dettagli della segnalazione selezionata."
                      : "Trascina una foto o selezionala per far analizzare i codici EER a Gemini."}
                  </p>
                </div>
                <WasteForm
                  selectedLat={selectedLat}
                  selectedLng={selectedLng}
                  onSubmit={handleFormSubmit}
                  isSubmitting={isSubmitting}
                  onStartPickLocation={() => setIsPickingLocation(true)}
                  onLocationSelect={(lat, lng) => {
                    setSelectedLat(lat);
                    setSelectedLng(lng);
                  }}
                  editingReport={editingReport}
                  onCancelEdit={handleCancelEdit}
                  currentUser={currentUser}
                  onCancelPickLocation={() => {
                    setSelectedLat(null);
                    setSelectedLng(null);
                    setIsPickingLocation(false);
                    if (editingReport) {
                      setEditingReport(null);
                    }
                  }}
                />
              </div>
            ) : activeTab === "list" ? (
              <div className="space-y-4">
                <div className="border-b border-[#F2F2F7] pb-3">
                  <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#34C759]" />
                    Registro Segnalazioni
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    Filtra e gestisci gli interventi sul territorio comunale.
                  </p>
                </div>
                <WasteList
                  reports={reports}
                  activeReportId={activeReportId}
                  onSelectReport={handleSelectReport}
                  onUpdateStatus={handleUpdateStatus}
                  onDeleteReport={handleDeleteReport}
                  onEditReport={handleEditReport}
                  currentUser={currentUser}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b border-[#F2F2F7] pb-3">
                  <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#34C759]" />
                    Analisi e Statistiche IA
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    Panoramica in tempo reale sul database dei rifiuti abbandonati e lo stato dei ripristini territoriali.
                  </p>
                </div>
                <WasteStats 
                  reports={reports} 
                  onClearAll={handleClearAllReports}
                  onLoadDemo={handleLoadDemoReports}
                  currentUser={currentUser}
                />
              </div>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E5E5EA] py-4 text-center text-[11px] text-[#8E8E93]">
        <p className="flex items-center justify-center gap-1.5">
          <span>EcoTracker City Care &copy; 2026</span>
          <span className="text-[#D1D1D6]">|</span>
          <span>Creato da NaCreator</span>
          <span className="text-[#D1D1D6]">|</span>
          <span className="flex items-center gap-1 font-mono text-[#545456]">
            <Sparkles className="w-3.5 h-3.5 text-[#34C759] animate-pulse" /> Analizzato con Gemini Flash
          </span>
        </p>
      </footer>
    </div>
  );
}

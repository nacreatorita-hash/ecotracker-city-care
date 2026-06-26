import React, { useState, useEffect, useRef } from "react";
import { EER_CODES, EERCode } from "../data/eerCodes";
import { SeverityType, WasteReport } from "../types";
import { Camera, Upload, AlertTriangle, Sparkles, Search, Check, RefreshCw, MapPin } from "lucide-react";

interface WasteFormProps {
  selectedLat: number | null;
  selectedLng: number | null;
  onSubmit: (report: Omit<WasteReport, "id" | "createdAt" | "status">) => void;
  isSubmitting: boolean;
  onCancelPickLocation?: () => void;
  onStartPickLocation?: () => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  editingReport?: WasteReport | null;
  onCancelEdit?: () => void;
  currentUser?: { name: string; email: string; role: string } | null;
}

export default function WasteForm({
  selectedLat,
  selectedLng,
  onSubmit,
  isSubmitting,
  onCancelPickLocation,
  onStartPickLocation,
  onLocationSelect,
  editingReport,
  onCancelEdit,
  currentUser,
}: WasteFormProps) {
  // Form State
  const [wasteType, setWasteType] = useState("");
  const [eerCode, setEerCode] = useState("");
  const [description, setDescription] = useState("");
  const [isDangerous, setIsDangerous] = useState(false);
  const [severity, setSeverity] = useState<SeverityType>("medium");
  const [notes, setNotes] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [cleanupRecommendation, setCleanupRecommendation] = useState("");
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [locationName, setLocationName] = useState("");

  // Sync state with editingReport or currentUser
  useEffect(() => {
    if (editingReport) {
      setWasteType(editingReport.wasteType);
      setEerCode(editingReport.eerCode);
      setDescription(editingReport.description || "");
      setIsDangerous(editingReport.isDangerous);
      setSeverity(editingReport.severity);
      setNotes(editingReport.notes || "");
      setReporterName(editingReport.reporterName || "");
      setCleanupRecommendation(editingReport.cleanupRecommendation || "");
      setImagePreview(editingReport.photo || null);
      setSearchQuery(`${editingReport.eerCode} - ${editingReport.wasteType}`);
      setLocationName(editingReport.locationName || "");
    } else {
      setWasteType("");
      setEerCode("");
      setDescription("");
      setIsDangerous(false);
      setSeverity("medium");
      setNotes("");
      setReporterName(currentUser ? currentUser.name : "");
      setCleanupRecommendation("");
      setImagePreview(null);
      setSearchQuery("");
      setLocationName("");
    }
  }, [editingReport, currentUser]);

  // OpenStreetMap Nominatim reverse geocoding Effect
  useEffect(() => {
    if (selectedLat !== null && selectedLng !== null) {
      if (editingReport && editingReport.lat === selectedLat && editingReport.lng === selectedLng) {
        // Keep the editing report's location name
        setLocationName(editingReport.locationName || "");
        return;
      }
      
      const fetchAddress = async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLat}&lon=${selectedLng}&zoom=18&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "it-IT,it;q=0.9",
                "User-Agent": "EcoTracker-City-Care-Applet"
              }
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              const addr = data.address;
              let parts = [];
              if (addr.road) parts.push(addr.road);
              if (addr.house_number) parts.push(addr.house_number);
              if (addr.suburb) parts.push(addr.suburb);
              if (addr.city || addr.town || addr.village) {
                parts.push(addr.city || addr.town || addr.village);
              }
              const simpleAddress = parts.length > 0 ? parts.join(", ") : data.display_name;
              setLocationName(simpleAddress);
            }
          }
        } catch (err) {
          console.error("Geocoding error:", err);
        }
      };
      
      fetchAddress();
    } else {
      setLocationName("");
    }
  }, [selectedLat, selectedLng, editingReport]);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // EER Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [showEerDropdown, setShowEerDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter EER codes based on search query
  const filteredEerCodes = EER_CODES.filter(
    (item) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.commonExamples &&
        item.commonExamples.some((ex) =>
          ex.toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  // Handle outside clicks to close EER dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync isDangerous with selected EER code if matched
  const handleSelectEER = (item: EERCode) => {
    setEerCode(item.code);
    setWasteType(item.description);
    setIsDangerous(item.isDangerous);
    setSearchQuery(`${item.code} - ${item.description}`);
    setShowEerDropdown(false);

    // Auto-set severity if dangerous
    if (item.isDangerous) {
      setSeverity("high");
    }
  };

  // Compress and resize image to fit Base64 constraints (< 200kb) and fast uploads
  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Max dimension 800px
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setImagePreview(compressedBase64);
          setAiError(null);
          setAiAnalysisResult(null);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag and drop handlers
  const [isDragActive, setIsDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // AI Scan handler
  const handleAIScan = async () => {
    if (!imagePreview) return;

    setIsAnalyzing(true);
    setAiError(null);
    setAiAnalysisResult(null);

    try {
      // Strip header to get raw base64 string
      const base64Data = imagePreview.split(",")[1];
      const response = await fetch("/api/waste/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: "image/jpeg",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Errore sconosciuto dall'API");
      }

      const result = await response.json();
      setAiAnalysisResult(result);

      // Populate form
      setEerCode(result.eerCode);
      setWasteType(result.wasteType);
      setIsDangerous(result.isDangerous);
      setDescription(result.description);
      setCleanupRecommendation(result.cleanupRecommendation);

      // Auto-update search bar string
      setSearchQuery(`${result.eerCode} - ${result.wasteType}`);

      // Set severity
      if (result.isDangerous) {
        setSeverity("high");
      } else {
        setSeverity("medium");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Impossibile analizzare l'immagine. Verifica la chiave API.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickGPS = () => {
    if (!navigator.geolocation) {
      alert("La geolocalizzazione non è supportata da questo browser.");
      return;
    }
    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGPS(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      },
      (err) => {
        console.warn("Errore GPS rapido alta precisione, provo standard:", err.message);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setIsLocatingGPS(false);
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (onLocationSelect) {
              onLocationSelect(lat, lng);
            }
          },
          (e) => {
            setIsLocatingGPS(false);
            alert("Impossibile rilevare la posizione automatica. Controlla i permessi GPS del browser o seleziona manualmente sulla mappa.");
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Trigger form submit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eerCode) {
      alert("Seleziona o digita un codice EER.");
      return;
    }
    if (!wasteType) {
      alert("Specifica la tipologia del rifiuto.");
      return;
    }
    if (selectedLat === null || selectedLng === null) {
      alert("Seleziona o rileva una posizione prima di inviare.");
      return;
    }

    onSubmit({
      lat: selectedLat,
      lng: selectedLng,
      locationName: locationName || undefined,
      eerCode,
      wasteType,
      isDangerous,
      photo: imagePreview || undefined,
      description,
      severity,
      notes,
      reporterName: reporterName || "Anonimo",
      reporterEmail: editingReport ? editingReport.reporterEmail : (currentUser?.email || undefined),
      cleanupRecommendation: cleanupRecommendation || undefined,
    });

    if (!editingReport) {
      // Reset Form
      setWasteType("");
      setEerCode("");
      setDescription("");
      setIsDangerous(false);
      setSeverity("medium");
      setNotes("");
      setReporterName(currentUser ? currentUser.name : "");
      setCleanupRecommendation("");
      setImagePreview(null);
      setAiAnalysisResult(null);
      setSearchQuery("");
      setLocationName("");
    }
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-5">
      {/* SEZIONE 1: MAP POSITION PICKER */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          Posizione Segnalazione
        </label>

        {selectedLat !== null && selectedLng !== null ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600">
              <div className="font-mono">
                Lat: <span className="text-slate-900 font-medium">{selectedLat.toFixed(6)}</span>, Lng:{" "}
                <span className="text-slate-900 font-medium">{selectedLng.toFixed(6)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isLocatingGPS}
                  onClick={handleQuickGPS}
                  className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] transition flex items-center gap-0.5"
                  title="Aggiorna con GPS reale"
                >
                  {isLocatingGPS ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Rileva GPS"}
                </button>
                {onStartPickLocation && (
                  <button
                    type="button"
                    onClick={onStartPickLocation}
                    className="text-slate-500 hover:text-slate-700 font-bold text-[11px] transition border-l border-slate-200 pl-2"
                  >
                    Mappa
                  </button>
                )}
              </div>
            </div>

            {/* Display geocoded address input/info for high usability */}
            <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-200 space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Indirizzo o Località Rilevata</span>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Rilevamento indirizzo in corso..."
                className="w-full bg-slate-50 border border-slate-100 rounded-md px-2 py-1 text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 py-1">
            <button
              type="button"
              disabled={isLocatingGPS}
              onClick={handleQuickGPS}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-xl text-xs shadow-md shadow-emerald-600/15 transition duration-200 active:scale-95 disabled:opacity-60"
            >
              {isLocatingGPS ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Rilevamento posizione GPS...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-emerald-200 animate-pulse" />
                  Rileva Mia Posizione Corrente
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onStartPickLocation}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl border border-slate-200 text-xs transition"
            >
              🗺️ Scegli punto specifico sulla mappa
            </button>
            <p className="text-[10px] text-slate-400 text-center leading-normal">
              Ottieni le tue coordinate GPS reali o clicca sulla mappa per un punto preciso.
            </p>
          </div>
        )}
      </div>

      {/* SEZIONE 2: FOTO & ANALISI IA */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Foto Rifiuto
        </label>

        {imagePreview ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-inner bg-slate-950 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Rifiuto"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setAiAnalysisResult(null);
                  setAiError(null);
                }}
                className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full text-xs transition shadow-md"
                title="Rimuovi foto"
              >
                ✕
              </button>
            </div>

            {/* AI Analyzer button */}
            {!aiAnalysisResult && (
              <button
                type="button"
                onClick={handleAIScan}
                disabled={isAnalyzing}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/10 text-xs transition-all duration-350 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analisi con IA in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse text-emerald-200" />
                    Compila modulo con IA (Analisi Foto)
                  </>
                )}
              </button>
            )}

            {aiError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{aiError}</span>
              </div>
            )}

            {aiAnalysisResult && (
              <div className="p-3.5 bg-gradient-to-br from-emerald-50/50 to-teal-50/40 border border-emerald-100 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-100/45 pb-1.5">
                  <span className="font-bold text-emerald-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Analizzato da Gemini Flash
                  </span>
                  <span className="font-bold bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded text-[10px]">
                    Confidenza {aiAnalysisResult.confidence}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-medium">EER Rilevato:</span>
                    <p className="font-mono font-bold text-emerald-950">{aiAnalysisResult.eerCode}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Pericoloso:</span>
                    <p className="font-bold text-slate-800">{aiAnalysisResult.isDangerous ? "SÌ ⚠️" : "No"}</p>
                  </div>
                </div>
                {aiAnalysisResult.cleanupRecommendation && (
                  <div className="bg-white/70 p-2.5 rounded-lg border border-emerald-100/30">
                    <span className="text-slate-400 text-[10px] font-bold block mb-0.5">RACCOMANDAZIONE:</span>
                    <p className="text-slate-800 italic text-[11px] leading-relaxed">
                      "{aiAnalysisResult.cleanupRecommendation}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-emerald-500 bg-emerald-50/40"
                : "border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-slate-100/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Scatta una foto o trascinala qui</p>
              <p className="text-[10px] text-slate-400">Supporta file PNG, JPG, JPEG fino a 10MB</p>
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-sm hover:shadow transition">
                <Upload className="w-3 h-3" /> Sfoglia file
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEZIONE 3: EER CODE SEARCH */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">
          Codice EER (Elenco Europeo Rifiuti)
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setEerCode(e.target.value); // support typing manually too
              setShowEerDropdown(true);
            }}
            onFocus={() => setShowEerDropdown(true)}
            placeholder="es: 20 03 07 (cerca per codice o tipologia...)"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm transition pl-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        {/* EER Dropdown List */}
        {showEerDropdown && filteredEerCodes.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredEerCodes.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelectEER(item)}
                className="w-full text-left p-3 hover:bg-slate-50 transition flex items-start gap-2.5 text-xs"
              >
                <span className="font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                  {item.code}
                </span>
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{item.description}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Esempi: {item.commonExamples?.join(", ")}
                  </p>
                </div>
                {item.isDangerous && (
                  <span className="ml-auto shrink-0 bg-rose-50 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    ⚠️ P
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SEZIONE 4: CLASSIFICAZIONE DETTAGLI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Tipologia Rifiuto (Sintesi)
          </label>
          <input
            type="text"
            required
            value={wasteType}
            onChange={(e) => setWasteType(e.target.value)}
            placeholder="Es: Rifiuti ingombranti misti"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm transition"
          />
        </div>

        <div className="flex items-end h-full">
          <label className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 cursor-pointer w-full hover:bg-slate-100/40 transition">
            <input
              type="checkbox"
              checked={isDangerous}
              onChange={(e) => setIsDangerous(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 w-4 h-4"
            />
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                Rifiuto Pericoloso ⚠️
              </span>
              <p className="text-[10px] text-slate-400">Contiene sostanze inquinanti o tossiche</p>
            </div>
          </label>
        </div>
      </div>

      {/* SEZIONE 5: GRAVITA' & REPORTER */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Livello Urgenza/Gravità
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as SeverityType)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm transition"
          >
            <option value="low">Bassa (Pochi sacchi)</option>
            <option value="medium">Media (Ingombrante singolo)</option>
            <option value="high">Alta (Notevole cumulo)</option>
            <option value="critical">Critica (Amianto, tossici)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Nome Segnalatore
          </label>
          <input
            type="text"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="Inserisci il tuo nome"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm transition"
          />
        </div>
      </div>

      {/* SEZIONE 6: DESCRIZIONE & RACCOMANDAZIONI */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Descrizione del Rifiuto
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrizione aggiuntiva..."
          rows={3}
          className="w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm transition h-24 resize-none"
        />
      </div>

      {cleanupRecommendation && (
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">
            Raccomandazioni per il Recupero (IA)
          </label>
          <input
            type="text"
            value={cleanupRecommendation}
            onChange={(e) => setCleanupRecommendation(e.target.value)}
            className="w-full bg-emerald-50/50 border border-emerald-100 rounded-lg px-3.5 py-2.5 text-xs text-emerald-950 font-medium italic"
          />
        </div>
      )}

      {/* SUBMIT BUTTONS */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        {editingReport ? (
          <>
            {onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
              >
                Annulla Modifica
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-amber-600/10 transition text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Salva Modifiche
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {onCancelPickLocation && (
              <button
                type="button"
                onClick={onCancelPickLocation}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
              >
                Annulla
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-emerald-600/10 transition text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Inviando...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Invia Segnalazione
                </>
              )}
            </button>
          </>
        )}
      </div>
    </form>
  );
}

import React, { useState } from "react";
import { WasteReport, SeverityType, StatusType } from "../types";
import { Search, Filter, AlertTriangle, CheckCircle, Trash2, MapPin, Calendar, User, Info, ArrowUpRight, Share2, Pencil, Check, Download } from "lucide-react";

interface WasteListProps {
  reports: WasteReport[];
  activeReportId?: string | null;
  onSelectReport: (id: string) => void;
  onUpdateStatus: (id: string, status: StatusType) => void;
  onDeleteReport: (id: string) => void;
  onEditReport?: (report: WasteReport) => void;
  currentUser?: { name: string; email: string; role: string } | null;
}

export default function WasteList({
  reports,
  activeReportId,
  onSelectReport,
  onUpdateStatus,
  onDeleteReport,
  onEditReport,
  currentUser,
}: WasteListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [dangerFilter, setDangerFilter] = useState<boolean | null>(null);
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);

  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;
    
    // CSV Header
    const headers = [
      "ID",
      "EER Code",
      "Tipologia",
      "Pericoloso",
      "Latitudine",
      "Longitudine",
      "Indirizzo/Località",
      "Gravità",
      "Stato",
      "Segnalatore",
      "Data Creazione",
      "Descrizione",
      "Note",
      "Raccomandazione IA"
    ];
    
    // CSV Rows
    const rows = filteredReports.map((r) => [
      r.id,
      r.eerCode,
      r.wasteType,
      r.isDangerous ? "SI" : "NO",
      r.lat,
      r.lng,
      r.locationName || "",
      r.severity,
      r.status,
      r.reporterName || "Anonimo",
      r.createdAt,
      r.description || "",
      r.notes || "",
      r.cleanupRecommendation || ""
    ]);
    
    // Generate CSV content with quotes and escaping
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registro_rifiuti_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (e: React.MouseEvent, report: WasteReport) => {
    e.stopPropagation();
    const googleMapsUrl = `https://maps.google.com/?q=${report.lat},${report.lng}`;
    const shareText = `EcoTracker: Segnalazione ${report.wasteType} (EER ${report.eerCode}) - Urgenza: ${report.severity.toUpperCase()}. Posizione GPS: ${googleMapsUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "EcoTracker - Segnalazione Rifiuto",
          text: shareText,
          url: googleMapsUrl,
        });
        return;
      } catch (err) {
        console.warn("Navigator share non supportato o fallito, uso clipboard:", err);
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedReportId(report.id);
      setTimeout(() => setCopiedReportId(null), 2000);
    } catch (err) {
      alert("Impossibile copiare il link negli appunti.");
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.wasteType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.eerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.notes && report.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || report.severity === severityFilter;
    const matchesDanger = dangerFilter === null || report.isDangerous === dangerFilter;

    return matchesSearch && matchesStatus && matchesSeverity && matchesDanger;
  });

  // Helper for severity color badges
  const getSeverityBadge = (severity: SeverityType) => {
    switch (severity) {
      case "low":
        return <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-[10px]">Bassa</span>;
      case "medium":
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-semibold text-[10px]">Media</span>;
      case "high":
        return <span className="bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md font-semibold text-[10px]">Alta</span>;
      case "critical":
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md font-bold text-[10px] animate-pulse">Critica ⚠️</span>;
    }
  };

  // Helper for status color badges
  const getStatusBadge = (status: StatusType) => {
    switch (status) {
      case "reported":
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">Segnalato</span>;
      case "in_progress":
        return <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-bold">In Corso</span>;
      case "cleaned":
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">Rimosso</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters panel */}
      <div className="bg-slate-50/85 p-4 rounded-xl border border-slate-200/80 space-y-3 shadow-inner">
        <div className="relative">
          <input
            type="text"
            placeholder="Cerca per tipologia, codice EER o descrizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm transition pl-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              <option value="all">Tutti gli stati</option>
              <option value="reported">Solo Segnalati</option>
              <option value="in_progress">Solo In Corso</option>
              <option value="cleaned">Solo Rimossi</option>
            </select>
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              <option value="all">Tutte le urgenze</option>
              <option value="low">Urgenza Bassa</option>
              <option value="medium">Urgenza Media</option>
              <option value="high">Urgenza Alta</option>
              <option value="critical">Urgenza Critica</option>
            </select>
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setDangerFilter(dangerFilter === true ? null : true)}
              className={`flex-1 px-2.5 py-1.5 rounded-lg border text-center font-bold transition text-xs ${
                dangerFilter === true
                  ? "bg-rose-50 border-rose-300 text-rose-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Pericolosi ⚠️
            </button>
            {(searchTerm || statusFilter !== "all" || severityFilter !== "all" || dangerFilter !== null) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSeverityFilter("all");
                  setDangerFilter(null);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 text-[11px] font-bold transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reports Counter */}
      <div className="text-xs text-slate-400 font-medium px-1 flex justify-between items-center bg-white p-2 rounded-xl border border-slate-150 shadow-sm">
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">Trovate {filteredReports.length} segnalazioni</span>
          {reports.length > 0 && (
            <span className="text-[10px] text-slate-400">
              {reports.filter((r) => r.status === "cleaned").length} di {reports.length} rimosse
            </span>
          )}
        </div>
        {filteredReports.length > 0 && (
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Esporta CSV
          </button>
        )}
      </div>

      {/* List items */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredReports.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400">Nessuna segnalazione trovata con i filtri selezionati.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isActive = activeReportId === report.id;
            const canEdit = true;
            const canDelete = true;
            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.id)}
                className={`bg-white rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col md:flex-row gap-4 relative group ${
                  isActive
                    ? "ring-2 ring-emerald-500 border-emerald-300 shadow-md"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {/* Image side */}
                <div className="w-full md:w-28 h-20 bg-slate-50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-100 shadow-inner">
                  {report.photo ? (
                    <img
                      src={report.photo}
                      alt={report.wasteType}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">Senza foto</span>
                  )}
                </div>

                {/* Content side */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {report.eerCode}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800 truncate">{report.wasteType}</h4>
                    {report.isDangerous && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-100 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                        PERICOLOSO
                      </span>
                    )}
                  </div>

                  {report.description && (
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                      {report.description}
                    </p>
                  )}

                  {report.cleanupRecommendation && (
                    <div className="text-[10px] text-emerald-950 font-semibold italic bg-emerald-50/55 p-1.5 rounded border border-emerald-100/30">
                      IA: "{report.cleanupRecommendation}"
                    </div>
                  )}

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1.5 border-t border-slate-50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {new Date(report.createdAt).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <User className="w-3 h-3 text-slate-300" />
                      {report.reporterName || "Anonimo"}
                    </span>
                    <span 
                      className="flex items-center gap-0.5 text-emerald-600 font-bold hover:underline"
                      title={`${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`}
                    >
                      <MapPin className="w-3 h-3 text-slate-300" />
                      {report.locationName || `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`}
                    </span>
                  </div>
                </div>

                {/* Status, severity badges and actions side */}
                <div className="flex flex-row md:flex-col justify-between items-end md:justify-start gap-2 shrink-0 md:pl-2 border-l border-slate-100 md:h-full text-right self-stretch">
                  <div className="flex md:flex-col gap-1.5 items-center md:items-end">
                    {getStatusBadge(report.status)}
                    {getSeverityBadge(report.severity)}
                  </div>

                  {/* Operational actions for managing reports */}
                  <div className="flex items-center gap-1.5 pt-2 md:mt-auto">
                    {/* Share button */}
                    <button
                      type="button"
                      onClick={(e) => handleShare(e, report)}
                      className={`p-1 rounded transition flex items-center gap-1 text-[10px] ${
                        copiedReportId === report.id
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-1.5 py-0.5"
                          : "text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                      }`}
                      title="Condividi o copia dettagli"
                    >
                      {copiedReportId === report.id ? (
                        <>✓ Copiato</>
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Edit button */}
                    {canEdit && onEditReport && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditReport(report);
                        }}
                        className="text-slate-400 hover:text-amber-600 p-1 rounded hover:bg-slate-100 transition"
                        title="Modifica segnalazione"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Operational controls */}
                    {report.status === "reported" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(report.id, "in_progress");
                        }}
                        className="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-bold transition shadow-sm"
                      >
                        In Corso
                      </button>
                    )}
                    {report.status === "in_progress" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(report.id, "cleaned");
                        }}
                        className="text-[10px] bg-emerald-600 text-white hover:bg-emerald-700 px-1.5 py-0.5 rounded font-bold transition flex items-center gap-0.5 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Fatto
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Sei sicuro di voler eliminare questa segnalazione?")) {
                            onDeleteReport(report.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition"
                        title="Elimina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

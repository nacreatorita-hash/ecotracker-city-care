import React from "react";
import { WasteReport } from "../types";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { AlertTriangle, ShieldCheck, Clipboard, TrendingUp, Database, Trash2, RefreshCw } from "lucide-react";

interface WasteStatsProps {
  reports: WasteReport[];
  onClearAll?: () => void;
  onLoadDemo?: () => void;
  currentUser?: { name: string; email: string; role: string } | null;
}

export default function WasteStats({ 
  reports, 
  onClearAll, 
  onLoadDemo, 
  currentUser 
}: WasteStatsProps) {
  // 1. Data calculation: Statuses
  const total = reports.length;
  const reported = reports.filter((r) => r.status === "reported").length;
  const inProgress = reports.filter((r) => r.status === "in_progress").length;
  const cleaned = reports.filter((r) => r.status === "cleaned").length;

  const statusData = [
    { name: "Segnalati", value: reported, color: "#FF9500" },
    { name: "In Corso", value: inProgress, color: "#007AFF" },
    { name: "Rimossi", value: cleaned, color: "#34C759" },
  ];

  // 2. Data calculation: Severity
  const low = reports.filter((r) => r.severity === "low").length;
  const medium = reports.filter((r) => r.severity === "medium").length;
  const high = reports.filter((r) => r.severity === "high").length;
  const critical = reports.filter((r) => r.severity === "critical").length;

  const severityData = [
    { name: "Bassa", value: low, color: "#8E8E93" },
    { name: "Media", value: medium, color: "#FFCC00" },
    { name: "Alta", value: high, color: "#FF9500" },
    { name: "Critica", value: critical, color: "#FF3B30" },
  ];

  // 3. Data calculation: Dangerous
  const dangerous = reports.filter((r) => r.isDangerous).length;
  const safe = total - dangerous;

  const dangerData = [
    { name: "Pericoloso ⚠️", value: dangerous, color: "#FF3B30" },
    { name: "Non Pericoloso", value: safe, color: "#34C759" },
  ];

  // 4. Data calculation: Top EER Codes
  const eerCounts: Record<string, { count: number; desc: string }> = {};
  reports.forEach((r) => {
    if (eerCounts[r.eerCode]) {
      eerCounts[r.eerCode].count += 1;
    } else {
      eerCounts[r.eerCode] = { count: 1, desc: r.wasteType };
    }
  });

  const eerData = Object.entries(eerCounts)
    .map(([code, data]) => ({
      code,
      count: data.count,
      desc: data.desc,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const cleanRate = total > 0 ? Math.round((cleaned / total) * 100) : 0;
  const criticalRate = total > 0 ? Math.round((critical / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Administrative Control Panel - Always visible for sandbox flexibility */}
      {true && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Strumenti di Amministrazione</h4>
              <p className="text-[10px] text-slate-500">
                Pulisci l'intero registro comunale per una distribuzione pulita, oppure carica i dati di prova predefiniti.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            {onLoadDemo && (
              <button
                type="button"
                onClick={onLoadDemo}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-extrabold transition shadow-sm active:scale-95"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                Dati Esempio
              </button>
            )}
            {onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl text-[10px] font-extrabold transition shadow-sm active:scale-95"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                Svuota Tutto
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Totale Segnalazioni</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-950 font-sans">{total}</span>
            <span className="text-slate-400 text-xs">rifiuti</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 border-t border-slate-100 pt-1.5">
            <Clipboard className="w-3 h-3 text-slate-400" /> Registro pubblico attivo
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tasso Rimozione</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-600 font-sans">{cleanRate}%</span>
            <span className="text-emerald-500 text-xs">risolti</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 border-t border-slate-100 pt-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> {cleaned} aree ripristinate
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rifiuti Pericolosi</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-rose-600 font-sans">{dangerous}</span>
            <span className="text-rose-500 text-xs">critici</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 border-t border-slate-100 pt-1.5">
            <AlertTriangle className="w-3 h-3 text-rose-500" /> {Math.round((dangerous / (total || 1)) * 100)}% del database
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Urgenze Critiche</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-amber-600 font-sans">{criticalRate}%</span>
            <span className="text-amber-500 text-xs">totali</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 border-t border-slate-100 pt-1.5">
            <TrendingUp className="w-3 h-3 text-amber-500" /> {critical} interventi urgenti
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Statuses Distribution */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Stato dei Ripristini Ambientali
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8E8E93" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8E8E93" }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E5EA", fontSize: "11px" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hazard Distribution */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Classificazione Rischio Rifiuti
          </h3>
          <div className="h-56 flex items-center justify-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dangerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dangerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E5EA", fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3.5 pl-4">
              {dangerData.map((item, index) => (
                <div key={item.name} className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs font-bold text-slate-800">{item.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 pl-4">
                    {item.value} segnalazioni ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Severity levels */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Livelli di Urgenza e Gravità
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8E8E93" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8E8E93" }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E5EA", fontSize: "11px" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top EER Codes */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Top 5 Codici EER più Frequenti
          </h3>
          {eerData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              Nessun dato registrato.
            </div>
          ) : (
            <div className="space-y-3.5 h-56 overflow-y-auto pr-1 pt-2">
              {eerData.map((item, index) => (
                <div key={item.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      EER {item.code}
                    </span>
                    <span className="font-bold text-slate-700">
                      {item.count} {item.count === 1 ? "segnalazione" : "segnalazioni"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (item.count / (total || 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

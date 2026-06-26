import React from "react";
import { Shield, X } from "lucide-react";

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-800">
              Informativa sulla Privacy e GDPR
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed font-sans">
          <p className="font-semibold text-slate-800">
            Ultimo aggiornamento: Giugno 2026
          </p>
          <p>
            Benvenuto su <strong>EcoTracker City Care</strong>. La tutela dei tuoi dati personali è fondamentale per noi. Questa informativa spiega come raccogliamo, utilizziamo e proteggiamo i dati degli utenti in conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR - UE 2016/679).
          </p>

          <hr className="border-slate-100" />

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
              1. Titolare del Trattamento
            </h4>
            <p>
              Il titolare del trattamento dei dati è l'amministrazione del Comune di utilizzo o l'ente concessionario dei servizi di igiene urbana che adotta la piattaforma EcoTracker City Care per scopi istituzionali di tutela ambientale.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
              2. Tipologia di Dati Raccolti
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Dati Identificativi:</strong> Nome, Cognome e indirizzo email inseriti in fase di accesso per garantire la rintracciabilità delle segnalazioni.
              </li>
              <li>
                <strong>Dati di Geolocalizzazione:</strong> Coordinate GPS (latitudine e longitudine) del luogo in cui viene rilevato il rifiuto abbandonato.
              </li>
              <li>
                <strong>Contenuti Multimediali:</strong> Fotografie caricate dall'utente a supporto della segnalazione. Le immagini non devono ritrarre persone, targhe automobilistiche o dati sensibili.
              </li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
              3. Finalità del Trattamento
            </h4>
            <p>
              I dati sono raccolti ed elaborati esclusivamente per finalità di pubblico interesse, tra cui:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Identificazione delle aree soggette a sversamento illecito di rifiuti.</li>
              <li>Pianificazione e ottimizzazione delle operazioni di bonifica e rimozione da parte degli operatori ecologici autorizzati.</li>
              <li>Generazione di analisi statistiche anonime sui codici EER (Catalogo Europeo dei Rifiuti) e sui tassi di ripristino ambientale del territorio.</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
              4. Base Giuridica del Trattamento
            </h4>
            <p>
              La base giuridica del trattamento si fonda sul consenso esplicito dell'interessato (espresso tramite l'accettazione della presente informativa all'accesso) e sull'esecuzione di un compito di interesse pubblico connesso all'esercizio di pubblici poteri di cui è investito il Titolare.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
              5. Conservazione dei Dati
            </h4>
            <p>
              I dati personali identificativi (nome ed email) vengono conservati nel database protetto su Firestore Cloud per il tempo strettamente necessario alla gestione della segnalazione e del successivo ripristino ambientale, e comunque non oltre 24 mesi dalla risoluzione dell'evento.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
              6. Diritti dell'Interessato
            </h4>
            <p>
              Ai sensi del GDPR, l'utente ha il diritto di:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Accedere ai propri dati personali registrati nella piattaforma.</li>
              <li>Richiedere la rettifica o la cancellazione dei propri dati identificativi.</li>
              <li>Opporsi al trattamento o richiedere la limitazione dello stesso.</li>
            </ul>
            <p className="mt-1">
              Le richieste possono essere inoltrate direttamente all'ufficio relazioni con il pubblico (URP) del Comune o all'indirizzo email di supporto.
            </p>
          </div>

          <div className="space-y-1.5 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <p className="font-bold text-emerald-950 text-[10px] uppercase tracking-wide">
              Nota per gli Store di Applicazioni (Apple App Store / Google Play)
            </p>
            <p className="text-emerald-900 text-[10px]">
              EcoTracker City Care non contiene annunci pubblicitari, non vende dati a terze parti né esegue profilazione commerciale. Tutti i dati inseriti sono protetti tramite regole di sicurezza Firestore e trasmessi in modo criptato tramite protocollo HTTPS.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow transition"
          >
            Ho letto e compreso
          </button>
        </div>
      </div>
    </div>
  );
}

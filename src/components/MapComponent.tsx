import React, { useEffect, useRef, useState } from "react";
import { WasteReport } from "../types";
import { Navigation, Loader2 } from "lucide-react";

interface MapComponentProps {
  reports: WasteReport[];
  selectedLat: number | null;
  selectedLng: number | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  activeReportId?: string | null;
  onSelectReport?: (id: string) => void;
  isPickingLocation?: boolean;
}

// Map center of Italy by default
const DEFAULT_CENTER: [number, number] = [41.9028, 12.4964];
const DEFAULT_ZOOM = 6;

export default function MapComponent({
  reports,
  selectedLat,
  selectedLng,
  onLocationSelect,
  activeReportId,
  onSelectReport,
  isPickingLocation = false,
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const tempMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  // Real-time user position
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Periodic watch of current location
  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: any = null;

    const startWatching = (highAccuracy: boolean) => {
      try {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            // Reset error if location succeeds
            setLocationError(null);
          },
          (err) => {
            console.log(`Errore tracciamento posizione (alta precisione=${highAccuracy}):`, err.message);
            if (highAccuracy && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
              // Try standard accuracy instead
              if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
              }
              startWatching(false);
            } else if (err.code === err.PERMISSION_DENIED) {
              console.warn("I permessi di geolocalizzazione sono stati negati o bloccati dall'iframe.");
            }
          },
          highAccuracy 
            ? { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
            : { enableHighAccuracy: false, timeout: 15000, maximumAge: 15000 }
        );
        watchId = id;
      } catch (e) {
        console.warn("Errore inizializzazione watchPosition:", e);
      }
    };

    // Fast initial retrieve
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.log("Errore iniziale posizione (alta precisione), provo standard:", err.message);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          (e) => console.log("Impossibile caricare posizione iniziale standard:", e.message),
          { enableHighAccuracy: false, timeout: 10000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    startWatching(true);

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Load Leaflet dynamically from CDN to avoid React 19 / Vite bundling issues
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.id = "leaflet-css";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.id = "leaflet-js";
    script.onload = () => {
      setLeafletLoaded(true);
    };
    script.onerror = () => {
      setLoadError(true);
    };
    document.body.appendChild(script);

    return () => {
      // Keep CDN script and CSS cached to avoid flashes, but cleanup if needed
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !containerRef.current || mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Create Leaflet Map centered on Italy
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(
      selectedLat && selectedLng ? [selectedLat, selectedLng] : DEFAULT_CENTER,
      selectedLat && selectedLng ? 14 : DEFAULT_ZOOM
    );

    // Add high quality tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Layer group for all report markers
    const markersGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersGroupRef.current = markersGroup;

    // Listen to map clicks for picking location
    map.on("click", (e: any) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    });

    // Try to get user current location to center map
    if (navigator.geolocation && !selectedLat) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapRef.current) {
            mapRef.current.setView(
              [position.coords.latitude, position.coords.longitude],
              12
            );
            // Optionally auto-select location if picking is active
            if (onLocationSelect && isPickingLocation) {
              onLocationSelect(position.coords.latitude, position.coords.longitude);
            }
          }
        },
        (err) => console.log("Geolocation permission denied or timed out")
      );
    }
  }, [leafletLoaded]);

  // Update existing report markers
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !markersGroupRef.current) return;

    const L = (window as any).L;
    const markersGroup = markersGroupRef.current;

    // Clear old markers
    markersGroup.clearLayers();

    // Render reports
    reports.forEach((report) => {
      // Determine color and glow depending on status and dangerous nature
      let colorClass = "bg-amber-500 border-amber-300";
      let ringClass = "bg-amber-400";
      if (report.status === "cleaned") {
        colorClass = "bg-emerald-500 border-emerald-300";
        ringClass = "bg-emerald-400";
      } else if (report.isDangerous) {
        colorClass = "bg-rose-600 border-rose-300 animate-pulse";
        ringClass = "bg-rose-500";
      } else if (report.severity === "critical" || report.severity === "high") {
        colorClass = "bg-orange-600 border-orange-300";
        ringClass = "bg-orange-400";
      } else if (report.status === "in_progress") {
        colorClass = "bg-sky-500 border-sky-300";
        ringClass = "bg-sky-400";
      }

      // Is active marker?
      const isActive = activeReportId === report.id;
      const sizeClass = isActive ? "w-6 h-6" : "w-4.5 h-4.5";
      const outerSizeClass = isActive ? "w-9 h-9" : "w-7 h-7";

      // DivIcon for fully custom CSS styling
      const markerHtml = `
        <div class="relative flex items-center justify-center ${outerSizeClass}">
          ${
            isActive || report.isDangerous
              ? `<div class="absolute inset-0 rounded-full ${ringClass} opacity-40 animate-ping"></div>`
              : ""
          }
          <div class="${sizeClass} rounded-full border-2 border-white shadow-lg ${colorClass} transition-all duration-300 flex items-center justify-center">
            ${report.isDangerous ? '<span class="text-[9px] text-white font-bold">!</span>' : ""}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-div-icon",
        iconSize: isActive ? [36, 36] : [28, 28],
        iconAnchor: isActive ? [18, 18] : [14, 14],
      });

      const marker = L.marker([report.lat, report.lng], { icon: customIcon });

      // Dynamic popup content
      const popupHtml = `
        <div class="p-1 font-sans text-xs max-w-[200px]">
          <div class="flex items-center gap-1 mb-1 font-bold text-slate-800 text-sm">
            <span>${report.wasteType}</span>
            ${report.isDangerous ? '<span class="bg-rose-100 text-rose-800 text-[9px] px-1 rounded font-bold">PERICOLOSO</span>' : ""}
          </div>
          <p class="text-slate-500 font-mono text-[10px] mb-1">EER: ${report.eerCode}</p>
          <p class="text-slate-600 line-clamp-2 mb-2">${report.description || "Nessuna descrizione."}</p>
          <div class="flex justify-between items-center text-[10px] text-slate-400">
            <span>Stato: <strong class="text-slate-700">${report.status.toUpperCase()}</strong></span>
            <span>${new Date(report.createdAt).toLocaleDateString("it-IT")}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false });

      // Click event
      marker.on("click", () => {
        if (onSelectReport) {
          onSelectReport(report.id);
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [leafletLoaded, reports, activeReportId]);

  // Update picked/temp location marker
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;

    const L = (window as any).L;
    const map = mapRef.current;

    if (tempMarkerRef.current) {
      map.removeLayer(tempMarkerRef.current);
      tempMarkerRef.current = null;
    }

    if (selectedLat !== null && selectedLng !== null) {
      // If we have selected lat/lng, show a dynamic placement indicator
      const markerHtml = `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute inset-0 rounded-full bg-emerald-500 opacity-40 animate-ping"></div>
          <div class="w-5 h-5 rounded-full border-2 border-white bg-emerald-600 shadow-xl flex items-center justify-center text-white">
            <span class="text-xs font-bold">+</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "temp-div-icon",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const tempMarker = L.marker([selectedLat, selectedLng], { icon: customIcon }).addTo(map);
      tempMarkerRef.current = tempMarker;

      // Pan to selected position if picking or if newly selected
      map.panTo([selectedLat, selectedLng]);
    }
  }, [leafletLoaded, selectedLat, selectedLng]);

  // Update/Render User Location Marker
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !userLocation) return;

    const L = (window as any).L;
    const map = mapRef.current;

    // Remove old user marker
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    // Beautiful glowing blue dot (Apple style)
    const pulseHtml = `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute inset-0 rounded-full bg-[#007AFF] opacity-35 animate-ping"></div>
        <div class="w-4 h-4 rounded-full border-2 border-white bg-[#007AFF] shadow-lg"></div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: pulseHtml,
      className: "user-location-icon",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: customIcon,
      zIndexOffset: 1000, // keep above other markers
    }).addTo(map);

    userMarkerRef.current = userMarker;

    return () => {
      if (userMarkerRef.current && mapRef.current) {
        try {
          mapRef.current.removeLayer(userMarkerRef.current);
        } catch (e) {}
        userMarkerRef.current = null;
      }
    };
  }, [leafletLoaded, userLocation]);

  // Trigger resize on container resizing
  useEffect(() => {
    if (!mapRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [leafletLoaded]);

  // Handle Apple-style 'Locate Me & Pin'
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("La geolocalizzazione non è supportata dal tuo browser o dispositivo.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    const tryStandardAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setUserLocation({ lat, lng });

          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 16);
          }

          if (onLocationSelect) {
            onLocationSelect(lat, lng);
          }
        },
        (err) => {
          setIsLocating(false);
          console.warn("Errore geolocalizzazione standard:", err);
          if (err.code === err.PERMISSION_DENIED) {
            setLocationError("Accesso negato. Abilita i permessi di localizzazione nel browser.");
          } else {
            setLocationError("Impossibile determinare la posizione esatta corrente.");
          }
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setUserLocation({ lat, lng });

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }

        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      },
      (err) => {
        console.warn("Errore geolocalizzazione alta precisione, provo standard:", err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setIsLocating(false);
          setLocationError("Accesso negato. Abilita i permessi di localizzazione nel browser.");
        } else {
          tryStandardAccuracy();
        }
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      {locationError && (
        <div className="absolute top-4 left-4 right-16 bg-[#FF3B30]/90 backdrop-blur-md text-white p-3 rounded-2xl text-[11px] flex flex-col gap-1.5 shadow-lg z-[450] max-w-sm border border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">⚠️ Geolocalizzazione Limitata</span>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              className="text-white/80 hover:text-white font-bold px-1 text-xs"
            >
              ✕
            </button>
          </div>
          <p className="opacity-90 leading-tight">
            Se l'app è aperta nell'iframe di anteprima, i browser bloccano il GPS. 
            Premi il pulsante in alto a destra per <strong>aprire l'app in una nuova scheda</strong>!
          </p>
        </div>
      )}

      {!leafletLoaded && !loadError && (
        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center z-[500] p-4">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-slate-600 animate-pulse">Caricamento mappa interattiva...</p>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center z-[500] p-6 text-center">
          <p className="text-sm font-medium text-rose-500 mb-2">Errore nel caricamento della mappa.</p>
          <p className="text-xs text-slate-500">Controlla la tua connessione internet o ricarica la pagina.</p>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" style={{ minHeight: "350px" }} />

      {/* Floating Locate Me button (Apple iOS style) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-md hover:bg-white text-[#007AFF] hover:text-[#0056B3] rounded-2xl shadow-md border border-[#E5E5EA] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
          title="Rileva la mia posizione esatta"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#8E8E93]" />
          ) : (
            <Navigation className="w-5 h-5 transform -rotate-45 fill-[#007AFF]" />
          )}
        </button>
      </div>

      {isPickingLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-[#1C1C1E]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between pointer-events-none shadow-lg z-[400] max-w-sm mx-auto border border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></span>
            <span>Tocca un punto sulla mappa o usa il GPS per posizionare.</span>
          </div>
          {selectedLat !== null && (
            <span className="font-bold text-[10px] bg-[#34C759] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              Ok!
            </span>
          )}
        </div>
      )}
    </div>
  );
}

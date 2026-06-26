import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { WasteReport } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyBCMuMTtUX2NAg80ggM2P3OVFRqL7L7V5M",
  authDomain: "enduring-depth-0bwbv.firebaseapp.com",
  projectId: "enduring-depth-0bwbv",
  storageBucket: "enduring-depth-0bwbv.firebasestorage.app",
  messagingSenderId: "772470827562",
  appId: "1:772470827562:web:9d688d20b5b5e6146af153"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-registrorifiutia-7b7bb9f2-4b82-4c62-a90d-6280c55907e9");

const REPORTS_COLLECTION = "waste_reports";

// Listen to reports from Firestore in real-time
export function subscribeToReports(onUpdate: (reports: WasteReport[]) => void) {
  const q = query(collection(db, REPORTS_COLLECTION), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const reports: WasteReport[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      reports.push({
        id: docSnap.id,
        wasteType: data.wasteType || "",
        eerCode: data.eerCode || "",
        lat: data.lat || 0,
        lng: data.lng || 0,
        photo: data.photo || undefined,
        isDangerous: !!data.isDangerous,
        severity: data.severity || "medium",
        status: data.status || "reported",
        createdAt: data.createdAt || new Date().toISOString(),
        description: data.description || undefined,
        notes: data.notes || undefined,
        cleanupRecommendation: data.cleanupRecommendation || undefined,
        reporterName: data.reporterName || undefined,
        reporterEmail: data.reporterEmail || undefined,
      });
    });
    onUpdate(reports);
  }, (error) => {
    console.error("Error subscribing to reports from Firestore:", error);
  });
}

// Save a new or existing report
export async function saveReportToFirestore(report: WasteReport) {
  const docRef = doc(db, REPORTS_COLLECTION, report.id);
  // Prepare Firestore-safe object (omit undefined values to prevent crashes)
  const data: Record<string, any> = {
    id: report.id,
    wasteType: report.wasteType,
    eerCode: report.eerCode,
    lat: report.lat,
    lng: report.lng,
    isDangerous: report.isDangerous,
    severity: report.severity,
    status: report.status,
    createdAt: report.createdAt || new Date().toISOString(),
  };

  if (report.photo !== undefined) data.photo = report.photo;
  if (report.description !== undefined) data.description = report.description;
  if (report.notes !== undefined) data.notes = report.notes;
  if (report.cleanupRecommendation !== undefined) data.cleanupRecommendation = report.cleanupRecommendation;
  if (report.reporterName !== undefined) data.reporterName = report.reporterName;
  if (report.reporterEmail !== undefined) data.reporterEmail = report.reporterEmail;

  await setDoc(docRef, data, { merge: true });
}

// Delete a report from Firestore
export async function deleteReportFromFirestore(id: string) {
  const docRef = doc(db, REPORTS_COLLECTION, id);
  await deleteDoc(docRef);
}

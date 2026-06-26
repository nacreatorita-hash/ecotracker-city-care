import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Set up body parser with sufficient limit for base64 images
app.use(express.json({ limit: "15mb" }));

// Lazy init Gemini client to avoid crash if API key is not yet set
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment secrets. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for analyzing waste photo
app.post("/api/waste/analyze", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: "Missing imageBase64 parameter" });
      return;
    }

    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64,
      },
    };

    const promptText = `Analizza questa immagine di rifiuto abbandonato nell'ambiente.
Identifica i tipi di rifiuti visibili e associa il codice EER (Catalogo Europeo dei Rifiuti) corretto o più probabile.
Prediligi codici comuni italiani (es: ingombranti 20 03 07, inerti 17 01 07 o 17 09 04, imballaggi di plastica 15 01 02, RAEE come frigoriferi 20 01 23*, pneumatici 16 01 03).
Specifia se è pericoloso (con l'asterisco * nel codice). Fornisci una descrizione dettagliata in italiano e un livello di confidenza da 0 a 100.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, { text: promptText }],
      config: {
        systemInstruction: "Sei un ispettore ambientale esperto di gestione rifiuti ed esperto nella classificazione secondo il catalogo europeo dei rifiuti (EER / CER) in Italia.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eerCode: {
              type: Type.STRING,
              description: "Il codice EER predetto per il rifiuto, includendo l'eventuale asterisco alla fine se pericoloso (es: '20 03 07', '17 06 05*', '20 01 23*')"
            },
            isDangerous: {
              type: Type.BOOLEAN,
              description: "True se si tratta di rifiuto pericoloso o se il codice contiene l'asterisco, altrimenti False."
            },
            wasteType: {
              type: Type.STRING,
              description: "Nome o tipologia sintetica del rifiuto (es: 'Rifiuti Ingombranti', 'Materiali in amianto (Eternit)', 'Pneumatici fuori uso', 'RAEE - Frigorifero')"
            },
            confidence: {
              type: Type.INTEGER,
              description: "Livello di confidenza dell'identificazione da 0 a 100."
            },
            description: {
              type: Type.STRING,
              description: "Descrizione dettagliata di cosa si vede nella foto, stato di conservazione e impatto visivo."
            },
            cleanupRecommendation: {
              type: Type.STRING,
              description: "Raccomandazione in italiano su come manipolare o raccogliere in sicurezza il rifiuto (es. 'Richiede ditta specializzata con DPI', 'Rimozione standard', 'Non toccare - rischio amianto')."
            }
          },
          required: ["eerCode", "isDangerous", "wasteType", "confidence", "description", "cleanupRecommendation"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No text returned from Gemini API");
    }

    const data = JSON.parse(responseText.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Errore durante l'analisi dell'immagine tramite IA.",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Configure Vite and static serving
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

configureServer().catch(err => {
  console.error("Failed to start full-stack server:", err);
});

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Contacts Timeline AI",
    timestamp: new Date().toISOString(),
    aiAvailable: !!process.env.GEMINI_API_KEY,
  });
});

// AI analysis endpoint: Smart duplicate detection & normalization
app.post("/api/ai/analyze-duplicates", async (req, res) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: "No contacts provided for analysis" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Servicio de IA no disponible (clave API no configurada en el servidor). Usando análisis local.",
      });
    }

    const contactsSummary = contacts.slice(0, 50).map((c: any) => ({
      id: c.id,
      name: `${c.name || ""} ${c.lastName || ""}`.trim(),
      phones: c.phones?.map((p: any) => p.number) || [],
      emails: c.emails?.map((e: any) => e.email) || [],
      company: c.company || "",
      city: c.address?.city || "",
    }));

    const prompt = `Analiza la siguiente lista reducida de contactos de agenda telefónica.
Detecta posibles duplicados sutiles (nombres con diferente ortografía, apodos, mismos números con prefijos distintos o empresas equivalentes).
Devuelve un JSON estrictamente estructurado:
{
  "duplicates": [
    {
      "id1": "string id",
      "id2": "string id",
      "reason": "Explicación breve en español",
      "confidence": number between 0 and 1
    }
  ],
  "normalizationSuggestions": [
    {
      "id": "string id",
      "suggestedName": "Nombre normalizado",
      "detectedCategory": "Trabajo / Amigos / Clientes / etc."
    }
  ]
}

Lista de contactos:
${JSON.stringify(contactsSummary, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("AI analysis error:", error);
    res.status(500).json({ error: error.message || "Error al procesar con IA" });
  }
});

// AI categorization endpoint: Smart organize contacts
app.post("/api/ai/categorize", async (req, res) => {
  try {
    const { contacts, requestPrompt } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: "No hay contactos para categorizar" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Servicio de IA no disponible. Usando sugerencias locales.",
      });
    }

    const contactsSample = contacts.slice(0, 40).map((c: any) => ({
      id: c.id,
      name: `${c.name || ""} ${c.lastName || ""}`.trim(),
      company: c.company || "",
      jobTitle: c.jobTitle || "",
      notes: c.notes || "",
      tags: c.tags || [],
    }));

    const prompt = `El usuario solicita organizar sus contactos: "${requestPrompt || "Organiza mis contactos profesionales y personales"}".
Analiza estos contactos y sugiere etiquetas coherentes (ej: Clientes, Proveedores, Profesionales, Amigos, etc.) con justificación.
Devuelve JSON:
{
  "categories": ["Categoria 1", "Categoria 2", "Categoria 3"],
  "assignments": [
    {
      "contactId": "string id",
      "suggestedTags": ["etiqueta1", "etiqueta2"],
      "explanation": "breve motivo"
    }
  ],
  "summary": "Resumen en español del plan de organización propuesto"
}

Contactos:
${JSON.stringify(contactsSample, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("AI categorization error:", error);
    res.status(500).json({ error: error.message || "Error al categorizar con IA" });
  }
});

// Vite middleware or static serving
async function setupVite() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Contacts Timeline AI server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Critical error starting server:", error);
    process.exit(1);
  }
}

setupVite();

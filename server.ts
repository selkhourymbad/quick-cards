import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import serverless from "serverless-http";

dotenv.config();

export const app = express();
const PORT = 3000;

// Use higher bounds to permit PDF uploads via base64
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Simple health check endpoint for monitoring
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Endpoint to dynamically provide Supabase client config when exported/running fullstack
app.get("/api/supabase-config", (req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  });
});

// Lazy initializer for Gemini client to prevent crash if key is missing (as per Environment Variable guidelines)
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not defined or is placeholder. Please configure it in the Secrets panel in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint to generate flashcards
app.post("/api/generate-cards", async (req, res) => {
  try {
    const { title, notes, file } = req.body;

    if (!notes && !file) {
      return res.status(400).json({ error: "Please provide either typed notes or a study file." });
    }

    const ai = getGeminiClient();

    let contents: any[] = [];

    // If file is provided, attach it as inline data
    if (file && file.data && file.mimeType) {
      contents.push({
        inlineData: {
          data: file.data, // base64 payload strings
          mimeType: file.mimeType,
        },
      });
    }

    // Append instructions and typed notes
    let notesText = notes ? `\n\nStudy Notes:\n${notes}` : "";
    contents.push({
      text: `Turn the provided study notes/document into a comprehensive deck of educational flashcards. Ensure questions focus on core definitions, critical concepts, and key mechanisms in a concise and clear manner. Each flashcard must consist of a unique and factual 'question' and solid, short 'answer'.` + notesText,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are a world-class educational AI assistant. Your output must be a well-structured JSON array representing flashcard questions and answers.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The concise question for the flashcard front.",
              },
              answer: {
                type: Type.STRING,
                description: "A solid, neat answer on the flashcard back.",
              },
            },
            required: ["question", "answer"],
          },
        },
      },
    });

    if (!response || !response.text) {
      throw new Error("Failed to generate flashcards from Gemini.");
    }

    const cards = JSON.parse(response.text.trim());
    return res.json({ title: title || "Generated Deck", cards });
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    return res.status(500).json({ error: error.message || "Internal generation failure." });
  }
});

// Configure Vite middleware or static serving
async function setupVite() {
  let isProduction = process.env.NODE_ENV !== "development";

  if (!isProduction) {
    try {
      console.log("[QuickCards Server] Attempting to start with Vite middleware...");
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("[QuickCards Server] Vite dev middleware mounted.");
    } catch (err) {
      console.warn("[QuickCards Server] Vite dynamic import failed. Falling back to production serving mode.", err);
      isProduction = true;
    }
  }

  if (isProduction) {
    console.log("[QuickCards Server] Starting in production mode...");
    let distPath = path.resolve(process.cwd(), "dist");
    if (typeof __dirname !== "undefined" && fs.existsSync(path.join(__dirname, "index.html"))) {
      distPath = __dirname;
    }
    console.log(`[QuickCards Server] Serving static production files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[QuickCards Server] Ready and listening at http://0.0.0.0:${PORT}`);
  });
}

// Support running as a serverless function or standalone Express server
if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  setupVite().catch((err) => {
    console.error("Vite server initialization failed:", err);
  });
}

export const handler = serverless(app);

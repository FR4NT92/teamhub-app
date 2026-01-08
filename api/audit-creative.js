import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta URL' });

  try {
    // 1. DISFRAZ: Usamos un User-Agent real para que no nos bloqueen
    const siteRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!siteRes.ok) throw new Error(`La web rechazó la conexión (Status: ${siteRes.status})`);

    const htmlText = await siteRes.text();
    
    // Limpieza de texto
    const cleanText = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                              .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .substring(0, 8000);

    // 2. IA
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analiza este contenido de landing page (CRO): ${cleanText}. Dame: 🏆Puntaje(1-10), ✅Lo Bueno, ❌Lo Malo, 💡Acción Inmediata.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.status(200).json({ critique: response.text() });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error leyendo web: " + error.message });
  }
}

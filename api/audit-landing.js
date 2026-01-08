import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta URL' });

  try {
    const siteRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36" }
    });

    if (!siteRes.ok) throw new Error(`No pude acceder a la web (Error ${siteRes.status})`);

    const htmlText = await siteRes.text();
    const cleanText = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "").replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "").replace(/<[^>]+>/g, ' ').substring(0, 8000);

    // USAMOS GEMINI 1.5 FLASH (El modelo Pro viejo da error 404)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Analiza este texto de una landing page (CRO): ${cleanText}. Dame: 🏆Puntaje(1-10), ✅Lo Bueno, ❌Lo Malo, 💡Acción Inmediata.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return res.status(200).json({ critique: response.text() });

  } catch (error) {
    return res.status(500).json({ error: "Error: " + error.message });
  }
}

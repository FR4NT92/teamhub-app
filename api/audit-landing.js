import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Configuración de cabeceras CORS para evitar bloqueos
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta la URL' });

  try {
    // 1. Leemos el contenido de la web (Scraping básico)
    const siteRes = await fetch(url);
    const htmlText = await siteRes.text();
    
    // Limpieza: Quitamos código basura para dejar solo el texto que lee el humano
    const cleanText = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                              .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .substring(0, 8000); // Limitamos caracteres

    // 2. Preguntamos a Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      Actúa como un Experto en CRO (Conversion Rate Optimization).
      Analiza el siguiente contenido extraído de una Landing Page:
      ---
      ${cleanText}
      ---
      
      Dame un diagnóstico CRÍTICO y PROFESIONAL en este formato:
      🏆 **Puntaje de Persuasión:** (1-10)
      ✅ **Lo Bueno:** (2 puntos clave)
      ❌ **Lo Malo:** (2 errores que bajan la conversión)
      💡 **Acción Inmediata:** (Qué cambiarías YA para vender más)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ critique: text });

  } catch (error) {
    return res.status(500).json({ error: "No pude leer la web. " + error.message });
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta URL' });

  try {
    // 1. Escaneamos la web (Scraping básico)
    const siteRes = await fetch(url);
    const htmlText = await siteRes.text();
    
    // Limpiamos el HTML para dejar solo el texto visible (aproximado)
    const cleanText = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                              .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .substring(0, 10000); // Limitamos para no saturar a la IA

    // 2. Consultamos al Experto en Marketing (Gemini)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Actúa como un Experto en CRO (Conversion Rate Optimization) y Copywriting de clase mundial.
      He extraído este contenido de una Landing Page:
      "${cleanText}"

      Analiza la estructura y persuasión. Dame un reporte con este formato exacto:
      
      🏆 **Potencial de Venta:** (Calificación 1-10 y por qué brevemente)
      ✅ **Puntos Fuertes:** (Lista de 2-3 cosas bien hechas)
      ❌ **Errores Críticos:** (Lista de 2-3 errores que matan la venta)
      💡 **Sugerencia de Oro:** (Un cambio específico para vender más ya mismo)

      Sé directo, duro y profesional.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ critique: text });

  } catch (error) {
    return res.status(500).json({ error: "No pude leer la web. Asegúrate de que sea pública. Detalles: " + error.message });
  }
}

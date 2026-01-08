import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { imageBase64, mimeType } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Actúa como un Director Creativo Senior de publicidad.
    Analiza esta imagen (anuncio/diseño) críticamente.
    
    Dame un reporte BREVE (máximo 50 palabras por punto) con:
    1. 🎯 **Impacto Visual:** (1-10) ¿Detiene el scroll?
    2. 📢 **Claridad del Mensaje:** ¿Se entiende qué venden?
    3. 💡 **Mejora Crítica:** Un cambio específico para vender más.
    
    Sé directo y profesional.`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ critique: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

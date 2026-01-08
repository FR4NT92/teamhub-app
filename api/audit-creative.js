import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Configuración de permisos para que la web pueda hablar con el servidor
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { imageBase64, mimeType } = req.body;

  // OJO: Aquí validamos imagen, NO url
  if (!imageBase64) return res.status(400).json({ error: 'Falta la imagen base64' });

  try {
    // Usamos el modelo FLASH que es más rápido y barato
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
        Actúa como un Director Creativo de Publicidad.
        Analiza esta imagen y sé brutalmente honesto.
        
        Responde en este formato:
        🎨 **Impacto Visual:** (1-10)
        📢 **Claridad:** ¿Se entiende qué venden?
        🔧 **Mejora Técnica:** (Ej: "Aumentar contraste", "Texto ilegible")
    `;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    
    return res.status(200).json({ critique: response.text() });
  } catch (error) {
    console.error("Error Creative:", error);
    return res.status(500).json({ error: error.message });
  }
}

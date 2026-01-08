import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { imageBase64, mimeType } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        Actúa como un Director Creativo de Publicidad (Meta Ads / Google Ads).
        Analiza esta imagen y sé brutalmente honesto.
        
        Responde en este formato:
        🎨 **Impacto Visual:** (1-10, ¿frena el scroll?)
        📢 **Claridad:** ¿Se entiende qué venden en menos de 3 segundos?
        🔧 **Mejora Técnica:** (Ej: "Aumentar contraste", "Texto muy pequeño", "Cambiar color de fondo")
    `;

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

export default async function handler(req, res) {
  // 1. Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. Validación de entrada
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Falta la imagen base64' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Falta configuración de API Key en el servidor' });

  try {
    // 3. LLAMADA DIRECTA A LA API (Multimodal)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Actúa como Director Creativo de Publicidad. Analiza esta imagen. Dame un reporte breve: 🎨 Impacto Visual (1-10), 📢 Claridad del Mensaje, 🔧 Mejora Técnica Sugerida." },
            { 
              inline_data: { 
                mime_type: mimeType || "image/jpeg", 
                data: imageBase64 
              } 
            }
          ]
        }]
      })
    });

    const data = await aiRes.json();

    if (data.error) {
      console.error("Gemini Error:", data.error);
      throw new Error(`Error de IA: ${data.error.message}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "La IA no pudo analizar la imagen.";
    return res.status(200).json({ critique: text });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

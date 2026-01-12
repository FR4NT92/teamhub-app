export default async function handler(req, res) {
  // 1. Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. Validación de datos
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No se recibió la imagen. Intenta subirla de nuevo.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Error interno: Falta la API Key en el servidor.' });

  try {
    // 3. LLAMADA A LA IA (Modelo Específico 001)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`;

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Actúa como Director Creativo. Analiza esta imagen publicitaria. Sé crítico. Dame: 🎨 Impacto Visual (1-10), 📢 Claridad del Mensaje, 🔧 Una Mejora Técnica." },
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

    // 4. Manejo de Errores
    if (data.error) {
      console.error("Error de Gemini:", data.error);
      throw new Error(`Google AI rechazo la solicitud: ${data.error.message}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("La IA no pudo analizar la imagen.");

    return res.status(200).json({ critique: text });

  } catch (error) {
    console.error("Server Fault:", error);
    return res.status(500).json({ error: error.message });
  }
}

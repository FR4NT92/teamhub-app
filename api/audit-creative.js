export default async function handler(req, res) {
  // 1. Permisos CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. Validaciones
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No llegó la imagen al servidor.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Error de servidor: Falta API Key.' });

  try {
    // 3. LLAMADA A LA IA (Nombre Técnico Exacto: -latest)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Actúa como Director Creativo. Analiza esta imagen publicitaria. Dame: 🎨 Impacto Visual (1-10), 📢 Claridad del Mensaje, 🔧 Una Mejora Técnica." },
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
      console.error("Gemini Error:", data.error);
      throw new Error(`Google rechazó el modelo: ${data.error.message}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("La IA no pudo analizar la imagen.");

    return res.status(200).json({ critique: text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

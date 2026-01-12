export default async function handler(req, res) {
  // 1. Configuración CORS (Permisos de acceso)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. Validación de entrada
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta URL' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Falta configuración de API Key en el servidor' });

  try {
    // 3. Leer la web (Scraping con User-Agent real)
    const siteRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36" }
    });
    
    if (!siteRes.ok) throw new Error(`Error leyendo la web: ${siteRes.status}`);
    
    const htmlText = await siteRes.text();
    // Limpieza agresiva de código basura
    const cleanText = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                              .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .substring(0, 9000); // Aumentamos un poco el límite

    // 4. LLAMADA DIRECTA A LA API (Bypass de librerías)
    // Usamos el endpoint v1beta que es el más compatible con Flash
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Eres un experto en CRO (Optimización de Conversión). Analiza el texto de esta landing page: "${cleanText}". Dame un reporte con: 🏆 Puntaje (1-10), ✅ Lo Bueno, ❌ Lo Malo, 💡 Acción Inmediata para vender más.` }]
        }]
      })
    });

    const data = await aiRes.json();

    // Manejo de errores de Google
    if (data.error) {
      console.error("Gemini Error:", data.error);
      throw new Error(`Error de IA: ${data.error.message}`);
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "La IA no devolvió texto.";
    return res.status(200).json({ critique: text });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

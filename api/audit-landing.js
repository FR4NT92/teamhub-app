export default async function handler(req, res) {
  // 1. Configuración de Seguridad (CORS) - Para que el navegador no bloquee
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si es una "pregunta" del navegador, respondemos OK y listo
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. Validación de datos
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta la URL para analizar.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Error interno: Falta la API Key en el servidor.' });

  try {
    // 3. Leer la web (Scraping)
    const siteRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36" }
    });
    
    if (!siteRes.ok) throw new Error(`No pude entrar a la web. Código de error: ${siteRes.status}`);
    
    const htmlText = await siteRes.text();
    
    // Limpieza de texto (Sacamos scripts y estilos para ahorrar tokens)
    const cleanText = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                              .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
                              .replace(/<[^>]+>/g, ' ') // Sacar tags HTML
                              .replace(/\s+/g, ' ')     // Sacar espacios extra
                              .substring(0, 10000);     // Límite seguro

    // 4. LLAMADA A LA IA (Modelo Específico 001)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`;

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Actúa como un experto en Marketing Digital y CRO. Analiza el texto de esta landing page: "${cleanText}". Dame un reporte breve y directo con: 🏆 Puntaje (1-10), ✅ Lo Bueno, ❌ Lo Malo, 💡 Acción Inmediata.` }]
        }]
      })
    });

    const data = await aiRes.json();

    // 5. Manejo de Errores de Google
    if (data.error) {
      console.error("Error de Gemini:", data.error);
      // Devolvemos el mensaje exacto de Google para debuggear si hiciera falta
      throw new Error(`Google AI rechazo la solicitud: ${data.error.message}`);
    }
    
    // Extraemos la respuesta
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("La IA respondió pero no generó texto (Bloqueo de seguridad o error vacío).");

    return res.status(200).json({ critique: text });

  } catch (error) {
    console.error("Server Fault:", error);
    return res.status(500).json({ error: error.message });
  }
}

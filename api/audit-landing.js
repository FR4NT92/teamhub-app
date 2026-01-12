export default async function handler(req, res) {
  // CORS: Permisos para que el navegador acepte la respuesta
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta URL' });

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. Leer la web
    const siteRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36" }
    });
    
    if (!siteRes.ok) throw new Error(`Error leyendo la web: ${siteRes.status}`);
    
    const htmlText = await siteRes.text();
    const cleanText = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                              .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
                              .replace(/<[^>]+>/g, ' ')
                              .substring(0, 8000);

    // 2. LLAMADA A GEMINI PRO (Versión 1.0 estable para texto)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Eres experto en Marketing. Analiza esta landing page: "${cleanText}". Dame un reporte: 🏆 Puntaje (1-10), ✅ Lo Bueno, ❌ Lo Malo, 💡 Acción Inmediata.` }]
        }]
      })
    });

    const data = await aiRes.json();

    if (data.error) throw new Error(`Google Error: ${data.error.message}`);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.";
    return res.status(200).json({ critique: text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

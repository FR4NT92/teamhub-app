export default async function handler(req, res) {
  // 1. Configuración de Seguridad (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta URL' });

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // 2. Leemos la web (User Agent de Chrome para no ser bloqueados)
    const siteRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36" }
    });
    
    if (!siteRes.ok) throw new Error("No se pudo leer la web.");
    
    const htmlText = await siteRes.text();
    // Limpieza de texto
    const cleanText = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                              .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
                              .replace(/<[^>]+>/g, ' ')
                              .substring(0, 8000);

    // 3. LLAMADA DIRECTA A GOOGLE (Sin Librerías)
    // Usamos el endpoint v1beta que SIEMPRE tiene los modelos nuevos
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Eres experto en CRO. Analiza esta landing page: ${cleanText}. Dame: 🏆Puntaje(1-10), ✅Lo Bueno, ❌Lo Malo, 💡Acción Inmediata.` }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    
    // Extraemos el texto de la respuesta cruda
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta de IA";
    return res.status(200).json({ critique: text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

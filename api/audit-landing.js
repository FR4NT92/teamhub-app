export default async function handler(req, res) {
  // 1. Permisos para que el navegador no bloquee (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. Validaciones
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta la URL para analizar.' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Error de servidor: Falta API Key.' });

  try {
    // 3. Leer la web (Usamos un "disfraz" de Chrome para que no nos bloqueen)
    const siteRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" }
    });
    
    if (!siteRes.ok) throw new Error(`No pude entrar a la web (Código: ${siteRes.status}).`);
    
    const htmlText = await siteRes.text();
    
    // 4. Limpieza de texto (Quirúrgica)
    const cleanText = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                              .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .substring(0, 8500); // Límite seguro de caracteres

    // 5. LLAMADA A LA IA (Nombre Técnico Exacto: -latest)
    // Usamos este nombre porque tu proyecto no reconoce el alias corto
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Actúa como experto en Marketing y CRO. Analiza este texto de una landing page: "${cleanText}". Dame un reporte breve con: 🏆 Puntaje (1-10), ✅ Lo Bueno, ❌ Lo Malo, 💡 Acción Inmediata.` }]
        }]
      })
    });

    const data = await aiRes.json();

    // 6. Si Google falla, mostramos el error exacto
    if (data.error) {
      console.error("Gemini Error:", data.error);
      throw new Error(`Google rechazó el modelo: ${data.error.message}`);
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("La IA no devolvió respuesta (Bloqueo de seguridad).");

    return res.status(200).json({ critique: text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

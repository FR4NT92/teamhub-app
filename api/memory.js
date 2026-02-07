export default async function handler(req, res) {
  // Permitir CORS para pruebas locales si es necesario
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, client } = req.body;
  const apiKey = process.env.SUPERMEMORY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la API KEY en Vercel (Environment Variables)' });
  }

  try {
    console.log("Enviando a Supermemory...");
    
    // Usamos el endpoint oficial. 
    // NOTA: Si usas la versión self-hosted, cambia la URL. 
    // Si usas la versión cloud, verifica en su doc si es /v1/add o /api/v1/add
    const targetUrl = "https://api.supermemory.ai/v1/add"; 

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        content: text,
        metadata: { client: client || "General" }
      })
    });

    // --- BLOQUE DE DEPURACIÓN ---
    const responseText = await response.text(); // Leemos como texto primero
    console.log("Respuesta Supermemory:", responseText);

    if (!response.ok) {
        // Si falló (404, 401, 500), devolvemos el texto del error
        throw new Error(`Supermemory Error (${response.status}): ${responseText}`);
    }

    // Si todo bien, intentamos parsear JSON
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        // Si devuelve OK pero no es JSON
        data = { message: "Guardado (Respuesta no JSON)", raw: responseText };
    }

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error("Error Backend:", error);
    return res.status(500).json({ error: error.message });
  }
}

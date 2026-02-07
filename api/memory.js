export default async function handler(req, res) {
  // 1. Solo permitimos solicitudes POST (enviar datos)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Obtenemos los datos que enviaste desde el Frontend
  const { text, client } = req.body;
  
  // 3. Obtenemos la llave secreta de Vercel
  const apiKey = process.env.SUPERMEMORY_API_KEY;

  // 4. Validación de seguridad
  if (!apiKey) {
    return res.status(500).json({ error: 'Server Error: Falta configurar SUPERMEMORY_API_KEY en Vercel.' });
  }

  try {
    // 5. Enviamos el dato a Supermemory.ai
    const response = await fetch("https://api.supermemory.ai/v1/add", {
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

    const data = await response.json();

    // 6. Respondemos al Frontend
    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// api/memory.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { text, client } = req.body;
  const apiKey = process.env.SUPERMEMORY_API_KEY; // Necesitas esta key en Vercel

  if (!apiKey) return res.status(500).json({ error: 'Falta configuración de memoria' });

  try {
    // Esta es la llamada REAL a Supermemory para guardar el dato
    const response = await fetch("https://api.supermemory.ai/v1/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        content: text,
        metadata: { client: client || "General" } // Etiquetamos el recuerdo
      })
    });

    const data = await response.json();
    return res.status(200).json({ success: true, id: data.id });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

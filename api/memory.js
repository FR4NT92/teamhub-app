// api/memory.js
export default async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { text, client } = req.body;
  const apiKey = process.env.SUPERMEMORY_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'Server Error: Falta API Key de Supermemory' });

  try {
    // Llamada a Supermemory
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
    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

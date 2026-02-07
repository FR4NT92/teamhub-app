export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { text, client } = req.body;
  const apiKey = process.env.MEM0_API_KEY; // Usamos la nueva clave

  if (!apiKey) return res.status(500).json({ error: 'Falta MEM0_API_KEY en Vercel' });

  try {
    console.log("Guardando en Mem0 para cliente:", client);

    const response = await fetch("https://api.mem0.ai/v1/memories/", {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: text }
        ],
        user_id: client || "General" // Esto separa la memoria por cliente automáticamente
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Mem0 Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error("Error Memory:", error);
    return res.status(500).json({ error: error.message });
  }
}

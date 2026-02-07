export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const openaiKey = process.env.OPENAI_API_KEY;
  const supermemoryKey = process.env.SUPERMEMORY_API_KEY; // ¡Nueva Variable!

  if (!openaiKey) return res.status(500).json({ error: 'Server Error: OpenAI Key missing' });

  const { message, context, model = "gpt-3.5-turbo" } = req.body;

  try {
    let systemPrompt = context;

    // 🧠 LÓGICA SUPERMEMORY (Si hay clave configurada)
    if (supermemoryKey) {
      try {
        console.log("Consultando Supermemory...");
        const memoryRes = await fetch("https://api.supermemory.ai/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supermemoryKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ query: message, top_k: 3 })
        });
        
        if (memoryRes.ok) {
          const memories = await memoryRes.json();
          // Asumimos que la respuesta tiene un array de resultados
          const memoryText = memories.results ? memories.results.map(m => m.content).join("\n---\n") : "";
          
          if (memoryText) {
            systemPrompt += `\n\nINFORMACIÓN DE LA BASE DE CONOCIMIENTO (SOPs/HISTORIAL):\n${memoryText}\nUsa esta información para responder con precisión.`;
          }
        }
      } catch (memError) {
        console.error("Error consultando memoria:", memError);
        // No fallamos todo, solo ignoramos la memoria si falla
      }
    }

    // 🤖 LLAMADA A OPENAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const openaiKey = process.env.OPENAI_API_KEY;
  const mem0Key = process.env.MEM0_API_KEY;

  if (!openaiKey) return res.status(500).json({ error: 'Falta OpenAI Key' });

  const { message, context, model = "gpt-3.5-turbo" } = req.body;

  try {
    let finalSystemPrompt = context || "Eres Alfred, un asistente experto en marketing.";

    // --- 1. BUSCAR MEMORIA EN MEM0 ---
    if (mem0Key) {
      try {
        // Buscamos memorias relevantes para el mensaje del usuario
        const searchRes = await fetch("https://api.mem0.ai/v1/memories/search/", {
          method: "POST",
          headers: {
            "Authorization": `Token ${mem0Key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query: message,
            user_id: "General", // Opcional: podrías pasar el cliente actual si lo tuvieras en el contexto
            top_k: 3
          })
        });

        if (searchRes.ok) {
          const memories = await searchRes.json();
          // Mem0 devuelve un array de objetos. Extraemos el campo 'memory'
          const retrievedText = memories.map(m => m.memory).join("\n- ");
          
          if (retrievedText) {
            finalSystemPrompt += `\n\n[MEMORIA A LARGO PLAZO RECUPERADA]:\n- ${retrievedText}\n\nUsa esta información para personalizar tu respuesta.`;
          }
        }
      } catch (e) {
        console.warn("Error leyendo memoria:", e);
      }
    }

    // --- 2. GENERAR RESPUESTA CON OPENAI ---
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: finalSystemPrompt },
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

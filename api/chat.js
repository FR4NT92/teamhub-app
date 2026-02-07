export default async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const openaiKey = process.env.OPENAI_API_KEY;
  const supermemoryKey = process.env.SUPERMEMORY_API_KEY;

  if (!openaiKey) return res.status(500).json({ error: 'Server Error: OpenAI Key missing' });

  const { message, context, model = "gpt-3.5-turbo" } = req.body;

  try {
    let finalSystemPrompt = context || "Eres Alfred, un asistente experto.";

    // 🧠 1. INTENTAR RECORDAR (Consultar Supermemory)
    // Solo si la clave existe en Vercel
    if (supermemoryKey) {
      try {
        console.log("🔍 Consultando Supermemory...");
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
          // Extraemos el texto de los resultados (ajustar según la respuesta exacta de Supermemory)
          const retrievedText = memories.results ? memories.results.map(m => m.content).join("\n---\n") : "";
          
          if (retrievedText) {
            console.log("✅ Memoria encontrada");
            finalSystemPrompt += `\n\n[MEMORIA RECUPERADA DE LA BASE DE DATOS]:\n${retrievedText}\n\nUsa esta información para responder si es relevante.`;
          }
        }
      } catch (memError) {
        console.warn("⚠️ Fallo al consultar memoria (se continuará sin ella):", memError.message);
      }
    }

    // 🤖 2. PENSAR (Consultar OpenAI)
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

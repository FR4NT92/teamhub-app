// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const openaiKey = process.env.OPENAI_API_KEY;
  const supermemoryKey = process.env.SUPERMEMORY_API_KEY;

  if (!openaiKey) return res.status(500).json({ error: 'Server Error: OpenAI Key missing' });

  const { message, context, model = "gpt-3.5-turbo" } = req.body;

  try {
    let finalSystemPrompt = context || "Eres Alfred, un asistente experto.";

    // --- PASO 1: CONSULTAR MEMORIA (Si hay clave) ---
    if (supermemoryKey) {
      try {
        console.log("🔍 Consultando cerebro...");
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
          // Ajustar según la respuesta de Supermemory (a veces es .results, a veces directo)
          const results = memories.results || memories; 
          const retrievedText = Array.isArray(results) ? results.map(m => m.content).join("\n---\n") : "";
          
          if (retrievedText) {
            finalSystemPrompt += `\n\n[DATOS RECUPERADOS DE MEMORIA]:\n${retrievedText}\n\nUsa esto para responder.`;
          }
        }
      } catch (e) {
        console.warn("Memoria falló, ignorando...", e);
      }
    }

    // --- PASO 2: LLAMAR A GPT ---
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

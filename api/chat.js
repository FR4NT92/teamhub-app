// api/chat.js (Concepto)
export default async function handler(req, res) {
  // ... validaciones ...
  const { message } = req.body;

  // 1. Preguntar a Supermemory (El Cerebro)
  // "Busca en mis documentos información relevante para este mensaje"
  const memoryResponse = await fetch("https://api.supermemory.ai/v1/search", {
    method: "POST",
    headers: { 
        "Authorization": `Bearer ${process.env.SUPERMEMORY_KEY}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: message, top_k: 3 }) 
  });
  
  const memories = await memoryResponse.json();
  const contextText = memories.map(m => m.content).join("\n---\n");

  // 2. Inyectar esa memoria en OpenAI
  const systemPrompt = `
    Eres Alfred, el COO de Abundance OS.
    Usa ESTA INFORMACIÓN RECUPERADA de nuestra base de conocimientos para responder:
    ${contextText}
    
    Si la información no está ahí, usa tu conocimiento general pero avisa que no es un dato interno.
  `;

  // 3. Llamar a OpenAI con el contexto enriquecido
  // ... (Tu código actual de OpenAI) ...
}
    // 3. El servidor llama a OpenAI (Aquí sí es seguro usar la llave)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: context },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // 4. Devolvemos la respuesta limpia al Frontend
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

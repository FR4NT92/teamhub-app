export default async function handler(req, res) {
  // 1. Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Recuperamos la llave segura desde Vercel
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Error: API Key missing' });
  }

  const { message, context } = req.body;

  try {
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

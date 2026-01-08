import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { text } = req.body;

  try {
    // Configuramos a Alfred para que actúe como Project Manager
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Actúa como un Project Manager experto de una agencia de marketing de alto nivel.
    Mejora, expande y profesionaliza la siguiente descripción de tarea breve.
    Agrega estructura, puntos clave y un tono profesional.
    Mantenlo conciso (máximo 4 líneas o bullet points).
    
    Texto original: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return res.status(200).json({ text: output });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

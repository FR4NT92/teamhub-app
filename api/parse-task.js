import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { command, clients, team } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Eres el asistente Alfred. Analiza: "${command}".
      
      Datos del sistema:
      - Clientes válidos: ${JSON.stringify(clients)}
      - Equipo: ${JSON.stringify(team)}

      Instrucciones:
      1. Busca si se menciona un CLIENTE de la lista. Si no está EXACTAMENTE en la lista o no se menciona, devuelve null.
      2. Busca un RESPONSABLE del equipo. Si no, "Johans".
      3. Redacta Título y Descripción profesional.

      Responde SOLO este JSON:
      {
        "clientName": "Nombre exacto o null",
        "assignee": "Nombre",
        "title": "Título",
        "description": "Descripción"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

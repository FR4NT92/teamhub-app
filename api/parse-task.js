import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { command, clients, team } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Le enseñamos a Alfred a pensar como un Project Manager
    const prompt = `
      Eres un asistente de gestión de proyectos. Analiza este comando: "${command}".
      
      Datos disponibles:
      - Clientes existentes: ${clients.join(', ')}
      - Equipo: ${team.join(', ')}

      Tu misión:
      1. Identificar el CLIENTE más probable de la lista.
      2. Identificar el RESPONSABLE (si no se menciona, usa "Johans").
      3. Crear un TÍTULO corto y profesional.
      4. Crear una DESCRIPCIÓN detallada y accionable basada en el pedido.

      Responde SOLO con este JSON (sin markdown, sin explicaciones):
      {
        "clientName": "Nombre exacto del cliente encontrado o null",
        "assignee": "Nombre del responsable",
        "title": "Título de la tarea",
        "description": "Descripción profesional"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpieza por si la IA devuelve bloques de código markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

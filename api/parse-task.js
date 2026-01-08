import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { command, clients, team } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Eres un asistente JSON. Analiza la orden: "${command}".
      
      Listas disponibles:
      - Clientes: ${JSON.stringify(clients)}
      - Equipo: ${JSON.stringify(team)}

      REGLAS OBLIGATORIAS:
      1. Si mencionan un cliente parecido a la lista, usa ese nombre EXACTO. Si no, devuelve null.
      2. Si mencionan a alguien del equipo, usa su nombre. Si no, "Johans".
      3. Genera un "title" breve.
      4. Genera una "description" profesional.

      Responde ÚNICAMENTE con este JSON válido (sin markdown):
      {
        "clientName": "Nombre o null",
        "assignee": "Nombre",
        "title": "Titulo de la tarea",
        "description": "Descripcion"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpieza agresiva de Markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonResponse = JSON.parse(text);

    // BLINDAJE: Valores por defecto si la IA falla
    const finalData = {
        clientName: jsonResponse.clientName || null,
        assignee: jsonResponse.assignee || "Johans",
        title: jsonResponse.title || "Nueva Tarea IA",
        description: jsonResponse.description || command // Si falla descripción, usa el comando original
    };

    return res.status(200).json(finalData);
  } catch (error) {
    console.error("Error IA:", error);
    // En caso de catástrofe, devolver un JSON seguro basado en el comando
    return res.status(200).json({
        clientName: null,
        assignee: "Johans",
        title: "Tarea (Revisar)",
        description: command
    });
  }
}

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo POST permitido' });
  }

  const { taskTitle, clientName, assignee } = req.body;

  try {
    // AQUÍ SE ENVÍA EL CORREO REAL
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // Usa este si no tienes dominio propio verificado
      to: 'frantruppa@gmail.com', // ⚠️ CAMBIA ESTO por tu email real para probar
      subject: `🔥 Nueva Tarea: ${clientName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #0d1117; color: #fff;">
          <h2 style="color: #00c7b7;">Nueva Asignación en TeamHub</h2>
          <p>Hola <strong>${assignee}</strong>, se te ha asignado una nueva tarea:</p>
          <div style="background: #161b22; padding: 15px; border-radius: 8px; border: 1px solid #30363d;">
            <h3 style="margin: 0 0 10px 0;">${taskTitle}</h3>
            <p style="margin: 0; color: #8b949e;">Cliente: ${clientName}</p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Ingresa al Dashboard para ver los detalles.</p>
        </div>
      `
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

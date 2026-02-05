export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, taskTitle, assignedBy } = req.body;
  const apiKey = process.env.RESEND_API_KEY;

  if (!to || !taskTitle) {
    return res.status(400).json({ error: 'Faltan datos (email o tarea)' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Abundance OS <onboarding@resend.dev>', // CAMBIA ESTO cuando verifiques tu dominio propio
        to: [to], // El email del empleado
        subject: `⚡ Nueva Tarea Asignada: ${taskTitle}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #333;">Nueva asignación en Abundance</h2>
            <p><strong>${assignedBy}</strong> te ha asignado una nueva tarea:</p>
            <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #3B82F6;">
              ${taskTitle}
            </blockquote>
            <p style="margin-top: 20px;">
              <a href="https://app.abundance.com" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Dashboard</a>
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

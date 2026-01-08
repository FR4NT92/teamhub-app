export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { prompt } = req.body;
  // Usamos un modelo rápido y bueno (Stable Diffusion XL Lightning)
  const MODEL_ID = "stabilityai/sdxl-turbo"; 

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_ID}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) throw new Error("Error en Hugging Face");

    // La API devuelve la imagen binaria (blob), la convertimos a Base64 para el frontend
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;

    return res.status(200).json({ image: dataUri });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

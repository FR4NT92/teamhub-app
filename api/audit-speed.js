export default async function handler(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta URL' });

  try {
    // Usamos la API pública de Google (Mobile Strategy)
    const apiKey = process.env.GEMINI_API_KEY; // Usamos la misma key de Google
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=mobile&category=PERFORMANCE&key=${apiKey}`;
    
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    const score = data.lighthouseResult.categories.performance.score * 100;
    const fcp = data.lighthouseResult.audits['first-contentful-paint'].displayValue;
    const speedIndex = data.lighthouseResult.audits['speed-index'].displayValue;

    return res.status(200).json({ score, fcp, speedIndex });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

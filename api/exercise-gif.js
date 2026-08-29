const { createWorkoutXProvider } = require('../lib/exercise-media-provider');

module.exports = async (request, response) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).end();
  }
  const id = String(request.query.id ?? '');
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return response.status(400).json({ error: 'Identificador inválido.' });
  if (!process.env.WORKOUTX_API_KEY) return response.status(503).json({ error: 'WORKOUTX_NOT_CONFIGURED' });

  try {
    const provider = createWorkoutXProvider({ apiKey: process.env.WORKOUTX_API_KEY });
    const { response: detail, exercise } = await provider.getExercise(id);
    if (!detail.ok) return response.status(502).json({ error: 'GIF indisponível.' });
    const gifUrl = exercise?.gifUrl;
    if (!gifUrl || !String(gifUrl).startsWith('https://')) return response.status(404).json({ error: 'Este exercício não possui GIF demonstrativo.' });
    const media = await fetch(gifUrl, { headers: { 'X-WorkoutX-Key': process.env.WORKOUTX_API_KEY } });
    if (!media.ok) return response.status(502).json({ error: 'Não foi possível carregar a demonstração.' });
    const type = media.headers.get('content-type') || 'image/gif';
    response.setHeader('Content-Type', type);
    response.setHeader('Cache-Control', 'private, no-store');
    return response.status(200).send(Buffer.from(await media.arrayBuffer()));
  } catch {
    return response.status(502).json({ error: 'Não foi possível carregar a demonstração.' });
  }
};

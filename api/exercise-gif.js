const API_BASE = 'https://api.workoutxapp.com/v1';

module.exports = async (request, response) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).end();
  }
  const id = String(request.query.id ?? '');
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return response.status(400).json({ error: 'Identificador inválido.' });
  if (!process.env.WORKOUTX_API_KEY) return response.status(503).json({ error: 'WORKOUTX_NOT_CONFIGURED' });

  try {
    const detail = await fetch(`${API_BASE}/exercises/${encodeURIComponent(id)}`, {
      headers: { 'X-WorkoutX-Key': process.env.WORKOUTX_API_KEY, Accept: 'application/json' }
    });
    if (!detail.ok) return response.status(502).json({ error: 'GIF indisponível.' });
    const exercise = await detail.json();
    const gifUrl = exercise.gifUrl ?? exercise.data?.gifUrl;
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

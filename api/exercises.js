const { createWorkoutXProvider } = require('../lib/exercise-media-provider');

module.exports = async (request, response) => {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  const query = String(request.query.q ?? '').trim();
  if (query.length < 2) return response.status(400).json({ error: 'Digite ao menos 2 caracteres.' });
  if (!process.env.WORKOUTX_API_KEY) {
    return response.status(503).json({ error: 'WORKOUTX_NOT_CONFIGURED', message: 'Conecte a WorkoutX para acessar os GIFs demonstrativos.' });
  }

  try {
    const provider = createWorkoutXProvider({ apiKey: process.env.WORKOUTX_API_KEY });
    const { response: upstream, exercises } = await provider.searchExercises({ query });
    if (upstream.status === 429) return response.status(429).json({ error: 'LIMIT_REACHED', message: 'Limite temporário da biblioteca atingido. Tente novamente em instantes.' });
    if (upstream.status === 401 || upstream.status === 403) return response.status(502).json({ error: 'PROVIDER_ACCESS', message: 'A chave da WorkoutX não permite esta consulta.' });
    if (!upstream.ok) return response.status(502).json({ error: 'PROVIDER_ERROR', message: 'A biblioteca está indisponível agora.' });
    response.setHeader('Cache-Control', 'private, max-age=300');
    return response.status(200).json({ exercises });
  } catch {
    return response.status(502).json({ error: 'PROVIDER_UNAVAILABLE', message: 'Não foi possível consultar a WorkoutX agora.' });
  }
};

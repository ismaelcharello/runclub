const API_BASE = 'https://api.workoutxapp.com/v1';

function asList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.exercises)) return body.exercises;
  return [];
}

function normalize(exercise) {
  return {
    id: String(exercise.id ?? exercise.exerciseId ?? ''),
    name: exercise.name ?? exercise.title ?? 'Movimento sem nome',
    bodyPart: exercise.bodyPart ?? exercise.bodypart ?? null,
    target: exercise.target ?? exercise.primaryMuscles?.[0] ?? null,
    equipment: exercise.equipment ?? null,
    difficulty: exercise.difficulty ?? exercise.effortLevel ?? null,
    instructions: exercise.instructions ?? exercise.steps ?? []
  };
}

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
    const upstream = await fetch(`${API_BASE}/exercises?name=${encodeURIComponent(query)}&limit=16`, {
      headers: { 'X-WorkoutX-Key': process.env.WORKOUTX_API_KEY, Accept: 'application/json' }
    });
    if (upstream.status === 429) return response.status(429).json({ error: 'LIMIT_REACHED', message: 'Limite temporário da biblioteca atingido. Tente novamente em instantes.' });
    if (upstream.status === 401 || upstream.status === 403) return response.status(502).json({ error: 'PROVIDER_ACCESS', message: 'A chave da WorkoutX não permite esta consulta.' });
    if (!upstream.ok) return response.status(502).json({ error: 'PROVIDER_ERROR', message: 'A biblioteca está indisponível agora.' });
    const body = await upstream.json();
    response.setHeader('Cache-Control', 'private, max-age=300');
    return response.status(200).json({ exercises: asList(body).map(normalize).filter((item) => item.id) });
  } catch {
    return response.status(502).json({ error: 'PROVIDER_UNAVAILABLE', message: 'Não foi possível consultar a WorkoutX agora.' });
  }
};

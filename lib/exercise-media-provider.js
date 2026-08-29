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
    instructions: exercise.instructions ?? exercise.steps ?? [],
    gifUrl: exercise.gifUrl ?? exercise.data?.gifUrl ?? null,
    provider: 'workoutx'
  };
}

function createWorkoutXProvider({ apiKey, fetchImpl = fetch } = {}) {
  async function request(path) {
    return fetchImpl(`${API_BASE}${path}`, {
      headers: { 'X-WorkoutX-Key': apiKey, Accept: 'application/json' }
    });
  }

  return {
    async searchExercises({ query, limit = 16 }) {
      const response = await request(`/exercises?name=${encodeURIComponent(query)}&limit=${limit}`);
      const exercises = response.ok ? asList(await response.json()).map(normalize).filter((item) => item.id).map(({ gifUrl, ...item }) => item) : [];
      return { response, exercises };
    },
    async getExercise(externalId) {
      const response = await request(`/exercises/${encodeURIComponent(externalId)}`);
      return { response, exercise: response.ok ? normalize(await response.json()) : null };
    },
    async getExerciseVideos(externalId) {
      const { response, exercise } = await this.getExercise(externalId);
      return { response, videos: exercise?.gifUrl ? [{ id: externalId, type: 'gif', url: exercise.gifUrl }] : [] };
    },
    async getFilters() { return { categories: [], equipment: [], difficulty: [] }; },
    async healthCheck() {
      try {
        const response = await request('/exercises?name=squat&limit=1');
        return { provider: 'workoutx', available: response.ok, status: response.status };
      } catch {
        return { provider: 'workoutx', available: false, status: 0 };
      }
    }
  };
}

module.exports = { createWorkoutXProvider, normalize };

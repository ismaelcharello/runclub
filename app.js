const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const title = document.querySelector('#page-title');
const titles = { inicio: 'Bom dia, Next Level.', atletas: 'Atletas', treinos: 'Planejamento', movimentos: 'Biblioteca de movimentos', rotinas: 'Rotinas guiadas', eventos: 'Eventos', comunidade: 'Comunidade' };

function goTo(view) {
  views.forEach((item) => item.classList.toggle('active-view', item.id === view));
  navItems.forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  title.textContent = titles[view] || 'Pace Orbit';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
navItems.forEach((item) => item.addEventListener('click', () => goTo(item.dataset.view)));
document.querySelectorAll('[data-goto]').forEach((item) => item.addEventListener('click', () => goTo(item.dataset.goto)));
document.querySelector('#open-library').addEventListener('click', () => goTo('movimentos'));

const form = document.querySelector('#exercise-search');
const results = document.querySelector('#results');
const status = document.querySelector('#search-status');
const dialog = document.querySelector('#exercise-dialog');
const detail = document.querySelector('#exercise-detail');

function tags(exercise) {
  return [exercise.bodyPart, exercise.target, exercise.equipment, exercise.difficulty].filter(Boolean).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[char]); }

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const q = document.querySelector('#search-input').value.trim();
  status.textContent = 'Consultando a WorkoutX…'; results.innerHTML = '';
  try {
    const response = await fetch(`/api/exercises?q=${encodeURIComponent(q)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Não foi possível buscar movimentos.');
    if (!payload.exercises.length) { status.textContent = 'Nenhum movimento encontrado nesta busca.'; return; }
    status.textContent = `${payload.exercises.length} resultado(s) reais encontrados. Selecione um para ver a demonstração.`;
    results.innerHTML = payload.exercises.map((exercise) => `<article class="exercise-card"><div><h3>${escapeHtml(exercise.name)}</h3><div class="tags">${tags(exercise)}</div></div><button class="outline open-exercise" data-id="${escapeHtml(exercise.id)}" data-name="${escapeHtml(exercise.name)}">Ver demonstração</button></article>`).join('');
  } catch (error) { status.textContent = error.message; }
});

results.addEventListener('click', (event) => {
  const button = event.target.closest('.open-exercise'); if (!button) return;
  detail.innerHTML = `<div class="dialog-layout"><div><img class="gif" src="/api/exercise-gif?id=${encodeURIComponent(button.dataset.id)}" alt="Demonstração de ${escapeHtml(button.dataset.name)}" /><p class="search-help">Demonstração fornecida pela WorkoutX.</p></div><div><p class="eyebrow">MOVIMENTO PARA CURADORIA</p><h2>${escapeHtml(button.dataset.name)}</h2><p class="muted">Revise esta demonstração antes de incluir em uma rotina para atletas.</p><button class="primary" id="curate" data-id="${escapeHtml(button.dataset.id)}" data-name="${escapeHtml(button.dataset.name)}">Adicionar ao rascunho de rotina</button><p id="curate-status" class="helper"></p></div></div>`;
  detail.querySelector('#curate').addEventListener('click', (curationEvent) => {
    const curateButton = curationEvent.currentTarget;
    const routines = JSON.parse(localStorage.getItem('pace-orbit-routines') || '[]');
    const firstRoutine = routines[0] || { name: 'Rascunho de preparação', type: 'Aquecimento dinâmico', exercises: [] };
    firstRoutine.exercises = [...(firstRoutine.exercises || []), { id: curateButton.dataset.id, name: curateButton.dataset.name, provider: 'workoutx' }];
    localStorage.setItem('pace-orbit-routines', JSON.stringify([firstRoutine, ...routines.slice(1)]));
    document.querySelector('#curate-status').textContent = 'Adicionado ao rascunho. Revise antes de publicar para atletas.';
    renderRoutines();
  });
  dialog.showModal();
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

const routineList = document.querySelector('#routine-list');
function renderRoutines() {
  const routines = JSON.parse(localStorage.getItem('pace-orbit-routines') || '[]');
  routineList.innerHTML = routines.length ? routines.map((routine) => `<div class="exercise-card"><h3>${escapeHtml(routine.name)}</h3><div class="tags"><span class="tag">${escapeHtml(routine.type)}</span><span class="tag">${routine.exercises?.length || 0} movimento(s)</span><span class="tag">Rascunho local</span></div>${routine.exercises?.length ? `<ul class="routine-exercises">${routine.exercises.map((exercise) => `<li>${escapeHtml(exercise.name)}</li>`).join('')}</ul>` : ''}</div>`).join('') : 'Nenhuma rotina salva neste dispositivo.';
}
document.querySelector('#save-routine').addEventListener('click', () => {
  const name = document.querySelector('#routine-name').value.trim(); const type = document.querySelector('#routine-type').value;
  if (!name) { document.querySelector('#routine-name').focus(); return; }
  const routines = JSON.parse(localStorage.getItem('pace-orbit-routines') || '[]');
  routines.unshift({ name, type, exercises: [] }); localStorage.setItem('pace-orbit-routines', JSON.stringify(routines)); document.querySelector('#routine-name').value = ''; renderRoutines();
});
renderRoutines();

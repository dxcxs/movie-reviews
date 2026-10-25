let genre = '';
let timer;
let user = null;
let all = [];
let recent = [];

const isFiltering = () => $('#q').value.trim() || genre || $('#sort').value !== 'rating';

// ---------- hero ----------
function renderHero() {
  const m = all.find(x => x.reviewCount) || all[0];
  const hero = $('#hero');
  if (!m) { hero.hidden = true; return; }
  const isFav = user?.favorites?.includes(m._id);
  const blur = !m.backdropUrl && !!m.posterUrl;   // blur only when we must stretch a poster
  hero.innerHTML = `
    <div class="hero-bg ${blur ? 'img' : ''}" style="${backdropStyle(m)}"></div>
    <div class="hero-body">
      <h1>${esc(m.title)}</h1>
      <div class="hero-meta">
        ${m.reviewCount ? `<span class="rate">★ ${m.avgRating.toFixed(1)}</span>` : ''}
        <span>${year(m.releaseDate)}</span>${m.runtime ? `<span>${fmtRuntime(m.runtime)}</span>` : ''}<span class="tag">${esc(m.genre)}</span>
      </div>
      <p class="desc">${esc(m.description)}</p>
      <div class="hero-actions">
        <a class="btn light" href="/movie.html?id=${m._id}">View details</a>
        <button class="btn ghost" id="heroFav" type="button">${isFav ? '✓ In my list' : '+ My list'}</button>
      </div>
    </div>`;
  $('#heroFav').onclick = async () => {
    if (!user) return (location.href = '/login.html');
    const has = user.favorites.includes(m._id);
    await api('/api/me/favorites/' + m._id, has ? 'DELETE' : 'PUT');
    user.favorites = has ? user.favorites.filter(i => i !== m._id) : [...user.favorites, m._id];
    renderHero();
    renderRows();
  };
}

// ---------- rows ----------
function rowHTML(title, movies) {
  if (!movies.length) return '';
  return `<section class="row-sec"><h2>${esc(title)}</h2>
    <div class="row-wrap">
      <button class="arrow left" type="button" aria-label="Scroll left">‹</button>
      <div class="row">${movies.map(cardHTML).join('')}</div>
      <button class="arrow right" type="button" aria-label="Scroll right">›</button>
    </div></section>`;
}

function renderRows() {
  const byDate = [...all].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  const genres = [...new Set(all.map(m => m.genre))].sort();
  const mine = user ? all.filter(m => user.favorites.includes(m._id)) : [];
  $('#rows').innerHTML =
    rowHTML('Recently viewed', recent) +
    rowHTML('My list', mine) +
    rowHTML('Top rated', all.filter(m => m.reviewCount)) +
    rowHTML('New releases', byDate) +
    genres.map(g => rowHTML(g, all.filter(m => m.genre === g))).join('');
}

$('#rows').addEventListener('click', e => {
  const btn = e.target.closest('.arrow');
  if (!btn) return;
  const row = btn.parentElement.querySelector('.row');
  row.scrollBy({ left: (btn.classList.contains('left') ? -1 : 1) * row.clientWidth * 0.85, behavior: 'smooth' });
});

// ---------- search / filter results ----------
async function refresh() {
  const filtering = isFiltering();
  $('#rows').hidden = filtering;
  $('#hero').hidden = filtering;
  $('#results').hidden = !filtering;
  if (!filtering) return;
  const params = new URLSearchParams({ q: $('#q').value.trim(), genre, sort: $('#sort').value });
  const movies = await api('/api/movies?' + params);
  $('#grid').innerHTML = movies.length
    ? movies.map(cardHTML).join('')
    : '<p class="empty">No movies match. Try another title or choose All genres.</p>';
  $('#count').textContent = `${movies.length} ${movies.length === 1 ? 'result' : 'results'}`;
  window.scrollTo({ top: 0 });
}

function renderChips(genres) {
  const box = $('#chips');
  box.innerHTML = ['All genres', ...genres].map((g, i) =>
    `<button class="chip" type="button" data-genre="${i ? esc(g) : ''}" aria-pressed="${i === 0}">${esc(g)}</button>`).join('');
  box.onclick = e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    genre = chip.dataset.genre;
    box.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === chip));
    refresh();
  };
}

$('#q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(refresh, 250); }); // debounce
$('#sort').addEventListener('change', refresh);

(async () => {
  [user, all, recent] = await Promise.all([initNav(), api('/api/movies?sort=rating'), api('/api/movies/recent').catch(() => [])]);
  renderChips([...new Set(all.map(m => m.genre))].sort());
  renderHero();
  renderRows();
})();

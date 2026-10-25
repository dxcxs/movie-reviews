let editingId = null;
const dlg = $('#dlg');

// ---------- tabs ----------
$('#tabs').addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b === t));
  ['dashboard', 'movies', 'reviews', 'users'].forEach(id => ($('#' + id).hidden = id !== t.dataset.tab));
  ({ dashboard: loadDashboard, movies: loadMovies, reviews: loadReviews, users: loadUsers })[t.dataset.tab]();
});

// ---------- movies ----------
async function loadMovies() {
  const movies = await api('/api/movies?sort=title');
  $('#movieCount').textContent = `${movies.length} movies`;
  $('#movieRows').innerHTML = movies.map(m => `<tr>
    <td><a href="/movie.html?id=${m._id}">${esc(m.title)}</a></td>
    <td>${esc(m.genre)}</td><td>${fmtDate(m.releaseDate)}</td>
    <td>${m.reviewCount ? '★ ' + m.avgRating.toFixed(1) + ` (${m.reviewCount})` : '–'}</td>
    <td class="actions">
      <button class="btn ghost small" data-edit='${esc(JSON.stringify(m))}' type="button">Edit</button>
      <button class="btn danger small" data-del="${m._id}" type="button">Delete</button>
    </td></tr>`).join('');
}

function openForm(m) {
  editingId = m?._id || null;
  $('#dlgTitle').textContent = m ? 'Edit movie' : 'Add movie';
  $('#f_title').value = m?.title || '';
  $('#f_genre').value = m?.genre || '';
  $('#f_date').value = m ? m.releaseDate.slice(0, 10) : '';
  $('#f_poster').value = m?.posterUrl || '';
  $('#f_director').value = m?.director || '';
  $('#f_cast').value = (m?.cast || []).join(', ');
  $('#f_tagline').value = m?.tagline || '';
  $('#f_trailer').value = m?.trailerUrl || '';
  $('#f_backdrop').value = m?.backdropUrl || '';
  $('#f_runtime').value = fmtRuntime(m?.runtime);
  $('#f_desc').value = m?.description || '';
  $('#dlgMsg').textContent = '';
  dlg.showModal();
}
$('#addMovie').onclick = () => openForm();
$('#cancelBtn').onclick = () => dlg.close();

$('#movieForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    title: $('#f_title').value.trim(), genre: $('#f_genre').value.trim(),
    releaseDate: $('#f_date').value, posterUrl: $('#f_poster').value.trim(),
    director: $('#f_director').value.trim(), cast: $('#f_cast').value, tagline: $('#f_tagline').value.trim(),
    trailerUrl: $('#f_trailer').value.trim(),
    backdropUrl: $('#f_backdrop').value.trim(), runtime: $('#f_runtime').value.trim(),
    description: $('#f_desc').value.trim()
  };
  if (!body.title || !body.genre || !body.releaseDate) return ($('#dlgMsg').textContent = 'Title, genre and release date are required.');
  try {
    await api(editingId ? '/api/movies/' + editingId : '/api/movies', editingId ? 'PUT' : 'POST', body);
    dlg.close();
    loadMovies();
  } catch (err) { $('#dlgMsg').textContent = err.message; }
});

$('#movieRows').addEventListener('click', async e => {
  if (e.target.dataset.edit) return openForm(JSON.parse(e.target.dataset.edit));
  if (e.target.dataset.del && confirm('Delete this movie and all its reviews?')) {
    await api('/api/movies/' + e.target.dataset.del, 'DELETE');
    loadMovies();
  }
});

// ---------- reviews ----------
async function loadReviews() {
  const list = await api('/api/admin/reviews');
  $('#reviewRows').innerHTML = list.length ? list.map(r => `<tr>
    <td>${esc(r.movie?.title || 'Removed')}</td><td>${esc(r.user?.username || 'Deleted')}</td>
    <td style="color:var(--star)">${starText(r.rating)}</td><td>${esc(r.comment)}</td>
    <td><button class="btn danger small" data-del="${r._id}" type="button">Delete</button></td></tr>`).join('')
    : '<tr><td colspan="5">No reviews.</td></tr>';
}
$('#reviewRows').addEventListener('click', async e => {
  if (e.target.dataset.del && confirm('Delete this review?')) {
    await api('/api/reviews/' + e.target.dataset.del, 'DELETE');
    loadReviews();
  }
});

// ---------- members ----------
async function loadUsers() {
  const users = await api('/api/admin/users');
  $('#userRows').innerHTML = users.map(u => {
    const self = u._id === me.id;
    return `<tr><td>${esc(u.username)}</td><td>${u.role}</td><td>${fmtDate(u.createdAt)}</td>
      <td class="actions">${self ? '<span class="count">You</span>' : `
        <button class="btn ghost small" data-role="${u._id}" data-to="${u.role === 'admin' ? 'user' : 'admin'}" type="button">
          Make ${u.role === 'admin' ? 'member' : 'admin'}</button>
        <button class="btn danger small" data-del="${u._id}" type="button">Delete</button>`}</td></tr>`;
  }).join('');
}
$('#userRows').addEventListener('click', async e => {
  const d = e.target.dataset;
  if (d.role) { await api(`/api/admin/users/${d.role}/role`, 'PATCH', { role: d.to }); loadUsers(); }
  if (d.del && confirm('Delete this member and their reviews?')) { await api('/api/admin/users/' + d.del, 'DELETE'); loadUsers(); }
});

// ---------- dashboard ----------
const bar = (label, count, max) => `<div class="bar"><span>${esc(label)}</span>
  <div class="track"><i style="width:${(count / max) * 100}%"></i></div><b>${count}</b></div>`;

async function loadDashboard() {
  const d = await api('/api/admin/stats');
  const maxRating = Math.max(1, ...d.ratingDist.map(r => r.count));
  const maxGenre = Math.max(1, ...d.genres.map(g => g.count));
  const list = (items, right) => items.length
    ? `<ol class="rank">${items.map(i => `<li><span>${esc(i.title)}</span><b>${right(i)}</b></li>`).join('')}</ol>`
    : '<p class="count">Nothing yet.</p>';

  $('#dashboard').innerHTML = `
    <div class="stats">
      <div class="stat"><b>${d.movies}</b><span>Movies</span></div>
      <div class="stat"><b>${d.users}</b><span>Members</span></div>
      <div class="stat"><b>${d.reviews}</b><span>Reviews</span></div>
      <div class="stat"><b>${d.avgRating || '–'}</b><span>Average rating</span></div>
    </div>
    <div class="dash-grid">
      <div class="panel"><h2>Ratings given</h2>
        ${[5, 4, 3, 2, 1].map(n => bar(n + ' ★', d.ratingDist.find(r => r._id === n)?.count || 0, maxRating)).join('')}</div>
      <div class="panel"><h2>Movies by genre</h2>
        ${d.genres.map(g => bar(g._id, g.count, maxGenre)).join('')}</div>
      <div class="panel"><h2>Top rated</h2>
        ${list(d.topRated, m => `★ ${m.avgRating.toFixed(1)} (${m.reviewCount})`)}</div>
      <div class="panel"><h2>Most favorited</h2>
        ${list(d.mostFavorited, m => m.count + ' ♥')}</div>
    </div>`;
}

let me;
initNav().then(u => { me = u; loadDashboard(); });

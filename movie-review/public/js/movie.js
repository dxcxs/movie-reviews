const movieId = new URLSearchParams(location.search).get('id');
let movie, user, reviews = [], myReview = null, rating = 0;

async function loadAll() {
  try {
    [movie, reviews] = await Promise.all([
      api('/api/movies/' + movieId),
      api(`/api/movies/${movieId}/reviews`)
    ]);
  } catch (e) {
    $('#detail').innerHTML = '<p class="empty" style="padding:40px 0">Movie not found. <a href="/">Back to all movies</a></p>';
    $('#revTitle').hidden = true;
    return;
  }
  myReview = user ? reviews.find(r => r.user && r.user._id === user.id) : null;
  document.title = movie.title + ' - Marquee';
  renderDetail();
  renderInfo();
  renderForm();
  renderReviews();
  renderSimilar();
}

function renderDetail() {
  const isFav = user?.favorites?.includes(movie._id);
  const hasTrailer = !!movie.trailerUrl;
  $('#detail').innerHTML = `
    <section class="hero detail-hero">
      <div class="hero-bg ${!movie.backdropUrl && movie.posterUrl ? 'img' : ''}" style="${backdropStyle(movie)}"></div>
      <div class="hero-body">
        <h1>${esc(movie.title)}</h1>
        ${movie.tagline ? `<p class="tagline">${esc(movie.tagline)}</p>` : ''}
        <div class="hero-meta">
          <span class="rate">★ ${movie.reviewCount ? movie.avgRating.toFixed(1) : '–'}</span>
          <span>${movie.reviewCount} ${movie.reviewCount === 1 ? 'review' : 'reviews'}</span>
          <span>${fmtDate(movie.releaseDate)}</span>${movie.runtime ? `<span>${fmtRuntime(movie.runtime)}</span>` : ''}<span class="tag">${esc(movie.genre)}</span>
        </div>
        <p class="desc">${esc(movie.description) || 'No description yet.'}</p>
        ${movie.director ? `<p class="credits"><span>Director</span>${esc(movie.director)}</p>` : ''}
        ${movie.cast?.length ? `<p class="credits"><span>Starring</span>${movie.cast.slice(0, 4).map(esc).join(', ')}</p>` : ''}
        <div class="hero-actions">
          ${hasTrailer ? `<button class="btn light" id="trailerBtn" type="button">▶ Watch trailer</button>` : ''}
          <a class="btn ${hasTrailer ? 'ghost' : 'light'}" href="#formBox">Rate this movie</a>
          <button class="btn ghost" id="favBtn" type="button" aria-pressed="${!!isFav}">${isFav ? '✓ In my list' : '+ My list'}</button>
        </div>
        <p class="msg" id="favMsg"></p>
      </div>
    </section>`;
  $('#favBtn').onclick = toggleFavorite;
  if (hasTrailer) $('#trailerBtn').onclick = openTrailer;
}

function openTrailer() {
  const url = movie.trailerUrl;
  const id = youtubeId(url);
  if (id) {            // YouTube link -> embedded player
    $('#trailerBox').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1"
      title="Trailer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  } else if (isVideoFile(url)) {   // your own file, e.g. /videos/inception.mp4 -> <video> player
    $('#trailerBox').innerHTML = `<video src="${esc(url)}" controls autoplay playsinline></video>`;
  } else {
    return window.open(url, '_blank', 'noopener');   // any other link: open it
  }
  $('#trailerDlg').showModal();
}
$('#trailerDlg').addEventListener('close', () => { $('#trailerBox').innerHTML = ''; });   // stops the video
$('#trailerDlg').addEventListener('click', e => { if (e.target === e.currentTarget || e.target.classList.contains('close')) e.currentTarget.close(); });

function renderInfo() {
  const rows = [['Director', movie.director], ['Genre', movie.genre], ['Release date', fmtDate(movie.releaseDate)], ['Runtime', fmtRuntime(movie.runtime)]]
    .filter(r => r[1]);
  $('#info').innerHTML = `<section class="section about"><h2>About</h2><div class="panel">
    <dl class="facts-grid">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    ${movie.cast?.length ? `<h3>Cast</h3><div class="chips">${movie.cast.map(c => `<span class="chip static">${esc(c)}</span>`).join('')}</div>` : ''}
  </div></section>`;
}

async function renderSimilar() {
  const list = (await api('/api/movies?sort=rating&genre=' + encodeURIComponent(movie.genre))).filter(m => m._id !== movie._id);
  $('#similar').innerHTML = list.length ? `<section class="row-sec"><h2>More like this</h2>
    <div class="row-wrap">
      <button class="arrow left" type="button" aria-label="Scroll left">‹</button>
      <div class="row">${list.map(cardHTML).join('')}</div>
      <button class="arrow right" type="button" aria-label="Scroll right">›</button>
    </div></section>` : '';
}
bindRowArrows($('#similar'));

async function toggleFavorite() {
  if (!user) return (location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search));
  const isFav = user.favorites.includes(movie._id);
  try {
    await api('/api/me/favorites/' + movie._id, isFav ? 'DELETE' : 'PUT');
    user.favorites = isFav ? user.favorites.filter(id => id !== movie._id) : [...user.favorites, movie._id];
    renderDetail();
  } catch (e) { $('#favMsg').textContent = e.message; }
}

function renderForm() {
  const box = $('#formBox');
  if (!user) {
    box.innerHTML = `<div class="panel"><a href="/login.html?next=${encodeURIComponent(location.pathname + location.search)}">Log in</a> to rate and review this movie.</div>`;
    return;
  }
  rating = myReview ? myReview.rating : 0;
  box.innerHTML = `
    <form class="panel" id="reviewForm" novalidate>
      <strong>${myReview ? 'Edit your review' : 'Write a review'}</strong>
      <div class="stars-input" id="stars" role="radiogroup" aria-label="Your rating">
        ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" role="radio" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`).join('')}
      </div>
      <label for="comment">Your thoughts (optional)</label>
      <textarea id="comment" maxlength="2000">${esc(myReview?.comment || '')}</textarea>
      <p class="msg" id="formMsg" role="alert"></p>
      <button class="btn" type="submit">${myReview ? 'Save changes' : 'Post review'}</button>
    </form>`;
  paintStars();
  $('#stars').onclick = e => {
    const b = e.target.closest('button');
    if (b) { rating = +b.dataset.n; paintStars(); }
  };
  $('#reviewForm').onsubmit = submitReview;
}

function paintStars() {
  document.querySelectorAll('#stars button').forEach(b => {
    b.classList.toggle('on', +b.dataset.n <= rating);
    b.setAttribute('aria-checked', +b.dataset.n === rating);
  });
}

async function submitReview(e) {
  e.preventDefault();
  const msg = $('#formMsg');
  if (!rating) return (msg.textContent = 'Pick a star rating first.');
  const body = { rating, comment: $('#comment').value };
  try {
    if (myReview) await api('/api/reviews/' + myReview._id, 'PUT', body);   // edit
    else await api(`/api/movies/${movieId}/reviews`, 'POST', body);          // create
    await loadAll();
  } catch (err) { msg.textContent = err.message; }
}

function renderReviews() {
  $('#reviews').innerHTML = reviews.length ? reviews.map(r => {
    const mine = user && r.user && r.user._id === user.id;
    const canDelete = mine || user?.role === 'admin';
    return `<article class="review">
      <header><span class="name">${esc(r.user?.username || 'Deleted user')}</span>
        <span class="stars" aria-label="${r.rating} out of 5">${starText(r.rating)}</span>
        <time datetime="${r.createdAt}">${fmtDate(r.createdAt)}</time></header>
      ${r.comment ? `<p>${esc(r.comment)}</p>` : ''}
      ${canDelete ? `<button class="btn danger small" data-del="${r._id}" type="button">Delete</button>` : ''}
    </article>`;
  }).join('') : '<p class="empty">No reviews yet. Be the first to share what you thought.</p>';
}

$('#reviews').addEventListener('click', async e => {
  const id = e.target.dataset.del;
  if (!id || !confirm('Delete this review?')) return;
  await api('/api/reviews/' + id, 'DELETE');
  loadAll();
});

initNav().then(u => { user = u; loadAll(); });

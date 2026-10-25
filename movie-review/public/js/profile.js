async function load() {
  const [favs, reviews] = await Promise.all([api('/api/me/favorites'), api('/api/me/reviews')]);
  $('#favs').innerHTML = favs.length ? favs.map(cardHTML).join('')
    : '<p class="empty">No favorites yet. Open a movie and press Add to favorites.</p>';
  $('#myReviews').innerHTML = reviews.length ? reviews.map(r => `<tr>
      <td><a href="/movie.html?id=${r.movie?._id}">${esc(r.movie?.title || 'Removed movie')}</a></td>
      <td class="stars" style="color:var(--star)">${starText(r.rating)}</td>
      <td>${esc(r.comment)}</td>
      <td>${fmtDate(r.createdAt)}</td>
      <td><button class="btn danger small" data-del="${r._id}" type="button">Delete</button></td>
    </tr>`).join('') : '<tr><td colspan="5">You have not reviewed any movies yet.</td></tr>';
}

$('#myReviews').addEventListener('click', async e => {
  const id = e.target.dataset.del;
  if (!id || !confirm('Delete this review?')) return;
  await api('/api/reviews/' + id, 'DELETE');
  load();
});

initNav().then(u => {
  if (!u) return (location.href = '/login.html?next=/profile.html');
  load();
});

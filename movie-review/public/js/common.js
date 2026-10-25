// ---------- helpers shared by every page ----------
async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const year = d => d ? new Date(d).getFullYear() : '';
const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtRuntime = v => {
  v = String(v ?? '').trim();
  if (!v || v === '0') return '';
  if (/^\d+$/.test(v)) { const n = +v; return n >= 60 ? `${Math.floor(n / 60)}h ${String(n % 60).padStart(2, '0')}m` : `${n}m`; }
  return v;   // already text like "1h 30m"
};
const starText = n => '★'.repeat(n) + '☆'.repeat(5 - n);

// ---------- theme (stored in a cookie by the server) ----------
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
document.documentElement.dataset.theme = getCookie('theme') || 'dark';

async function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  await api('/api/theme', 'POST', { theme: next });
  updateThemeButton();
}
function updateThemeButton() {
  const b = $('#themeBtn');
  if (b) b.textContent = document.documentElement.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode';
}

// ---------- nav ----------
let currentUser = null;
async function initNav() {
  currentUser = await api('/api/auth/me').catch(() => null);
  const u = currentUser;
  $('#nav').innerHTML = `
    <a href="/">Home</a>
    ${u ? `<a href="/profile.html">My list</a>` : ''}
    ${u?.role === 'admin' ? `<a href="/admin.html">Admin</a>` : ''}
    <button id="themeBtn" type="button"></button>
    ${u ? `<span class="who">${esc(u.username)}</span><button id="logoutBtn" type="button">Log out</button>`
        : `<a class="btn" href="/login.html">Log in</a>`}`;
  updateThemeButton();
  $('#themeBtn').onclick = toggleTheme;
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const lo = $('#logoutBtn');
  if (lo) lo.onclick = async () => { await api('/api/auth/logout', 'POST'); location.href = '/'; };
  return currentUser;
}

// ---------- movie poster + card ----------
function hue(title) {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
function posterHTML(m) {
  const badge = m.reviewCount ? `<span class="badge">★ ${m.avgRating.toFixed(1)}</span>` : '';
  if (m.posterUrl)
    return `<div class="poster"><img src="${esc(m.posterUrl)}" alt="Poster of ${esc(m.title)}" loading="lazy">${badge}</div>`;
  const h = hue(m.title);
  return `<div class="poster ph" style="background:linear-gradient(160deg,hsl(${h} 45% 34%),hsl(${(h + 50) % 360} 50% 16%))">
    <span>${esc(m.title)}</span>${badge}</div>`;
}
function cardHTML(m) {
  return `<a class="card" href="/movie.html?id=${m._id}">
    ${posterHTML(m)}
    <h3>${esc(m.title)}</h3>
    <div class="sub"><span>${esc(m.genre)}</span><span>${year(m.releaseDate)}</span></div>
  </a>`;
}

function backdropStyle(m) {
  const src = m.backdropUrl || m.posterUrl;   // wide image first, poster as fallback
  if (src) {
    const u = encodeURI(src).replace(/'/g, '%27').replace(/"/g, '%22');
    return `background-image:url('${u}')`;
  }
  const h = hue(m.title);
  return `background:linear-gradient(120deg,hsl(${h} 55% 30%),hsl(${(h + 60) % 360} 55% 9%))`;
}

// YouTube link -> video id (watch?v=, youtu.be/, /embed/, /shorts/)
function youtubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}
// left/right arrows on a row of cards
function bindRowArrows(container) {
  container.addEventListener('click', e => {
    const btn = e.target.closest('.arrow');
    if (!btn) return;
    const row = btn.parentElement.querySelector('.row');
    row.scrollBy({ left: (btn.classList.contains('left') ? -1 : 1) * row.clientWidth * 0.85, behavior: 'smooth' });
  });
}

// direct video file (self-hosted): .mp4 / .webm / .ogg
const isVideoFile = url => /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url || ''));

let mode = 'login';

function setMode(m) {
  mode = m;
  $('#tabLogin').setAttribute('aria-selected', m === 'login');
  $('#tabRegister').setAttribute('aria-selected', m === 'register');
  $('#confirmBox').hidden = m === 'login';
  $('#submit').textContent = m === 'login' ? 'Log in' : 'Create account';
  $('#msg').textContent = '';
}
$('#tabLogin').onclick = () => setMode('login');
$('#tabRegister').onclick = () => setMode('register');

$('#form').addEventListener('submit', async e => {
  e.preventDefault();
  const username = $('#username').value.trim();
  const password = $('#password').value;
  const msg = $('#msg');

  // client-side validation
  if (username.length < 3) return (msg.textContent = 'Username needs at least 3 characters.');
  if (password.length < 6) return (msg.textContent = 'Password needs at least 6 characters.');
  if (mode === 'register' && password !== $('#confirm').value) return (msg.textContent = 'Passwords do not match.');

  try {
    await api(mode === 'login' ? '/api/auth/login' : '/api/auth/register', 'POST', { username, password });
    const next = new URLSearchParams(location.search).get('next');
    location.href = next && next.startsWith('/') ? next : '/';
  } catch (err) {
    msg.textContent = err.message;
  }
});

initNav();

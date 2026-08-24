const message = document.getElementById('message');
function showMessage(text, error = true) { message.textContent = text; message.className = `message ${error ? 'error' : ''}`; }
async function submitAuth(url, form) {
  const data = Object.fromEntries(new FormData(form));
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong.');
  return result;
}
const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', async (event) => { event.preventDefault(); try { await submitAuth('/api/auth/login', loginForm); location.href = '/'; } catch (error) { showMessage(error.message); } });
const registerForm = document.getElementById('registerForm');
if (registerForm) registerForm.addEventListener('submit', async (event) => { event.preventDefault(); try { await submitAuth('/api/auth/register', registerForm); location.href = '/'; } catch (error) { showMessage(error.message); } });

const apiBase = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const msgErro = document.getElementById('msgErro');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgErro.textContent = '';

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

    try {
      const res = await axios.post(`${apiBase}/login`, { email, senha }, { withCredentials: true });
      const token = res.data.accessToken;
      localStorage.setItem('token', token);

      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Erro no login:', err);
      msgErro.textContent = err.response?.data?.erro || 'Falha na autenticação';
    }
  });
});

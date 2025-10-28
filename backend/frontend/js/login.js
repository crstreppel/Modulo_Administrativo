// frontend/js/login.js
// 🧙‍♂️ Padrão Bruxônico v2.1 – Empatia com Segurança™
// -------------------------------------------------------------
// - Verificação de e-mail instantânea
// - Mensagens humanizadas (email inexistente / senha incorreta)
// - Animação suave PBQE no campo com erro
// -------------------------------------------------------------

const apiBase = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const msgErro = document.getElementById('msgErro');

  // =============================================================
  // 💌 Verificação imediata de e-mail
  // =============================================================
  emailInput.addEventListener('blur', async () => {
    const email = emailInput.value.trim();
    msgErro.textContent = '';
    if (!email) return;

    try {
      const res = await axios.post(`${apiBase}/check-email`, { email });
      if (!res.data.existe) {
        mostrarMsgHumana('Opa, esse e-mail não tá no sistema 😅 Corrige aí, por favor.');
        emailInput.classList.add('input-erro');
      } else {
        emailInput.classList.remove('input-erro');
      }
    } catch (err) {
      console.warn('[login.js] Erro ao verificar e-mail:', err);
    }
  });

  // =============================================================
  // 🔑 Submissão do formulário
  // =============================================================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgErro.textContent = '';
    emailInput.classList.remove('input-erro');
    senhaInput.classList.remove('input-erro');

    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();

    if (!email || !senha) {
      mostrarMsgHumana('Preenche os dois campos pra continuar 😉');
      return;
    }

    try {
      const res = await axios.post(`${apiBase}/login`, { email, senha }, { withCredentials: true });
      const token = res.data.accessToken;
      if (token) {
        localStorage.setItem('token', token);
        console.log(`[PBQE] ✅ Login bem-sucedido: ${email}`);
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      const erro = err.response?.data?.erro || '';
      console.warn('[login.js] Falha no login:', erro);

      if (erro === 'email_invalido') {
        mostrarMsgHumana('Opa, esse e-mail não tá no sistema 😅');
        emailInput.classList.add('input-erro');
      } else if (erro === 'senha_incorreta') {
        mostrarMsgHumana('Senha incorreta 😬 Dá mais uma conferida aí.');
        senhaInput.classList.add('input-erro');
      } else if (erro === 'usuario_bloqueado') {
        mostrarMsgHumana('Tua conta foi bloqueada temporariamente ⏳. Tenta de novo mais tarde.');
      } else {
        mostrarMsgHumana('Opa, problema de conexão. Tenta de novo rapidinho.');
      }
    }
  });

  // =============================================================
  // 💬 Mensagens humanizadas
  // =============================================================
  function mostrarMsgHumana(texto) {
    try {
      msgErro.textContent = texto;
      msgErro.style.color = '#d9534f';
      msgErro.style.fontWeight = '500';
      msgErro.style.marginTop = '8px';
      msgErro.style.opacity = '1';
    } catch (e) {
      console.log('[MSG HUMANA FALLBACK]', texto);
    }
  }
});

// frontend/js/utilsAuth.js
// 🧙‍♂️ Utilitários de Autenticação – PBQE v2.1 "Segurança Fluida™"
// ---------------------------------------------------------------
// - Usa localStorage (fluidez entre abas)
// - Logout sincronizado entre abas
// - Feedback humano e logs consistentes
// ---------------------------------------------------------------

const API_BASE = 'http://localhost:3000/api/auth';

// =============================================================
// 📦 Armazenamento do token (localStorage com sincronismo entre abas)
// =============================================================
function saveToken(token) {
  localStorage.setItem('token', token);
  console.log('[DBG utilsAuth] 💾 Token salvo no localStorage');
}

function getToken() {
  console.log('[DBG utilsAuth] 🔎 getToken() — lendo localStorage...');
  const token = localStorage.getItem('token');
  console.log(`[DBG utilsAuth] 🔎 getToken() — token ${token ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
  return token;
}

function clearToken() {
  localStorage.removeItem('token');
  console.log('[DBG utilsAuth] 🧹 Token removido do localStorage');
  // 🔁 dispara evento global para sincronizar logout entre abas
  localStorage.setItem('logout_sync', Date.now().toString());
}

// =============================================================
// 🧠 Login
// =============================================================
async function login(email, senha) {
  try {
    console.log('[DBG utilsAuth] ▶ login() — enviando requisição /login');
    const response = await axios.post(`${API_BASE}/login`, { email, senha });
    if (response.data && response.data.accessToken) {
      saveToken(response.data.accessToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[DBG utilsAuth] ❌ Erro no login:', error);
    const msg = error.response?.data?.erro || 'Opa, confere teu e-mail ou senha, algo parece fora do lugar 😉';
    mostrarMsgHumana(msg);
    return false;
  }
}

// =============================================================
// 🔁 Refresh Token
// =============================================================
async function refreshToken() {
  try {
    console.log('[DBG utilsAuth] 🔁 refreshToken() — iniciando /refresh');
    const response = await axios.post(`${API_BASE}/refresh`, {}, { withCredentials: true });

    if (response.data && response.data.accessToken) {
      saveToken(response.data.accessToken);
      console.log('[DBG utilsAuth] ✅ refreshToken() — sucesso, novo token salvo');
      return response.data.accessToken;
    } else {
      console.warn('[DBG utilsAuth] ⚠ refreshToken() — resposta sem token');
      return null;
    }
  } catch (error) {
    console.error('[DBG utilsAuth] ❌ refreshToken() — erro:', error);
    return null;
  }
}

// =============================================================
// 🧭 Verificação de sessão
// =============================================================
async function checkAuth() {
  console.log('[DBG utilsAuth] ▶ checkAuth() — início');
  const token = getToken();
  if (!token) {
    console.warn('[DBG utilsAuth] ⚠ Nenhum token encontrado.');
    return null;
  }

  try {
    const response = await axios.get(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('[DBG utilsAuth] ✅ Sessão válida.');
    return response.data;
  } catch (error) {
    console.warn('[DBG utilsAuth] ⚠ Sessão inválida, tentando refresh...');
    const newToken = await refreshToken();

    if (newToken) {
      try {
        const response2 = await axios.get(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        console.log('[DBG utilsAuth] ✅ Sessão revalidada com novo token');
        return response2.data;
      } catch (error2) {
        console.error('[DBG utilsAuth] ❌ checkAuth() — refresh falhou:', error2.message);
        return null;
      }
    } else {
      console.error('[DBG utilsAuth] ❌ refreshToken() — não conseguiu novo token');
      return null;
    }
  }
}

// =============================================================
// 🚪 Logout
// =============================================================
async function logout() {
  try {
    console.log('[DBG utilsAuth] 🚪 logout() — chamando /logout');
    await axios.post(`${API_BASE}/logout`, {}, { withCredentials: true });
  } catch (error) {
    console.warn('[DBG utilsAuth] ⚠ logout() — erro:', error.message);
  } finally {
    clearToken();
    window.location.href = 'login.html';
  }
}

// =============================================================
// 💬 Mensagens humanizadas
// =============================================================
function mostrarMsgHumana(texto) {
  try {
    const div = document.createElement('div');
    div.textContent = texto;
    Object.assign(div.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#323232',
      color: '#fff',
      padding: '10px 18px',
      borderRadius: '8px',
      fontSize: '14px',
      zIndex: '9999',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    });
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
  } catch (e) {
    console.log('[MSG HUMANA FALLBACK]', texto);
  }
}

// =============================================================
// 🔁 Listener global de logout entre abas
// =============================================================
window.addEventListener('storage', (event) => {
  if (event.key === 'logout_sync') {
    console.log('[PBQE Segurança Fluida] Logout detectado em outra aba — redirecionando...');
    window.location.href = 'login.html';
  }
});

// =============================================================
// Exporta para uso global
// =============================================================
window.utilsAuth = { login, logout, checkAuth, getToken, saveToken, clearToken };

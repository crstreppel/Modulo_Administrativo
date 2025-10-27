// frontend/js/dashboard.js
// 🧙‍♂️ Padrão Bruxão V1 – Dashboard PBQE v2.1 "Segurança Fluida™"
// ---------------------------------------------------------------
// - Sessão persistente entre abas
// - Logout sincronizado globalmente
// - Feedback humano e logs consistentes
// ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  const userName = document.getElementById('userName');
  const btnLogout = document.getElementById('btnLogout');
  const dbgMode = true;

  function dbg(msg) {
    if (dbgMode) console.log('[DBG dashboard]', msg);
  }

  // 🧩 Listener de logout vindo de outra aba
  window.addEventListener('storage', (event) => {
    if (event.key === 'logout_sync') {
      dbg('Logout detectado em outra aba — encerrando sessão local.');
      mensagemHumana('Sessão encerrada em outra aba. Até logo!');
      setTimeout(() => (window.location.href = 'login.html'), 600);
    }
  });

  // 🕐 Estado inicial
  if (userName) userName.textContent = 'Verificando sessão...';
  dbg('DOM carregado — iniciando verificação de sessão.');

  try {
    dbg('Chamando checkAuth() do utilsAuth...');
    const user = await window.utilsAuth.checkAuth();

    dbg(`checkAuth() retornou: ${user ? JSON.stringify({ nome: user.nome, role: user.role }) : 'null'}`);

    if (user && user.nome) {
      const papel = user.role || 'usuário';
      if (userName) userName.textContent = `${user.nome} (${papel})`;
      dbg(`✅ Sessão ativa: ${user.nome} (${papel})`);
    } else {
      dbg('⚠️ Nenhum usuário autenticado. Redirecionando...');
      mensagemHumana('Tua sessão expirou, entra de novo rapidinho 😉');
      setTimeout(() => (window.location.href = 'login.html'), 800);
    }
  } catch (err) {
    dbg(`❌ Erro inesperado ao validar sessão: ${err?.message || err}`);
    mensagemHumana('Opa, algo deu errado. Faz login de novo, por favor.');
    setTimeout(() => (window.location.href = 'login.html'), 800);
  }

  // 🚪 Logout manual
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      dbg('Botão Logout clicado — iniciando logout()...');
      btnLogout.disabled = true;
      btnLogout.textContent = 'Saindo...';
      try {
        await window.utilsAuth.logout();
      } catch (e) {
        dbg(`⚠️ Erro durante logout: ${e?.message || e}`);
        mensagemHumana('Erro ao sair, mas pode fechar a aba tranquilo 😉');
        window.location.href = 'login.html';
      }
    });
  } else {
    dbg('⚠️ Botão #btnLogout não encontrado no DOM.');
  }

  // =============================================================
  // 💬 Mensagens humanizadas e discretas
  // =============================================================
  function mensagemHumana(texto) {
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
});

/* =============================================================
 * Arquivo: dashboard_loader.js
 * -------------------------------------------------------------
 * PBQE-C™ v2.6.4 + Hot DOM Binding™ 🧙‍♂️
 * Correção modular e logs inteligentes
 * -------------------------------------------------------------
 * - Corrige caminho de módulos (ex: Fornecedores)
 * - Adiciona fallback para 404
 * - Mantém compatibilidade com a dashboard PBQE-C
 * ============================================================= */

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🧩 [PBQE-C] Dashboard V2 carregada com sucesso.', 'color:#00b894');

  const menu = document.querySelector('.menu-lateral');
  const conteudo = document.getElementById('conteudo-principal');
  const loader = document.getElementById('loading');
  const btnLogout = document.getElementById('btnLogout');

  if (!menu || !conteudo || !loader) {
    console.error('❌ [PBQE-C] Elementos principais da dashboard não encontrados.');
    return;
  }

  loader.classList.add('hidden');

  // === Clique no menu lateral ===
  menu.addEventListener('click', async (e) => {
    if (e.target.tagName === 'LI') {
      const caminho = e.target.dataset.modulo?.trim();
      if (!caminho) return;
      await carregarModulo(caminho);
    }
  });

  // === Logout (temporário) ===
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      alert('Sessão encerrada. Até logo!');
      window.location.href = '/login.html';
    });
  }

  // =============================================================
  // 🧠 Função principal — Carrega módulos dinamicamente
  // =============================================================
  async function carregarModulo(caminho) {
    try {
      mostrarLoading(true);

      // 🔧 Correção PBQE-C v2.6.4 — caminho absoluto modular
      let urlFinal = caminho.startsWith('/')
        ? caminho
        : `/${caminho}`;

      // Ajuste automático para o módulo Fornecedores
      if (urlFinal.includes('fornecedores')) {
        urlFinal = '/modules/fornecedores/frontend/cad_fornecedor.html';
      }

      console.log(`%c🔄 [PBQE-C] Carregando módulo: ${urlFinal}`, 'color:#0984e3');

      const resposta = await fetch(urlFinal);
      if (!resposta.ok) {
        throw new Error(`Falha ao carregar módulo (${resposta.status})`);
      }

      const html = await resposta.text();
      conteudo.innerHTML = html;
      console.log(`%c✅ [PBQE-C] Módulo ${urlFinal} carregado com sucesso.`, 'color:#00cec9');

      // === Reexecutar scripts da página carregada ===
      const scripts = conteudo.querySelectorAll('script');
      for (const oldScript of scripts) {
        const novo = document.createElement('script');

        if (oldScript.src) {
          novo.src = oldScript.src.startsWith('http')
            ? oldScript.src
            : oldScript.src.startsWith('/')
              ? oldScript.src
              : `${window.location.origin}/${oldScript.src.replace(/^(\.\/)?/, '')}`;
          novo.async = false;
        } else {
          novo.textContent = oldScript.textContent;
        }

        novo.onload = () =>
          console.log(`⚙️ [PBQE-C] Script executado: ${oldScript.src || 'inline'}`);

        document.body.appendChild(novo);
      }

      // === Dispara evento DOMContentLoaded após scripts ===
      setTimeout(() => {
        console.log('%c🚀 [PBQE-C] Disparando evento DOMContentLoaded manual.', 'color:#6c5ce7');
        const evento = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
        document.dispatchEvent(evento);

        if (typeof window.salvarFornecedor === 'function') {
          console.log('%c🔗 [PBQE-C] Função salvarFornecedor detectada e pronta.', 'color:#55efc4');
        } else {
          console.warn('%c⚠️ [PBQE-C] salvarFornecedor ainda não detectada.', 'color:#fab1a0');
        }
      }, 600);

      console.log('%c🧠 [PBQE-C] Todos os scripts recarregados e ativos.', 'color:#74b9ff');
    } catch (err) {
      console.error('❌ [PBQE-C] Erro ao carregar módulo:', err);

      conteudo.innerHTML = `
        <div class="erro-modulo" style="padding:40px;text-align:center;color:#d63031">
          <h2>⚠️ Erro ao carregar módulo</h2>
          <p>${err.message}</p>
          <p style="margin-top:10px;font-size:13px;color:#636e72">
            Caminho tentado: <code>${caminho}</code>
          </p>
          <button style="margin-top:20px;padding:10px 20px;border:none;border-radius:6px;
            background:#0984e3;color:#fff;cursor:pointer" onclick="window.location.reload()">
            🔁 Recarregar Dashboard
          </button>
        </div>`;
    } finally {
      mostrarLoading(false);
    }
  }

  // =============================================================
  // 🎡 Controle visual do loading
  // =============================================================
  function mostrarLoading(exibir) {
    loader.classList.toggle('hidden', !exibir);
  }
});

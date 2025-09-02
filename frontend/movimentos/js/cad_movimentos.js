// cad_movimentos.js (v2.8.2 - regra de data futura bloqueia envio)
(() => {
  'use strict';

  // Evita duplicidade se o script for injetado/rodado mais de uma vez
  if (window.__cadMovimentosInit) {
    console.warn('[cad_movimentos] já inicializado. Ignorando segundo carregamento.');
    return;
  }
  window.__cadMovimentosInit = true;

  // Base da API local ao módulo (pode sobrescrever via window.API_BASE_URL)
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';

  // Helpers DOM seguros
  const $id = (x) => document.getElementById(x);
  const setVal = (id, v) => { const el = $id(id); if (el) el.value = v; };
  const getVal = (id) => { const el = $id(id); return el ? el.value : ''; };
  const enable = (id, on = true) => { const el = $id(id); if (el) el.disabled = !on; };
  const show = (id) => { const el = $id(id); if (el) el.style.display = ''; };
  const hide = (id) => { const el = $id(id); if (el) el.style.display = 'none'; };
  const fmtMoney = (n) => (Number(n) || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  // cache dos registros de preço por id
  const PRECO_BY_ID = new Map();

  function hojeISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,10);
  }

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      // Data padrão = hoje
      const inLanc = $id('data_lancamento');
      if (inLanc && !inLanc.value) inLanc.value = hojeISO();

      // Carregamentos base (usa utils.js se existir; senão, fallback)
      await carregarClientesSafe();
      await carregarServicosSafe();
      await carregarCondicoesSafe();
      await carregarMeiosPagamentoSafe();
      await carregarStatusSafe();

      // Eventos
      const cliente = $id('cliente');
      const pet = $id('pet');
      const servico = $id('servico');
      const cond = $id('condicaoPagamento');
      const tabelaSel = $id('tabelaDePrecos');
      const form = $id('formCadastroMovimento');
      const cbKeep = $id('manter-data-lancamento');
      const hint = $id('hint-data-lancamento');

      if (cliente) cliente.addEventListener('change', onClienteChange);
      if (pet) { pet.addEventListener('change', tryLoadTabelas); pet.disabled = true; }
      if (servico) servico.addEventListener('change', tryLoadTabelas);
      if (tabelaSel) tabelaSel.addEventListener('change', onSelecionarTabela);
      if (cond) { cond.addEventListener('change', atualizarUImeioPagamento); atualizarUImeioPagamento(); }
      if (form) form.addEventListener('submit', onSubmit);

      // UX do checkbox
      if (cbKeep && hint) {
        cbKeep.addEventListener('change', () => {
          hint.textContent = cbKeep.checked
            ? 'Marcado: a data informada será enviada ao backend.'
            : 'Desmarcado: a data do servidor (hoje) será gravada.';
        });
      }

      // Avisos para datas retroativas/futuras
      if (inLanc) {
        inLanc.addEventListener('change', () => {
          const v = inLanc.value;
          const hoje = hojeISO();
          const msg = $id('msg-data-lancamento');
          if (!msg) return;

          if (v && v < hoje) {
            msg.textContent = 'Atenção: a data de lançamento é anterior a hoje. Será pedida confirmação no envio.';
            msg.classList.remove('hidden');
          } else if (v && v > hoje) {
            msg.textContent = 'Atenção: data futura não é aceita. O envio será bloqueado.';
            msg.classList.remove('hidden');
          } else {
            msg.classList.add('hidden');
          }
        });
      }

      wireModal();
    } catch (err) {
      console.error('Falha na inicialização do módulo Movimentos:', err);
      alert('Erro ao carregar página de Movimentos.');
    }
  }

  /* ===================== Carregamentos ===================== */

  async function carregarClientesSafe() {
    if (typeof carregarClientes === 'function') return carregarClientes();
    const sel = $id('cliente'); if (!sel) return;
    const { data } = await axios.get(`${API_BASE_URL}/clientes`);
    fillSelect(sel, data, 'nome', 'Selecione o cliente');
  }

  async function carregarServicosSafe() {
    if (typeof carregarServicosSelect === 'function') return carregarServicosSelect('#servico');
    const sel = $id('servico'); if (!sel) return;
    const { data } = await axios.get(`${API_BASE_URL}/servicos`);
    fillSelect(sel, data, 'descricao', 'Selecione o serviço');
  }

  async function carregarCondicoesSafe() {
    if (typeof carregarCondicoesPagamentoSelect === 'function') return carregarCondicoesPagamentoSelect('#condicaoPagamento');
    const sel = $id('condicaoPagamento'); if (!sel) return;
    const { data } = await axios.get(`${API_BASE_URL}/condicoes-de-pagamento`);
    fillSelect(sel, data, 'descricao', 'Selecione a condição de pagamento');
  }

  async function carregarMeiosPagamentoSafe() {
    if (typeof carregarMeiosPagamentoSelect === 'function') return carregarMeiosPagamentoSelect('#meioPagamento');
    const sel = $id('meioPagamento'); if (!sel) return;
    const { data } = await axios.get(`${API_BASE_URL}/meios-de-pagamento`);
    fillSelect(sel, data, 'descricao', 'Selecione o meio');
  }

  async function carregarStatusSafe() {
    if (typeof carregarStatusSelect === 'function') return carregarStatusSelect('#status');
    const sel = $id('status'); if (!sel) return;
    const { data } = await axios.get(`${API_BASE_URL}/status`);
    fillSelect(sel, data, 'descricao', 'Selecione o status');
  }

  function fillSelect(selectEl, items, labelProp, placeholder = 'Selecione...') {
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    for (const it of items) {
      const opt = new Option(it[labelProp] ?? `ID: ${it.id}`, it.id);
      selectEl.add(opt);
    }
  }

  /* ===================== Cliente/Pet ===================== */

  async function onClienteChange() {
    const clienteId = getVal('cliente');
    const petSel = $id('pet');
    if (!petSel) return;
    petSel.innerHTML = `<option value="">Selecione o pet</option>`;
    enable('pet', false);
    if (!clienteId) return;

    try {
      const { data } = await axios.get(`${API_BASE_URL}/pets`, { params: { clienteId } });
      fillSelect(petSel, data, 'nome', 'Selecione o pet');
      enable('pet', true);
    } catch (err) {
      console.error('Erro ao carregar pets do cliente:', err);
      alert('Erro ao carregar pets do cliente.');
    }
  }

  /* ===================== Tabela de Preços ===================== */

  async function tryLoadTabelas() {
    const petId = getVal('pet');
    const servicoId = getVal('servico');
    const tabelaSel = $id('tabelaDePrecos');

    if (!tabelaSel) return;
    tabelaSel.innerHTML = `<option value="">Selecione um pet e serviço primeiro</option>`;
    enable('tabelaDePrecos', false);
    setVal('tabelaDePrecosId', '');
    if (!petId || !servicoId) return;

    try {
      const { data: resultados } = await axios.get(
        `${API_BASE_URL}/tabela-de-precos/buscarPorPetOuRaca`,
        { params: { petId, servicoId } }
      );

      PRECO_BY_ID.clear();

      if (!Array.isArray(resultados) || resultados.length === 0) {
        openModalCriarTabela(petId, servicoId);
        return;
      }

      tabelaSel.innerHTML = `<option value="">Selecione uma tabela</option>`;
      for (const tb of resultados) {
        PRECO_BY_ID.set(tb.id, tb);
        const origem = tb.pet ? `PET: ${tb.pet?.nome}` : tb.raca ? `RAÇA: ${tb.raca?.descricao}` : 'N/A';
        const cond = tb.condicaoDePagamento?.descricao || `Cond. ${tb.condicaoDePagamentoId || tb.condicaoPagamentoId}`;
        const label = `${cond} • ${fmtMoney(tb.valorServico)} • ${origem}`;
        const opt = new Option(label, tb.id);
        tabelaSel.add(opt);
      }
      enable('tabelaDePrecos', true);

      if (resultados.length === 1) {
        tabelaSel.value = resultados[0].id;
        onSelecionarTabela();
      }

    } catch (err) {
      console.error('Erro ao carregar tabelas de preços:', err);
      alert('Erro ao buscar tabela de preços.');
    }
  }

  function onSelecionarTabela() {
    const id = Number(getVal('tabelaDePrecos'));
    const tb = PRECO_BY_ID.get(id);
    if (!tb) return;

    setVal('valor', tb.valorServico);
    setVal('tabelaDePrecosId', tb.id);

    // Condição
    const condSel = $id('condicaoPagamento');
    if (condSel) {
      const condId = tb.condicaoDePagamentoId || tb.condicaoPagamentoId;
      if (condId) condSel.value = String(condId);
    }

    // Meio de pagamento (se vier no registro)
    const meioSel = $id('meioPagamento');
    if (meioSel) {
      const meioId = tb.meioDePagamentoId || tb.meioPagamentoId;
      if (meioId) meioSel.value = String(meioId);
    }

    atualizarUImeioPagamento();
  }

  /* ===================== UI/Regras: Meio de Pagamento e Status ===================== */

  function atualizarUImeioPagamento() {
    const cond = Number(getVal('condicaoPagamento'));
    const wrapper = $id('wrapper-meioPagamento');
    const meioSel = $id('meioPagamento');
    const statusSel = $id('status');

    if (wrapper && meioSel) {
      if (cond === 1 || cond === 3) {
        show('wrapper-meioPagamento');
        meioSel.removeAttribute('disabled');
        meioSel.setAttribute('required', 'required');
      } else {
        hide('wrapper-meioPagamento');
        meioSel.value = '';
        meioSel.setAttribute('disabled', 'disabled');
        meioSel.removeAttribute('required');
      }
    }

    if (statusSel && (cond === 1 || cond === 3)) {
      statusSel.value = '5';
    }
  }

  /* ===================== Modal Criar Tabela ===================== */

  function wireModal() {
    const modal = $id('modal-confirmacao');
    if (!modal) return;
    const btnPet = $id('criarParaPet');
    const btnRaca = $id('criarParaRaca');
    const btnCancel = $id('cancelarCriacao');

    if (btnPet) btnPet.addEventListener('click', () => { closeModal(); alert('Abra o módulo Tabela de Preços para criar para o PET.'); });
    if (btnRaca) btnRaca.addEventListener('click', () => { closeModal(); alert('Abra o módulo Tabela de Preços para criar para a RAÇA.'); });
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
  }

  function openModalCriarTabela(petId, servicoId) {
    const modal = $id('modal-confirmacao');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.dataset.petId = petId;
    modal.dataset.servicoId = servicoId;
  }

  function closeModal() {
    const modal = $id('modal-confirmacao');
    if (!modal) return;
    modal.style.display = 'none';
    delete modal.dataset.petId;
    delete modal.dataset.servicoId;
  }

  /* ===================== Submit ===================== */

  async function onSubmit(e) {
    e.preventDefault();

    const hoje = hojeISO();
    const manterData = !!$id('manter-data-lancamento')?.checked;

    const data_lancamento = getVal('data_lancamento');
    const clienteId = Number(getVal('cliente'));
    const petId = Number(getVal('pet'));
    const servicoId = Number(getVal('servico'));
    const tabelaDePrecosId = Number(getVal('tabelaDePrecosId')) || null;
    const condicaoPagamentoId = Number(getVal('condicaoPagamento'));
    const valor = Number(getVal('valor'));
    const meioPagamentoId = Number(getVal('meioPagamento')) || null;

    let statusId = Number(getVal('status')) || null;
    if (condicaoPagamentoId === 1 || condicaoPagamentoId === 3) {
      statusId = 5;
      setVal('status', '5');
    }

    if (manterData && !data_lancamento) {
      alert('Informe a Data do Lançamento ou desmarque "Manter a data informada".');
      return;
    }
    if (!clienteId || !petId || !servicoId || !condicaoPagamentoId || !valor) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    if ((condicaoPagamentoId === 1 || condicaoPagamentoId === 3) && !meioPagamentoId) {
      alert('Para À VISTA ou ADIANTAMENTO, selecione o meio de pagamento.');
      return;
    }

    // --- Regras de data ---
    const isRetroativa = !!data_lancamento && data_lancamento < hoje;
    const isFutura     = !!data_lancamento && data_lancamento > hoje;

    if (isFutura) {
      // NOVO: data futura bloqueia o envio por completo
      alert('Data futura não é aceita. O movimento NÃO foi gravado.');
      return;
    }

    if (isRetroativa) {
      // Retroativa sempre pergunta confirmação (com ou sem caixinha marcada)
      const ok = window.confirm('A data do lançamento é anterior a hoje. Deseja lançar com a data informada?');
      if (!ok) return;
      // Envia a data retroativa
      payloadSetData(data_lancamento);
    } else {
      // Data igual a hoje: pode enviar sem payload.data_lancamento (server grava hoje)
      if (manterData && data_lancamento) {
        // Se quiser persistir explicitamente, também é ok
        payloadSetData(data_lancamento);
      }
    }

    // Monta payload base
    const payload = buildPayloadBase({
      clienteId, petId, servicoId, tabelaDePrecosId,
      condicaoPagamentoId, valor, statusId, meioPagamentoId
    });

    try {
      const { data } = await axios.post(`${API_BASE_URL}/movimentos`, payload);
      alert('Movimento salvo com sucesso!');
      console.log('Movimento criado:', data);

      // reset
      $id('formCadastroMovimento')?.reset();

      // restaura selects e estados
      const petSel = $id('pet');
      if (petSel) { petSel.innerHTML = `<option value="">Selecione o pet</option>`; petSel.disabled = true; }
      const tabSel = $id('tabelaDePrecos');
      if (tabSel) { tabSel.innerHTML = `<option value="">Selecione um pet e serviço primeiro</option>`; tabSel.disabled = true; }
      setVal('tabelaDePrecosId', '');
      atualizarUImeioPagamento();

      // restaura data e checkbox
      const inLanc = $id('data_lancamento');
      if (inLanc) inLanc.value = hoje;
      const cb = $id('manter-data-lancamento');
      if (cb) cb.checked = false;

      // limpa aviso de data
      const msg = $id('msg-data-lancamento');
      if (msg) msg.classList.add('hidden');

    } catch (err) {
      console.error('Erro ao salvar movimento:', err);
      const msg = err?.response?.data?.erro || err?.message || 'Erro ao salvar movimento.';
      alert(msg);
    }

    // Helpers locais do onSubmit
    function payloadSetData(dateISO) {
      // injeta/atualiza a data dentro do payload que será enviado
      // (vamos construir o payload no final; aqui armazenamos de forma temporária)
      _pendingData = dateISO;
    }
  }

  // variável para carregar data_lancamento confirmada (se houver)
  let _pendingData = null;

  function buildPayloadBase({ clienteId, petId, servicoId, tabelaDePrecosId, condicaoPagamentoId, valor, statusId, meioPagamentoId }) {
    const payload = { clienteId, petId, servicoId, tabelaDePrecosId, condicaoPagamentoId, valor, statusId };
    if (condicaoPagamentoId === 1 || condicaoPagamentoId === 3) payload.meioPagamentoId = meioPagamentoId;
    if (_pendingData) payload.data_lancamento = _pendingData;
    // limpa após uso
    _pendingData = null;
    return payload;
  }

})();

// cad_movimentos.js (v2.11.1 - Fluxo visual saldo adiantamento + submit completo)
// - Mostra saldo disponível quando cond=3 e meio=3
// - Mantém lógica de submit + liquidação à vista
// - Padrão bruxão de excelência 🧙‍♂️

(() => {
  'use strict';

  if (window.__cadMovimentosInit) {
    console.warn('[cad_movimentos] já inicializado. Ignorando segundo carregamento.');
    return;
  }
  window.__cadMovimentosInit = true;

  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';

  const CONDICAO_AVISTA = 1;
  const CONDICAO_ADIANTAMENTO = 3;
  const STATUS_ABERTO = 2;
  const STATUS_LIQUIDADO = 5;

  const $id = (x) => document.getElementById(x);
  const setVal = (id, v) => { const el = $id(id); if (el) el.value = v; };
  const getVal = (id) => { const el = $id(id); return el ? el.value : ''; };
  const enable = (id, on = true) => { const el = $id(id); if (el) el.disabled = !on; };
  const show = (id) => { const el = $id(id); if (el) el.style.display = ''; };
  const hide = (id) => { const el = $id(id); if (el) el.style.display = 'none'; };
  const fmtMoney = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  const PRECO_BY_ID = new Map();
  let _pendingData = null;

  function hojeISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,10);
  }

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const inLanc = $id('data_lancamento');
      if (inLanc && !inLanc.value) inLanc.value = hojeISO();

      await carregarClientesSafe();
      await carregarServicosSafe();
      await carregarCondicoesSafe();
      await carregarMeiosPagamentoSafe();
      await carregarStatusSafe();

      const cliente = $id('cliente');
      const pet = $id('pet');
      const servico = $id('servico');
      const cond = $id('condicaoPagamento');
      const meio = $id('meioPagamento');
      const tabelaSel = $id('tabelaDePrecos');
      const form = $id('formCadastroMovimento');

      if (cliente) cliente.addEventListener('change', onClienteChange);
      if (pet) { pet.addEventListener('change', onPetChange); pet.disabled = true; }
      if (servico) servico.addEventListener('change', tryLoadTabelas);
      if (tabelaSel) tabelaSel.addEventListener('change', onSelecionarTabela);
      if (cond) cond.addEventListener('change', atualizarUImeioPagamento);
      if (meio) meio.addEventListener('change', atualizarUImeioPagamento);
      if (form) form.addEventListener('submit', onSubmit);

      wireModalCriarTabela();
      montarAreaSaldoAdiantamento();
    } catch (err) {
      console.error('Falha na inicialização do módulo Movimentos:', err);
      alert('Erro ao carregar página de Movimentos.');
    }
  }

  /* ===================== Área visual de saldo ===================== */
  function montarAreaSaldoAdiantamento() {
    const valorEl = $id('valor');
    if (!valorEl) return;

    const div = document.createElement('div');
    div.id = 'saldo-adiantamento-info';
    div.style.fontSize = '0.9em';
    div.style.marginTop = '4px';
    div.style.display = 'none';
    valorEl.insertAdjacentElement('afterend', div);

    valorEl.addEventListener('input', atualizarSaldoAdiantamento);
  }

  async function atualizarSaldoAdiantamento() {
    const cond = Number(getVal('condicaoPagamento'));
    const meio = Number(getVal('meioPagamento'));
    const petId = Number(getVal('pet'));
    const info = $id('saldo-adiantamento-info');
    if (!info) return;

    if (cond === CONDICAO_ADIANTAMENTO && meio === CONDICAO_ADIANTAMENTO && petId) {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/movimentos/saldo-adiantamento/${petId}`);
        const saldo = Number(data?.saldo ?? 0);
        const valorMov = Number(getVal('valor') || 0);

        info.style.display = '';
        if (valorMov > saldo) {
          info.textContent = `💰 Saldo disponível: ${fmtMoney(saldo)} (insuficiente para ${fmtMoney(valorMov)})`;
          info.style.color = 'red';
        } else {
          info.textContent = `💰 Saldo disponível: ${fmtMoney(saldo)}`;
          info.style.color = 'green';
        }
      } catch (err) {
        console.error('Erro ao buscar saldo de adiantamento:', err);
        info.style.display = '';
        info.textContent = '⚠️ Não foi possível consultar saldo de adiantamento.';
        info.style.color = 'orange';
      }
    } else {
      info.style.display = 'none';
    }
  }

  function onPetChange() {
    tryLoadTabelas();
    atualizarSaldoAdiantamento();
  }

  /* ===================== Carregamentos base ===================== */
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

    const condSel = $id('condicaoPagamento');
    if (condSel) {
      const condId = tb.condicaoDePagamentoId || tb.condicaoPagamentoId;
      if (condId) condSel.value = String(condId);
    }

    const meioSel = $id('meioPagamento');
    if (meioSel) {
      const meioId = tb.meioDePagamentoId || tb.meioPagamentoId;
      if (meioId) meioSel.value = String(meioId);
    }

    atualizarUImeioPagamento();
  }

  /* ===================== UI/Regras ===================== */
  function atualizarUImeioPagamento() {
    const cond = Number(getVal('condicaoPagamento'));
    const meioSel = $id('meioPagamento');
    const wrapper = $id('wrapper-meioPagamento');
    const statusSel = $id('status');

    if (wrapper && meioSel) {
      if (cond === CONDICAO_AVISTA || cond === CONDICAO_ADIANTAMENTO) {
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

    if (statusSel) {
      if (cond === CONDICAO_ADIANTAMENTO) {
        statusSel.value = String(STATUS_LIQUIDADO);
      } else if (cond === CONDICAO_AVISTA) {
        statusSel.value = String(STATUS_ABERTO);
      }
    }

    atualizarSaldoAdiantamento();
  }

  /* ===================== Modal Criar Tabela ===================== */
  function wireModalCriarTabela() {
    const modal = $id('modal-confirmacao');
    if (!modal) return;
    const btnPet = $id('criarParaPet');
    const btnRaca = $id('criarParaRaca');
    const btnCancel = $id('cancelarCriacao');

    if (btnPet) btnPet.addEventListener('click', () => { closeModalCriarTabela(); alert('Abra o módulo Tabela de Preços para criar para o PET.'); });
    if (btnRaca) btnRaca.addEventListener('click', () => { closeModalCriarTabela(); alert('Abra o módulo Tabela de Preços para criar para a RAÇA.'); });
    if (btnCancel) btnCancel.addEventListener('click', closeModalCriarTabela);
  }

  function openModalCriarTabela(petId, servicoId) {
    const modal = $id('modal-confirmacao');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.dataset.petId = petId;
    modal.dataset.servicoId = servicoId;
  }

  function closeModalCriarTabela() {
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
    if (condicaoPagamentoId === CONDICAO_AVISTA) {
      statusId = STATUS_ABERTO; setVal('status', String(STATUS_ABERTO));
    } else if (condicaoPagamentoId === CONDICAO_ADIANTAMENTO) {
      statusId = STATUS_LIQUIDADO; setVal('status', String(STATUS_LIQUIDADO));
    }

    if (manterData && !data_lancamento) {
      alert('Informe a Data do Lançamento ou desmarque "Manter a data informada".');
      return;
    }
    if (!clienteId || !petId || !servicoId || !condicaoPagamentoId || !valor) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    if ((condicaoPagamentoId === CONDICAO_AVISTA || condicaoPagamentoId === CONDICAO_ADIANTAMENTO) && !meioPagamentoId) {
      alert('Para À VISTA ou ADIANTAMENTO, selecione o meio de pagamento.');
      return;
    }

    const isRetroativa = !!data_lancamento && data_lancamento < hoje;
    const isFutura     = !!data_lancamento && data_lancamento > hoje;

    if (isFutura) {
      alert('Data futura não é aceita. O movimento NÃO foi gravado.');
      return;
    }

    if (isRetroativa) {
      const ok = window.confirm('A data do lançamento é anterior a hoje. Deseja lançar com a data informada?');
      if (!ok) return;
      _pendingData = data_lancamento;
    } else {
      if (manterData && data_lancamento) _pendingData = data_lancamento;
    }

    const payload = {
      clienteId, petId, servicoId, tabelaDePrecosId,
      condicaoPagamentoId, valor, statusId
    };
    if (condicaoPagamentoId === CONDICAO_AVISTA || condicaoPagamentoId === CONDICAO_ADIANTAMENTO) payload.meioPagamentoId = meioPagamentoId;
    if (_pendingData) payload.data_lancamento = _pendingData;
    _pendingData = null;

    try {
      const { data: mov } = await axios.post(`${API_BASE_URL}/movimentos`, payload);
      alert('Movimento salvo com sucesso!');

      if (condicaoPagamentoId === CONDICAO_AVISTA && meioPagamentoId) {
        const meioTexto = $id('meioPagamento')?.selectedOptions?.[0]?.text || '';
        const deseja = await confirmarLiquidacaoModal({ valor, meioTexto });
        if (deseja) {
          try {
            await liquidarTituloDoMovimento({ movimento: mov, meioPagamentoId, valor });
            alert('Título liquidado com sucesso.');
          } catch (errLiquida) {
            const msg = errLiquida?.response?.data?.erro || errLiquida.message || 'Erro inesperado.';
            alert('Não foi possível liquidar agora: ' + msg);
          }
        }
      }

      $id('formCadastroMovimento')?.reset();
      const petSel = $id('pet');
      if (petSel) { petSel.innerHTML = `<option value="">Selecione o pet</option>`; petSel.disabled = true; }
      const tabSel = $id('tabelaDePrecos');
      if (tabSel) { tabSel.innerHTML = `<option value="">Selecione um pet e serviço primeiro</option>`; tabSel.disabled = true; }
      setVal('tabelaDePrecosId', '');
      atualizarUImeioPagamento();

      const inLanc = $id('data_lancamento');
      if (inLanc) inLanc.value = hoje;
      const cb = $id('manter-data-lancamento');
      if (cb) cb.checked = false;

    } catch (err) {
      const msg = err?.response?.data?.erro || err?.message || 'Erro ao salvar movimento.';
      alert(msg);
    }
  }

  /* ===================== Modal Liquidação ===================== */
  function confirmarLiquidacaoModal({ valor, meioTexto } = {}) {
    return new Promise((resolve) => {
      const modal = $id('modal-liquidacao');
      const btnOk = $id('btn-liquidar');
      const btnNo = $id('btn-nao-liquidar');
      const detalhe = $id('detalhe-liquidacao');

      if (!modal || !btnOk || !btnNo) {
        const fallback = window.confirm('Este movimento é À VISTA. Deseja liquidar o título agora?');
        return resolve(!!fallback);
      }

      if (detalhe && (valor || meioTexto)) {
        const partes = [];
        if (valor) partes.push(`Valor: ${fmtMoney(valor)}`);
        if (meioTexto) partes.push(`Meio: ${meioTexto}`);
        detalhe.textContent = partes.join(' • ');
        detalhe.classList.remove('hidden');
      } else if (detalhe) {
        detalhe.textContent = '';
        detalhe.classList.add('hidden');
      }

      const cleanup = () => {
        btnOk.removeEventListener('click', onOk);
        btnNo.removeEventListener('click', onNo);
        modal.removeEventListener('click', onBackdrop);
        modal.style.display = 'none';
      };
      const onOk = () => { cleanup(); resolve(true); };
      const onNo = () => { cleanup(); resolve(false); };
      const onBackdrop = (ev) => { if (ev.target === modal) onNo(); };

      btnOk.addEventListener('click', onOk, { once: true });
      btnNo.addEventListener('click', onNo, { once: true });
      modal.addEventListener('click', onBackdrop, { once: true });

      modal.style.display = 'flex';
    });
  }

  /* ===================== Liquidação imediata ===================== */
  async function liquidarTituloDoMovimento({ movimento, meioPagamentoId, valor }) {
    if (!movimento || !movimento.id) throw new Error('Movimento sem ID para liquidação.');
    const titulo = await encontrarTituloDoMovimento(movimento.id);
    if (!titulo || !titulo.id) throw new Error('Título do movimento não encontrado.');

    const payloadLiquida = {
      dataPagamento: hojeISO(),
      meioPagamentoId,
      valorPago: valor,
      obs: 'Liquidação imediata no lançamento à vista'
    };
    await axios.post(`${API_BASE_URL}/contas-a-receber/${titulo.id}/liquidar`, payloadLiquida);
  }

  async function encontrarTituloDoMovimento(movimentoId) {
    for (let i = 0; i < 6; i++) {
      try {
        const { data: contasFiltradas } = await axios.get(`${API_BASE_URL}/contas-a-receber`, { params: { movimentoId } });
        const hit = (Array.isArray(contasFiltradas) ? contasFiltradas : []).find(c => Number(c.movimentoId) === Number(movimentoId));
        if (hit) return hit;
      } catch {}
      await sleep(150);
    }
    const { data: todas } = await axios.get(`${API_BASE_URL}/contas-a-receber`);
    const lista = Array.isArray(todas) ? todas : [];
    const candidatas = lista.filter(c => Number(c.movimentoId) === Number(movimentoId));
    if (candidatas.length === 0) return null;
    const naoLiquidadas = candidatas.filter(c => {
      const desc = (c.status?.descricao || '').toLowerCase();
      return desc !== 'liquidado' && desc !== 'cancelado' && desc !== 'estornado';
    });
    if (naoLiquidadas.length > 0) return naoLiquidadas[0];
    return candidatas[0];
  }

})();

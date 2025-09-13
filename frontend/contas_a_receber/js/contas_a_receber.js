// contas_a_receber.js (v1.3.0) - Listagem + Liquidar (abas Parcial/Total) + Cancelar + Prorrogar
(() => {
  'use strict';

  if (window.__carInit) return;
  window.__carInit = true;

  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';
  const EPS = 0.01; // tolerância de centavos

  // ===== Helpers =====
  const $id = (x) => document.getElementById(x);
  const fmtMoney = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const hojeISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  const toNumber = (v) => {
    if (v === null || v === undefined) return 0;
    const s = String(v).replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  };

  // ===== Refs: filtros e tabela =====
  const TBODY          = $id('tbody-contas');

  const filtroMov      = $id('filtro-movimento');
  const filtroStatus   = $id('filtro-status');      // ABERTO | ABERTO PARCIAL | LIQUIDADO | CANCELADO
  const filtroCliente  = $id('filtro-cliente');
  const filtroInicio   = $id('filtro-inicio');
  const filtroFim      = $id('filtro-fim');

  const btnBuscar      = $id('btn-buscar');
  const btnLimpar      = $id('btn-limpar');
  const msgFiltros     = $id('msg-filtros');

  // ===== Refs: modal Liquidar =====
  const modalLiq       = $id('modal-liquidar');
  const liqInfo        = $id('liq-info');
  const liqData        = $id('liq-data');
  const liqMeio        = $id('liq-meio');

  const liqSaldoInput  = $id('liq-saldo-atual');
  const liqDescInput   = $id('liq-desconto');
  const liqAcrInput    = $id('liq-acrescimo');
  const liqObs         = $id('liq-obs');

  // Abas e painéis
  const tabParcial     = $id('tab-parcial');
  const tabTotal       = $id('tab-total');
  const panelParcial   = $id('panel-parcial');
  const panelTotal     = $id('panel-total');

  // Campos específicos da aba PARCIAL
  const liqValorInput  = $id('liq-valor-pago');
  const liqFeedback    = $id('liq-feedback');

  // Ações do modal Liquidar
  const liqConfirmar   = $id('btn-confirmar-liquidar');
  const liqCancelar    = $id('btn-cancelar-liquidar');

  // ===== Refs: modal Prorrogar =====
  const modalPro       = $id('modal-prorrogar');
  const proInfo        = $id('pro-info');
  const proNovaData    = $id('pro-nova-data');
  const proObs         = $id('pro-obs');
  const proConfirmar   = $id('btn-confirmar-prorrogar');
  const proCancelar    = $id('btn-cancelar-prorrogar');

  // ===== Refs: modal Cancelar =====
  const modalCan       = $id('modal-cancelar');
  const canInfo        = $id('can-info');
  const canObs         = $id('can-obs');
  const canConfirmar   = $id('btn-confirmar-cancelar');
  const canCancelar    = $id('btn-cancelar-cancelar');

  // ===== Estado =====
  let LISTA = [];               // títulos carregados
  let STATUS = [];              // [{id, descricao}]
  let STATUS_BY_DESC = new Map(); // desc lower => id (mantido para usos futuros)
  let MEIOS = [];               // meios de pagamento
  let TITLE_ATIVO = null;       // título selecionado nos modais
  let ABA_ATIVA = 'parcial';    // 'parcial' | 'total'

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      await carregarStatus();
      await carregarMeiosPagamento();
      await recarregar();

      // Filtros
      btnBuscar?.addEventListener('click', render);
      btnLimpar?.addEventListener('click', () => {
        filtroMov.value = '';
        filtroStatus.value = '';
        filtroCliente.value = '';
        filtroInicio.value = '';
        filtroFim.value = '';
        msgFiltros.classList.add('hidden');
        render();
      });

      // Eventos dos modais
      liqCancelar?.addEventListener('click', () => fecharModal(modalLiq));
      liqConfirmar?.addEventListener('click', confirmarLiquidacao);

      proCancelar?.addEventListener('click', () => fecharModal(modalPro));
      proConfirmar?.addEventListener('click', confirmarProrrogacao);

      canCancelar?.addEventListener('click', () => fecharModal(modalCan));
      canConfirmar?.addEventListener('click', confirmarCancelamento);

      // Troca de abas
      tabParcial?.addEventListener('click', () => setAba('parcial'));
      tabTotal?.addEventListener('click', () => setAba('total'));

      // Feedback dinâmico na aba PARCIAL
      ['input', 'change'].forEach(evt => {
        liqValorInput?.addEventListener(evt, atualizarFeedbackParcial);
        liqDescInput?.addEventListener(evt, atualizarFeedbackParcial);
        liqAcrInput?.addEventListener(evt, atualizarFeedbackParcial);
      });
    } catch (err) {
      console.error('Falha ao iniciar tela de Contas a Receber:', err);
      alert('Erro ao carregar a tela de Contas a Receber.');
    }
  }

  async function carregarStatus() {
    const { data } = await axios.get(`${API_BASE_URL}/status`);
    STATUS = Array.isArray(data) ? data : [];
    STATUS_BY_DESC.clear();
    for (const s of STATUS) {
      STATUS_BY_DESC.set(String(s.descricao || '').toLowerCase(), s.id);
    }
  }

  async function carregarMeiosPagamento() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/meios-de-pagamento`);
      MEIOS = Array.isArray(data) ? data : [];
      liqMeio.innerHTML = '<option value="">Selecione</option>';
      for (const m of MEIOS) {
        const opt = new Option(m.descricao ?? `ID ${m.id}`, m.id);
        liqMeio.add(opt);
      }
    } catch (e) {
      console.warn('Não foi possível carregar meios de pagamento (segue sem obrigar):', e);
    }
  }

  async function recarregar() {
    const { data } = await axios.get(`${API_BASE_URL}/contas-a-receber`);
    LISTA = Array.isArray(data) ? data : [];
    render();
  }

  function render() {
    if (!TBODY) return;
    TBODY.innerHTML = '';

    // Coleta filtros
    const fMov = Number(filtroMov?.value || 0) || 0;
    const fStatusTxt = (filtroStatus?.value || '').trim().toLowerCase();
    const fCliente = (filtroCliente?.value || '').trim().toLowerCase();
    const fInicio = filtroInicio?.value ? new Date(filtroInicio.value) : null;
    const fFim = filtroFim?.value ? new Date(filtroFim.value) : null;

    const linhas = LISTA.filter((c) => {
      if (fMov && Number(c.movimento?.id) !== fMov) return false;

      if (fStatusTxt) {
        const desc = String(c.status?.descricao || '').trim().toLowerCase();
        if (desc !== fStatusTxt) return false;
      }

      const nomeCli = (c.cliente?.nome || '').toLowerCase();
      if (fCliente && !nomeCli.includes(fCliente)) return false;

      if (fInicio || fFim) {
        const d = c.dataVencimento ? new Date(c.dataVencimento) : null;
        if (!d) return false;
        if (fInicio && d < fInicio) return false;
        if (fFim) {
          const dFim = new Date(fFim);
          dFim.setHours(23, 59, 59, 999);
          if (d > dFim) return false;
        }
      }

      return true;
    });

    if (msgFiltros) {
      msgFiltros.textContent = `Exibindo ${linhas.length} de ${LISTA.length} títulos.`;
      msgFiltros.classList.remove('hidden');
    }

    for (const c of linhas) {
      const tr = document.createElement('tr');

      const sdesc = (c.status?.descricao || '').toLowerCase();
      let badgeCls = 'badge';
      if (sdesc.includes('liquid')) badgeCls += ' liquidado';
      else if (sdesc.includes('cancel')) badgeCls += ' cancelado';
      else badgeCls += ' aberto';

      const btns = document.createElement('div');
      btns.className = 'acoes';

      const btnLiq = document.createElement('button');
      btnLiq.className = 'btn';
      btnLiq.textContent = 'Liquidar';
      btnLiq.addEventListener('click', () => abrirModalLiquidar(c));

      const btnPro = document.createElement('button');
      btnPro.className = 'btn warn';
      btnPro.textContent = 'Prorrogar';
      btnPro.addEventListener('click', () => abrirModalProrrogar(c));

      const btnCan = document.createElement('button');
      btnCan.className = 'btn danger';
      btnCan.textContent = 'Cancelar';
      btnCan.addEventListener('click', () => abrirModalCancelar(c));

      const jaEncerrado = sdesc.includes('liquidado') || sdesc.includes('cancelado');
      if (jaEncerrado) {
        btnLiq.disabled = true;
        btnPro.disabled = true;
        btnCan.disabled = true;
      }

      btns.append(btnLiq, btnPro, btnCan);

      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${c.cliente?.nome ?? '-'}</td>
        <td>${c.movimento?.id ?? '-'}</td>
        <td>${c.dataVencimento ?? '-'}</td>
        <td>${fmtMoney(c.valorOriginal)}</td>
        <td>${fmtMoney(c.valorPago)}</td>
        <td><span class="${badgeCls}">${c.status?.descricao ?? '-'}</span></td>
        <td></td>
      `;
      tr.lastElementChild.appendChild(btns);
      TBODY.appendChild(tr);
    }
  }

  // =================== Liquidar (abas Parcial/Total) ===================

  function abrirModalLiquidar(conta) {
    TITLE_ATIVO = conta;
    if (!modalLiq) return;

    // Resumo e data
    liqInfo.textContent =
      `Título #${conta.id} — Cliente: ${conta.cliente?.nome ?? '-'} — Venc: ${conta.dataVencimento ?? '-'} — Valor: ${fmtMoney(conta.valorOriginal)}`;
    liqData.value = hojeISO();
    liqMeio.value = '';

    // Saldo atual
    const valorOriginal = Number(conta.valorOriginal || 0);
    const valorPago = Number(conta.valorPago || 0);
    const saldo = Math.max(0, valorOriginal - valorPago);

    // Preenche campos
    liqSaldoInput.value = saldo.toFixed(2).replace('.', ',');
    liqDescInput.value = '';
    liqAcrInput.value = '';
    liqObs.value = '';
    if (liqValorInput) liqValorInput.value = '';
    if (liqFeedback) {
      liqFeedback.textContent = 'Informe o valor pago. Se for menor que o saldo, será uma liquidação parcial.';
      liqFeedback.style.color = '';
    }

    // Abre com aba PARCIAL ativa
    setAba('parcial');

    abrirModal(modalLiq);
  }

  function setAba(tipo) {
    ABA_ATIVA = (tipo === 'total') ? 'total' : 'parcial';

    // Tab classes
    if (tabParcial && tabTotal) {
      tabParcial.classList.toggle('active', ABA_ATIVA === 'parcial');
      tabTotal.classList.toggle('active', ABA_ATIVA === 'total');
    }

    // Panels
    if (panelParcial && panelTotal) {
      panelParcial.classList.toggle('hidden', ABA_ATIVA !== 'parcial');
      panelTotal.classList.toggle('hidden', ABA_ATIVA !== 'total');
    }

    // Texto do botão confirmar (só UX)
    if (liqConfirmar) {
      liqConfirmar.textContent = ABA_ATIVA === 'parcial' ? 'Confirmar baixa parcial' : 'Confirmar baixa total';
    }

    // Foco inicial
    if (ABA_ATIVA === 'parcial' && liqValorInput) {
      setTimeout(() => liqValorInput.focus(), 0);
    } else {
      setTimeout(() => liqDescInput?.focus(), 0);
    }

    // Atualiza feedback (caso já tenha valores)
    atualizarFeedbackParcial();
  }

  function atualizarFeedbackParcial() {
    if (!TITLE_ATIVO || !liqFeedback || ABA_ATIVA !== 'parcial') return;

    const saldo = toNumber(liqSaldoInput.value);
    const pago  = toNumber(liqValorInput.value);
    const desc  = toNumber(liqDescInput.value);
    const acr   = toNumber(liqAcrInput.value);

    const efetivo = Math.max(0, (pago - desc) + acr);

    if (!pago || pago <= 0) {
      liqFeedback.textContent = 'Informe um valor pago maior que zero.';
      liqFeedback.style.color = '#b00';
      return;
    }

    if (efetivo + EPS < saldo) {
      const novoSaldo = Math.max(0, saldo - efetivo);
      liqFeedback.textContent = `Liquidação PARCIAL — novo saldo ~ ${fmtMoney(novoSaldo)}`;
      liqFeedback.style.color = '#a66a00';
    } else {
      liqFeedback.textContent = 'Este valor quita o título. Use a aba "Total" para baixa completa.';
      liqFeedback.style.color = '#0a7';
    }
  }

  async function confirmarLiquidacao() {
    if (!TITLE_ATIVO) return;
    const id = TITLE_ATIVO.id;

    const saldo      = toNumber(liqSaldoInput.value);
    const desconto   = toNumber(liqDescInput.value);
    const acrescimo  = toNumber(liqAcrInput.value);
    const dataPg     = liqData.value || hojeISO();
    const meioId     = liqMeio.value ? Number(liqMeio.value) : undefined;
    const obs        = liqObs.value || undefined;

    let payload = {
      dataPagamento: dataPg,
      meioPagamentoId: meioId,
      desconto: desconto || undefined,
      acrescimo: acrescimo || undefined,
      obs,
      tipoBaixa: ABA_ATIVA // 'parcial' | 'total'
    };

    if (ABA_ATIVA === 'parcial') {
      const pago = toNumber(liqValorInput.value);
      if (pago <= 0) {
        alert('Informe um valor pago maior que zero.');
        return;
      }
      const efetivo = Math.max(0, (pago - desconto) + acrescimo);

      if (efetivo <= 0) {
        alert('Com desconto/juros informados, o valor efetivo ficou zero.');
        return;
      }
      if (efetivo + EPS >= saldo) {
        alert('Este valor quita o título. Use a aba "Total" para baixa completa.');
        return;
      }

      payload.valorPago = pago; // bruto informado
    } else {
      // TOTAL: considera valorPago = saldo (bruto), e aplica desconto/acréscimo
      const efetivoTotal = Math.max(0, (saldo - desconto) + acrescimo);
      if (efetivoTotal + EPS < saldo) {
        alert('Este valor não quita o título. Use a aba "Parcial" ou ajuste desconto/juros.');
        return;
      }
      payload.valorPago = saldo; // manda o saldo como "bruto"
    }

    try {
      await axios.post(`${API_BASE_URL}/contas-a-receber/${id}/liquidar`, payload);
      fecharModal(modalLiq);
      await recarregar();
      alert(ABA_ATIVA === 'parcial' ? 'Baixa parcial registrada.' : 'Título liquidado por completo.');
    } catch (err) {
      console.error('Erro ao liquidar:', err);
      const msg = err?.response?.data?.erro || 'Falha ao registrar a baixa.';
      alert(msg);
    }
  }

  // =================== Prorrogar ===================

  function abrirModalProrrogar(conta) {
    TITLE_ATIVO = conta;
    if (!modalPro) return;

    proInfo.textContent =
      `Prorrogar título #${conta.id} — Cliente: ${conta.cliente?.nome ?? '-'} — Venc atual: ${conta.dataVencimento ?? '-'}`;
    proNovaData.value = conta.dataVencimento || hojeISO();
    proObs.value = '';
    abrirModal(modalPro);
  }

  async function confirmarProrrogacao() {
    if (!TITLE_ATIVO) return;
    const id = TITLE_ATIVO.id;
    const novaData = proNovaData.value;

    if (!novaData) {
      alert('Informe a nova data de vencimento.');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/contas-a-receber/${id}/prorrogar`, {
        novaDataVencimento: novaData,
        obs: proObs.value || undefined
      });
      fecharModal(modalPro);
      await recarregar();
      alert('Vencimento prorrogado com sucesso.');
    } catch (err) {
      console.error('Erro ao prorrogar:', err);
      alert(err?.response?.data?.erro || 'Falha ao prorrogar o título.');
    }
  }

  // =================== Cancelar ===================

  function abrirModalCancelar(conta) {
    TITLE_ATIVO = conta;
    if (!modalCan) return;

    canInfo.textContent =
      `Cancelar título #${conta.id} — Cliente: ${conta.cliente?.nome ?? '-'} — Valor: ${fmtMoney(conta.valorOriginal)}`;
    canObs.value = '';
    abrirModal(modalCan);
  }

  async function confirmarCancelamento() {
    if (!TITLE_ATIVO) return;

    const id = TITLE_ATIVO.id;
    try {
      await axios.post(`${API_BASE_URL}/contas-a-receber/${id}/cancelar`, {
        obs: canObs.value || undefined
      });
      fecharModal(modalCan);
      await recarregar();
      alert('Título cancelado com sucesso.');
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      alert(err?.response?.data?.erro || 'Falha ao cancelar o título.');
    }
  }

  // =================== Utils: modal ===================

  function abrirModal(modal) {
    if (!modal) return;
    modal.style.display = 'flex';
    // fecha clicando fora
    modal.addEventListener('click', onBackdrop);
  }

  function fecharModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    modal.removeEventListener('click', onBackdrop);
    TITLE_ATIVO = null;
  }

  function onBackdrop(e) {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
      e.target.removeEventListener('click', onBackdrop);
      TITLE_ATIVO = null;
    }
  }

})();

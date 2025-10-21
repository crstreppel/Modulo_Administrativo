document.addEventListener("DOMContentLoaded", async () => {
  const listaClientesDiv = document.getElementById("lista-clientes");
  const buscaInput = document.getElementById("busca");
  const btnBuscar = document.getElementById("btn-buscar");
  const btnRecarregar = document.getElementById("btn-recarregar");
  const formEdicao = document.getElementById("form-edicao");
  const secaoEdicao = document.getElementById("edicao-cliente");
  const btnCancelar = document.getElementById("btn-cancelar");
  const mensagemDiv = document.getElementById("mensagem");

  let clienteEditando = null;

  // =============================================================
  // FUNÇÃO DE MENSAGEM VISUAL
  // =============================================================
  function mostrarMensagem(texto, tipo = "info") {
    mensagemDiv.innerHTML = "";
    const msg = document.createElement("div");
    msg.classList.add("mensagem", tipo);
    msg.textContent = texto;
    mensagemDiv.appendChild(msg);
    setTimeout(() => {
      msg.classList.add("fade");
      setTimeout(() => (mensagemDiv.innerHTML = ""), 400);
    }, 4000);
  }

  // =============================================================
  // LISTAR CLIENTES
  // =============================================================
  async function listarClientes(filtro = "") {
    try {
      const response = await axios.get("http://localhost:3000/api/clientes");
      const clientes = response.data;

      listaClientesDiv.innerHTML = "";
      const filtrados = clientes.filter(c =>
        c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        (c.telefone && c.telefone.includes(filtro))
      );

      if (filtrados.length === 0) {
        listaClientesDiv.innerHTML = "<p>Nenhum cliente encontrado.</p>";
        return;
      }

      filtrados.forEach((cliente) => {
        const div = document.createElement("div");
        div.classList.add("cliente-card");

        div.innerHTML = `
          <strong>${cliente.nome}</strong><br>
          ${cliente.telefone ? `Telefone: ${cliente.telefone}<br>` : ""}
          ${cliente.endereco ? `Endereço: ${cliente.endereco}<br>` : ""}
          ${cliente.dia_pagamento ? `<em>Dia de Pagamento: ${cliente.dia_pagamento}</em><br>` : ""}
          <button class="btn-editar" data-id="${cliente.id}">Editar</button>
          <button class="btn-excluir" data-id="${cliente.id}">Excluir</button>
        `;
        listaClientesDiv.appendChild(div);
      });

      document.querySelectorAll(".btn-editar").forEach((btn) => {
        btn.addEventListener("click", () => carregarCliente(btn.dataset.id));
      });

      document.querySelectorAll(".btn-excluir").forEach((btn) => {
        btn.addEventListener("click", () => excluirCliente(btn.dataset.id));
      });
    } catch (error) {
      console.error("Erro ao listar clientes:", error);
      mostrarMensagem("Erro ao listar clientes.", "erro");
    }
  }

  // =============================================================
  // BUSCAR / RECARREGAR
  // =============================================================
  btnBuscar.addEventListener("click", () => listarClientes(buscaInput.value));
  btnRecarregar.addEventListener("click", () => {
    buscaInput.value = "";
    listarClientes();
  });

  // =============================================================
  // CARREGAR CLIENTE PARA EDIÇÃO
  // =============================================================
  async function carregarCliente(id) {
    try {
      const response = await axios.get(`http://localhost:3000/api/clientes/${id}`);
      const c = response.data;
      clienteEditando = c.id;

      formEdicao["edit-nome"].value = c.nome || "";
      formEdicao["edit-telefone"].value = c.telefone || "";
      formEdicao["edit-email"].value = c.email || "";
      formEdicao["edit-endereco"].value = c.endereco || "";
      formEdicao["edit-numero"].value = c.numero || "";
      formEdicao["edit-bairro"].value = c.bairro || "";
      formEdicao["edit-cidade"].value = c.cidade || "";
      formEdicao["edit-uf"].value = c.uf || "";
      formEdicao["edit-cep"].value = c.cep || "";
      formEdicao["edit-dia_pagamento"].value = c.dia_pagamento || "";

      secaoEdicao.classList.remove("oculto");
      mostrarMensagem("Modo edição ativo.", "info");
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      mostrarMensagem("Erro ao carregar cliente.", "erro");
    }
  }

  // =============================================================
  // SALVAR ALTERAÇÕES
  // =============================================================
  formEdicao.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!clienteEditando) return;

    const dados = {
      nome: formEdicao["edit-nome"].value,
      telefone: formEdicao["edit-telefone"].value,
      email: formEdicao["edit-email"].value,
      endereco: formEdicao["edit-endereco"].value,
      numero: formEdicao["edit-numero"].value,
      bairro: formEdicao["edit-bairro"].value,
      cidade: formEdicao["edit-cidade"].value,
      uf: formEdicao["edit-uf"].value,
      cep: formEdicao["edit-cep"].value,
      dia_pagamento: formEdicao["edit-dia_pagamento"].value ? parseInt(formEdicao["edit-dia_pagamento"].value) : null,
    };

    try {
      await axios.put(`http://localhost:3000/api/clientes/${clienteEditando}`, dados);
      mostrarMensagem("Cliente atualizado com sucesso!", "sucesso");
      secaoEdicao.classList.add("oculto");
      clienteEditando = null;
      listarClientes();
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      mostrarMensagem("Erro ao salvar alterações.", "erro");
    }
  });

  // =============================================================
  // CANCELAR EDIÇÃO
  // =============================================================
  btnCancelar.addEventListener("click", () => {
    secaoEdicao.classList.add("oculto");
    clienteEditando = null;
  });

  // =============================================================
  // EXCLUIR CLIENTE
  // =============================================================
  async function excluirCliente(id) {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      await axios.delete(`http://localhost:3000/api/clientes/${id}`);
      mostrarMensagem("Cliente excluído com sucesso.", "sucesso");
      listarClientes();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      mostrarMensagem("Erro ao excluir cliente.", "erro");
    }
  }

  listarClientes();
});

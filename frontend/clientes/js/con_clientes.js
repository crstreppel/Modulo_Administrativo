let clientes = [];

document.addEventListener("DOMContentLoaded", async () => {
  clientes = await consultarClientes();

  await carregarStatusSelect("#statusEdit"); // <- garantir async se a função for assíncrona

  renderizarListaClientes(clientes);

  document.getElementById("filtroCliente").addEventListener("input", () => {
    const termo = document.getElementById("filtroCliente").value.toLowerCase();
    const filtrados = clientes.filter(c =>
      c.nome.toLowerCase().includes(termo) || c.cpf.includes(termo)
    );
    renderizarListaClientes(filtrados);
  });

  document.getElementById("listaClientes").addEventListener("change", (e) => {
    const clienteId = parseInt(e.target.value);
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) mostrarDetalhes(cliente);
  });
});

function renderizarListaClientes(lista) {
  const select = document.getElementById("listaClientes");
  select.innerHTML = "";
  lista.forEach(cliente => {
    const option = document.createElement("option");
    option.value = cliente.id;
    option.textContent = `${cliente.nome} - CPF: ${cliente.cpf}`;
    select.appendChild(option);
  });
}

function mostrarDetalhes(cliente) {
  document.getElementById("detalhesCliente").style.display = "block";
  document.getElementById("nomeEdit").value = cliente.nome;
  document.getElementById("cpfEdit").value = cliente.cpf;
  document.getElementById("telefoneEdit").value = cliente.telefone;
  document.getElementById("enderecoEdit").value = cliente.endereco;
  document.getElementById("numeroEdit").value = cliente.numero;
  document.getElementById("bairroEdit").value = cliente.bairro;
  document.getElementById("statusEdit").value = cliente.statusId;
  document.getElementById("detalhesCliente").dataset.id = cliente.id;
}

async function editarCliente() {
  const id = document.getElementById("detalhesCliente").dataset.id;
  const clienteAtualizado = {
    nome: document.getElementById("nomeEdit").value.trim(),
    cpf: document.getElementById("cpfEdit").value.trim(),
    telefone: document.getElementById("telefoneEdit").value.trim(),
    endereco: document.getElementById("enderecoEdit").value.trim(),
    numero: document.getElementById("numeroEdit").value.trim(),
    bairro: document.getElementById("bairroEdit").value.trim(),
    statusId: document.getElementById("statusEdit").value
  };

  try {
    await axios.put(`http://localhost:3000/api/clientes/${id}`, clienteAtualizado);
    alert("Cliente atualizado com sucesso!");
    clientes = await consultarClientes();
    renderizarListaClientes(clientes);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    alert("Erro ao atualizar cliente.");
  }
}

async function excluirCliente() {
  const id = document.getElementById("detalhesCliente").dataset.id;
  if (!confirm("Confirma a exclusão (soft delete) deste cliente?")) return;

  try {
    await axios.delete(`http://localhost:3000/api/clientes/${id}`);
    alert("Cliente excluído com sucesso!");
    clientes = await consultarClientes();
    renderizarListaClientes(clientes);
    document.getElementById("detalhesCliente").style.display = "none";
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    alert("Erro ao excluir cliente.");
  }
}

// ⚠️ Se utils.js não definir essa função, adicione esta versão básica aqui:
async function carregarStatusSelect(selector) {
  try {
    const response = await axios.get("http://localhost:3000/api/status");
    const select = document.querySelector(selector);
    select.innerHTML = "";

    response.data.forEach(status => {
      const option = document.createElement("option");
      option.value = status.id;
      option.textContent = status.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar status:", error);
  }
}

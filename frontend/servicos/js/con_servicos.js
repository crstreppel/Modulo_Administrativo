let servicos = [];

document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatus("#statusEdit");
  await carregarServicos();

  document.getElementById("filtroDescricao").addEventListener("input", filtrarServicos);
  document.getElementById("listaServicos").addEventListener("change", mostrarDetalhes);
});

async function carregarServicos() {
  try {
    const response = await axios.get("http://localhost:3000/api/servicos");
    servicos = response.data;
    atualizarLista(servicos);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
  }
}

function atualizarLista(lista) {
  const select = document.getElementById("listaServicos");
  select.innerHTML = "";
  lista.forEach(servico => {
    const option = document.createElement("option");
    option.value = servico.id;
    option.textContent = `${servico.descricao}`;
    select.appendChild(option);
  });
}

function filtrarServicos() {
  const filtro = document.getElementById("filtroDescricao").value.toLowerCase();
  const filtrados = servicos.filter(s =>
    s.descricao.toLowerCase().includes(filtro)
  );
  atualizarLista(filtrados);
}

function mostrarDetalhes() {
  const id = document.getElementById("listaServicos").value;
  const servico = servicos.find(s => s.id == id);
  if (servico) {
    document.getElementById("descricaoEdit").value = servico.descricao;
    document.getElementById("statusEdit").value = servico.statusId;
    document.getElementById("detalhesServico").style.display = "block";
  }
}

async function editarServico() {
  const id = document.getElementById("listaServicos").value;
  const descricao = document.getElementById("descricaoEdit").value.trim();
  const statusId = document.getElementById("statusEdit").value;

  try {
    await axios.put(`http://localhost:3000/api/servicos/${id}`, {
      descricao,
      statusId
    });
    alert("Serviço atualizado com sucesso.");
    await carregarServicos();
    document.getElementById("detalhesServico").style.display = "none";
  } catch (error) {
    console.error("Erro ao editar serviço:", error);
    alert("Erro ao editar serviço.");
  }
}

async function excluirServico() {
  const id = document.getElementById("listaServicos").value;
  if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

  try {
    await axios.delete(`http://localhost:3000/api/servicos/${id}`);
    alert("Serviço excluído com sucesso.");
    await carregarServicos();
    document.getElementById("detalhesServico").style.display = "none";
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
    alert("Erro ao excluir serviço.");
  }
}

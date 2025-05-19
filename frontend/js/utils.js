// frontend/js/utils.js

// Consulta todos os status da API
async function consultarStatus() {
  try {
    const response = await axios.get('http://localhost:3000/api/status');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    return [];
  }
}

// Carrega os status no select com id "status"
async function carregarStatus() {
  const select = document.getElementById("status");
  if (!select) return;

  try {
    const statusList = await consultarStatus();
    select.innerHTML = ""; // limpa o select

    statusList.forEach(status => {
      const option = document.createElement("option");
      option.value = status.id;
      option.textContent = status.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar status:", error);
  }
}

// Carrega serviços em um select passando o seletor do select como argumento
async function carregarServicosSelect(selectId) {
  try {
    const response = await axios.get("http://localhost:3000/api/servicos");
    const select = document.querySelector(selectId);
    if (!select) return;

    select.innerHTML = "";

    response.data.forEach(servico => {
      const option = document.createElement("option");
      option.value = servico.id;
      option.textContent = servico.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
  }
}

// Consulta todos os clientes da API
async function consultarClientes() {
  try {
    const response = await axios.get("http://localhost:3000/api/clientes");
    return response.data;
  } catch (error) {
    console.error("Erro ao consultar clientes:", error);
    return [];
  }
}

// Carrega os status em um <select> com seletor passado por parâmetro
async function carregarStatusSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const statusList = await consultarStatus();
    select.innerHTML = ""; // limpa o select

    statusList.forEach(status => {
      const option = document.createElement("option");
      option.value = status.id;
      option.textContent = status.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar status no select:", error);
  }
}

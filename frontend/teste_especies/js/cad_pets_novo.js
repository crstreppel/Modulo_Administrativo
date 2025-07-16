document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("form-pet");
  const clienteSelect = document.getElementById("cliente");
  const especieSelect = document.getElementById("especie");
  const racaSelect = document.getElementById("raca");
  const statusSelect = document.getElementById("status");
  const resultado = document.getElementById("pet-cadastrado");

  // =========================
  // Funções de carregamento
  // =========================

  async function carregarClientes() {
    try {
      const res = await axios.get("http://localhost:3000/api/clientes");
      res.data.forEach(cliente => {
        const opt = document.createElement("option");
        opt.value = cliente.id;
        opt.textContent = `${cliente.nome} (ID: ${cliente.id})`;
        clienteSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  }

  async function carregarEspecies() {
    try {
      const res = await axios.get("http://localhost:3000/api/especies");
      res.data.forEach(especie => {
        const opt = document.createElement("option");
        opt.value = especie.id;
        opt.textContent = especie.nome;
        especieSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar espécies:", err);
    }
  }

  async function carregarRacas(especieId) {
    try {
      racaSelect.innerHTML = '<option value="">Selecione uma raça</option>';
      if (!especieId) return;
      const res = await axios.get(`http://localhost:3000/api/racas?especieId=${especieId}`);
      res.data.forEach(raca => {
        const opt = document.createElement("option");
        opt.value = raca.id;
        opt.textContent = raca.nome;
        racaSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar raças:", err);
    }
  }

  async function carregarStatus() {
    try {
      const res = await axios.get("http://localhost:3000/api/status");
      res.data.forEach(status => {
        const opt = document.createElement("option");
        opt.value = status.id;
        opt.textContent = status.nome;
        statusSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar status:", err);
    }
  }

  // =========================
  // Eventos
  // =========================

  especieSelect.addEventListener("change", () => {
    const especieId = especieSelect.value;
    carregarRacas(especieId);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const clienteId = clienteSelect.value;
    const racaId = racaSelect.value;
    const statusId = statusSelect.value;
    const foto = document.getElementById("foto").value.trim();

    if (!nome || !clienteId || !racaId || !statusId) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/api/pets", {
        nome,
        clienteId,
        racaId,
        statusId,
        foto,
      });

      const pet = res.data;

      resultado.innerHTML = `
        <div style="animation: fadeIn 0.5s ease-out;">
          <p><strong>Pet cadastrado com sucesso:</strong></p>
          <p>ID: ${pet.id}</p>
          <p>Nome: ${pet.nome}</p>
          <p>Cliente ID: ${pet.clienteId}</p>
          <p>Raça ID: ${pet.racaId}</p>
          <p>Status ID: ${pet.statusId}</p>
          <p>Foto: ${pet.foto || "Nenhuma"}</p>
        </div>
      `;

      form.reset();
      racaSelect.innerHTML = '<option value="">Selecione uma raça</option>';
    } catch (err) {
      console.error("Erro ao cadastrar pet:", err);
      alert("Erro ao cadastrar pet.");
    }
  });

  // =========================
  // Inicialização
  // =========================
  await Promise.all([
    carregarClientes(),
    carregarEspecies(),
    carregarStatus()
  ]);
});

document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatus();
  await carregarEspecies();
  await carregarClientes();

  const especieSelect = document.getElementById("especie");
  const racaSelect = document.getElementById("raca");

  // Carrega raças ao selecionar uma espécie
  especieSelect.addEventListener("change", async () => {
    const especieId = especieSelect.value;
    console.log("Espécie selecionada:", especieId);
    await carregarRacasPorEspecie(especieId);
  });

  // Caso já tenha uma espécie selecionada ao carregar a página, carregar raças
  if (especieSelect.value) {
    await carregarRacasPorEspecie(especieSelect.value);
  }

  const form = document.getElementById("form-pet");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const clienteId = document.getElementById("cliente").value;
    const especieId = document.getElementById("especie").value;
    const racaId = document.getElementById("raca").value;
    const statusId = document.getElementById("status").value;
    const foto = document.getElementById("foto").value.trim();

    if (!especieId) {
      alert("Selecione uma espécie.");
      return;
    }

    if (!racaId) {
      alert("Selecione uma raça.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/pets", {
        nome,
        clienteId,
        especieId,
        racaId,
        statusId,
        foto,
      });

      const pet = response.data;

      document.getElementById("pet-cadastrado").innerHTML = `
        <p><strong>Pet cadastrado com sucesso:</strong></p>
        <p>ID: ${pet.id}</p>
        <p>Nome: ${pet.nome}</p>
        <p>Cliente ID: ${pet.clienteId}</p>
        <p>Espécie ID: ${pet.especieId}</p>
        <p>Raça ID: ${pet.racaId}</p>
        <p>Status ID: ${pet.statusId}</p>
        <p>Foto: ${pet.foto || "Nenhuma"}</p>
      `;

      form.reset();
      racaSelect.innerHTML = ""; // limpa raças após reset
    } catch (error) {
      console.error("Erro ao cadastrar pet:", error);
      alert("Erro ao cadastrar pet.");
    }
  });
});

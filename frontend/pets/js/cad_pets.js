document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatusSelect("#status");
  await carregarEspeciesSelect("#especie");
  await carregarClientes();

  const especieSelect = document.getElementById("especie");
  const racaSelect = document.getElementById("raca");

  especieSelect.addEventListener("change", async () => {
    const especieId = especieSelect.value;
    await carregarRacasPorEspecie(especieId);
  });

  if (especieSelect.value) {
    await carregarRacasPorEspecie(especieSelect.value);
  }

  const form = document.getElementById("form-pet");
  const resultado = document.getElementById("pet-cadastrado");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const clienteId = document.getElementById("cliente").value;
    const racaId = document.getElementById("raca").value;
    const statusId = document.getElementById("status").value;
    const foto = document.getElementById("foto").value.trim();

    if (!racaId) {
      alert("Selecione uma raça.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/pets", {
        nome,
        clienteId,
        racaId,
        statusId,
        foto,
      });

      const pet = response.data;

      resultado.innerHTML = `
        <div style="animation: fadeIn 0.5s ease-out;">
          <p><strong>Pet cadastrado com sucesso:</strong></p>
          <p>ID: ${pet.id}</p>
          <p>Nome: ${pet.nome}</p>
          <p>Cliente ID: ${pet.clienteId}</p>
          <p>Raça ID: ${pet.racaId}</p>
          ${pet.statusId ? `<p>Status ID: ${pet.statusId}</p>` : ""}
          <p>Foto: ${pet.foto || "Nenhuma"}</p>
        </div>
      `;

      form.reset();
      racaSelect.innerHTML = "";
    } catch (error) {
      console.error("Erro ao cadastrar pet:", error);
      alert("Erro ao cadastrar pet.");
    }
  });
});

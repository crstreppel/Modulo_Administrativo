document.addEventListener("DOMContentLoaded", async () => {
  const especieSelect = document.getElementById("especie");
  const racaSelect = document.getElementById("raca");

  async function carregarEspecies() {
    try {
      const response = await axios.get("http://localhost:3000/api/especies");
      const especies = response.data;

      especieSelect.innerHTML = '<option value="">Selecione a espécie</option>';

      especies.forEach((especie) => {
        const option = document.createElement("option");
        option.value = especie.id;
        option.textContent = especie.descricao;
        especieSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar espécies:", error);
    }
  }

  async function carregarRacasPorEspecie(especieId) {
    try {
      const response = await axios.get(`http://localhost:3000/api/racas?especieId=${especieId}`);
      const racas = response.data;

      racaSelect.innerHTML = '<option value="">Selecione a raça</option>';

      racas.forEach((raca) => {
        const option = document.createElement("option");
        option.value = raca.id;
        option.textContent = raca.descricao;
        racaSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar raças:", error);
    }
  }

  especieSelect.addEventListener("change", () => {
    const especieId = especieSelect.value;
    if (especieId) {
      carregarRacasPorEspecie(especieId);
    } else {
      racaSelect.innerHTML = '<option value="">Selecione uma espécie primeiro</option>';
    }
  });

  await carregarEspecies();
});

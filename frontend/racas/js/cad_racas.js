// frontend/racas/js/cad_racas.js

document.addEventListener("DOMContentLoaded", async () => {
  await carregarEspeciesSelect("#especie");

  const form = document.getElementById("form-raca");
  const descricaoInput = document.getElementById("descricao");
  const especieSelect = document.getElementById("especie");
  const resultadoDiv = document.getElementById("raca-cadastrada");

  const modalOverlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal");
  const modalTexto = document.getElementById("modal-texto");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const btnCancelar = document.getElementById("btn-cancelar");

  let descricaoTemp = "";
  let especieIdTemp = "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    descricaoTemp = descricaoInput.value.trim();
    especieIdTemp = especieSelect.value;

    if (!descricaoTemp || !especieIdTemp) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const especieNome = especieSelect.options[especieSelect.selectedIndex].textContent;

    modalTexto.textContent = `Deseja realmente cadastrar a raça "${descricaoTemp}" para a espécie "${especieNome}"?`;

    modalOverlay.classList.remove("hidden");
    setTimeout(() => {
      modal.classList.remove("scale-95", "opacity-0");
      modal.classList.add("scale-100", "opacity-100");
    }, 10);
  });

  btnCancelar.addEventListener("click", () => {
    modal.classList.remove("scale-100", "opacity-100");
    modal.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      modalOverlay.classList.add("hidden");
    }, 300);
  });

  btnConfirmar.addEventListener("click", async () => {
    modal.classList.remove("scale-100", "opacity-100");
    modal.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      modalOverlay.classList.add("hidden");
    }, 300);

    try {
      const response = await axios.post("http://localhost:3000/api/racas", {
        descricao: descricaoTemp,
        especieId: especieIdTemp,
        statusId: 1 // Status fixo: Ativo
      });

      const raca = response.data;

      resultadoDiv.innerHTML = `
        <p><strong>Raça cadastrada:</strong></p>
        <p>ID: ${raca.id}</p>
        <p>Descrição: ${raca.descricao}</p>
        <p>Espécie ID: ${raca.especieId}</p>
        <p>Status: Ativo</p>
      `;

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar raça:", error);
      alert("Erro ao cadastrar raça.");
    }
  });
});

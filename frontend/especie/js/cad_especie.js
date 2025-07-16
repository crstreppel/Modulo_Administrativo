// frontend/especie/js/cad_especie.js

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("form-especie");
  const descricaoInput = document.getElementById("descricao");
  const resultadoDiv = document.getElementById("especie-cadastrada");

  const modalOverlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal");
  const modalTexto = document.getElementById("modal-texto");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const btnCancelar = document.getElementById("btn-cancelar");

  let descricaoTemp = "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    descricaoTemp = descricaoInput.value.trim();
    if (!descricaoTemp) {
      alert("Por favor, preencha o nome da espécie.");
      return;
    }

    modalTexto.textContent = `Deseja realmente cadastrar a espécie "${descricaoTemp}" como Ativa?`;

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
      const response = await axios.post("http://localhost:3000/api/especies", {
        descricao: descricaoTemp,
        statusId: 1 // Ativo
      });

      const especie = response.data;

      resultadoDiv.innerHTML = `
        <p><strong>Espécie cadastrada:</strong></p>
        <p>ID: ${especie.id}</p>
        <p>Descrição: ${especie.descricao}</p>
        <p>Status: Ativo</p>
      `;

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar espécie:", error);
      alert("Erro ao cadastrar espécie.");
    }
  });
});

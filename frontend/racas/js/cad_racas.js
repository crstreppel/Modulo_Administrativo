// frontend/racas/js/cad_racas.js

document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatus();

  const form = document.getElementById("form-raca");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const descricao = document.getElementById("descricao").value.trim();
    const statusId = document.getElementById("status").value;

    try {
      const response = await axios.post("http://localhost:3000/api/racas", {
        descricao,
        statusId
      });

      const raca = response.data;

      document.getElementById("raca-cadastrada").innerHTML = `
        <p><strong>Raça cadastrada:</strong></p>
        <p>ID: ${raca.id}</p>
        <p>Descrição: ${raca.descricao}</p>
        <p>Status ID: ${raca.statusId}</p>
      `;

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar raça:", error);
      alert("Erro ao cadastrar raça.");
    }
  });
});

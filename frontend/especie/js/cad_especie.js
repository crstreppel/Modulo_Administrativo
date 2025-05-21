// frontend/especie/js/cad_especie.js

document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatus(); // Função do utils.js para carregar os status no select

  const form = document.getElementById("form-especie");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const descricao = document.getElementById("descricao").value.trim();
    const statusId = document.getElementById("status").value;

    try {
      const response = await axios.post("http://localhost:3000/api/especies", {
        descricao,
        statusId
      });

      const especie = response.data;

      document.getElementById("especie-cadastrada").innerHTML = `
        <p><strong>Espécie cadastrada:</strong></p>
        <p>ID: ${especie.id}</p>
        <p>Descrição: ${especie.descricao}</p>
        <p>Status ID: ${especie.statusId}</p>
      `;

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar espécie:", error);
      alert("Erro ao cadastrar espécie.");
    }
  });
});

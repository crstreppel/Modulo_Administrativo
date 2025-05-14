document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatus();

  const form = document.getElementById("form-servico");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const descricao = document.getElementById("descricao").value.trim();
    const statusId = document.getElementById("status").value;

    try {
      const response = await axios.post("http://localhost:3000/api/servicos", {
        descricao,
        statusId
      });

      const servico = response.data;

      document.getElementById("servico-cadastrado").innerHTML = `
        <p><strong>Serviço cadastrado:</strong></p>
        <p>ID: ${servico.id}</p>
        <p>Descrição: ${servico.descricao}</p>
        <p>Status ID: ${servico.statusId}</p>
      `;

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar serviço:", error);
      alert("Erro ao cadastrar serviço.");
    }
  });
});

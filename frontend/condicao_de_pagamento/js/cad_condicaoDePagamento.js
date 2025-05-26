document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatus();

  const form = document.getElementById("form-condicao-pagamento");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const descricao = document.getElementById("descricao").value.trim();
    const statusId = document.getElementById("status").value;

    try {
      const response = await axios.post("http://localhost:3000/api/condicoes-de-pagamento", {
        descricao,
        statusId
      });

      const condicao = response.data;

      document.getElementById("condicao-cadastrada").innerHTML = `
        <p><strong>Condição de Pagamento cadastrada:</strong></p>
        <p>ID: ${condicao.id}</p>
        <p>Descrição: ${condicao.descricao}</p>
        <p>Status ID: ${condicao.statusId}</p>
      `;

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar condição de pagamento:", error);
      alert("Erro ao cadastrar condição de pagamento.");
    }
  });
});

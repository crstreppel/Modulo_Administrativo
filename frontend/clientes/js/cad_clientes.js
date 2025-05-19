document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatus();

  const form = document.getElementById("form-cliente");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const bairro = document.getElementById("bairro").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const statusId = document.getElementById("status").value;

    try {
      const response = await axios.post("http://localhost:3000/api/clientes", {
        nome,
        telefone,
        endereco,
        numero,
        bairro,
        cpf,
        statusId,
      });

      const cliente = response.data;

      document.getElementById("cliente-cadastrado").innerHTML = `
        <p><strong>Cliente cadastrado:</strong></p>
        <p>ID: ${cliente.id}</p>
        <p>Nome: ${cliente.nome}</p>
        <p>Telefone: ${cliente.telefone}</p>
        <p>Endereço: ${cliente.endereco}, Nº ${cliente.numero}</p>
        <p>Bairro: ${cliente.bairro}</p>
        <p>CPF: ${cliente.cpf}</p>
        <p>Status ID: ${cliente.statusId}</p>
      `;

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      alert("Erro ao cadastrar cliente.");
    }
  });
});

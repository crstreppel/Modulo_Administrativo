document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatus();

  // Agora adiciona o event listener ao form
  const form = document.getElementById('form-meioDePagamento');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); // Previne comportamento padrão do form

      const descricao = document.getElementById('descricao').value;
      const statusId = document.getElementById('status').value;

      try {
        const response = await axios.post('http://localhost:3000/api/meios-de-pagamento', {
          descricao,
          statusId,
        });

        const meioDePagamento = response.data;

        // Corrigido para usar o id correto do elemento no HTML
        document.getElementById('meio-pagamento-cadastrado').innerHTML = `
          <p>Meio de Pagamento Cadastrado:</p>
          <p>ID: ${meioDePagamento.id}</p>
          <p>Descrição: ${meioDePagamento.descricao}</p>
          <p>Status ID: ${meioDePagamento.statusId}</p>
        `;

        form.reset();
      } catch (error) {
        console.error('Erro ao cadastrar meio de pagamento:', error);
      }
    });
  }
});

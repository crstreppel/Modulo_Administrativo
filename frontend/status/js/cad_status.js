// frontend/status/js/cad_status.js

document.getElementById('form-status').addEventListener('submit', async (event) => {
  event.preventDefault(); // Previne o comportamento padrão do form

  const descricao = document.getElementById('descricao').value;

  try {
    // Enviando os dados para o backend
    const response = await axios.post('http://localhost:3000/api/status', { descricao });

    // Exibindo o status cadastrado
    const status = response.data;
    document.getElementById('status-cadastrado').innerHTML = `
      <p>Status Cadastrado:</p>
      <p>ID: ${status.id}</p>
      <p>Descrição: ${status.descricao}</p>
    `;

    // Limpando o formulário
    document.getElementById('form-status').reset();
  } catch (error) {
    console.error('Erro ao cadastrar status:', error);
  }
});

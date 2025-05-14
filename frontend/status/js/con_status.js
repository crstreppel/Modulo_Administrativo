// frontend/status/js/con_status.js

let listaCompleta = [];
let idSelecionado = null;

async function carregarStatus() {
  try {
    listaCompleta = await consultarStatus(); // Função reutilizável do utils.js
    filtrarStatus();
  } catch (error) {
    console.error('Erro ao carregar status:', error);
  }
}

function filtrarStatus() {
  const filtro = document.getElementById('filtroDescricao').value.toLowerCase();
  const select = document.getElementById('listaStatus');
  select.innerHTML = '';

  const filtrados = listaCompleta.filter(s => s.descricao.toLowerCase().includes(filtro));

  filtrados.forEach(status => {
    const option = document.createElement('option');
    option.value = status.id;
    option.textContent = `${status.id} - ${status.descricao}`;
    select.appendChild(option);
  });
}

document.getElementById('filtroDescricao').addEventListener('input', filtrarStatus);

document.getElementById('listaStatus').addEventListener('change', () => {
  const select = document.getElementById('listaStatus');
  const id = select.value;
  const status = listaCompleta.find(s => s.id == id);
  if (status) {
    idSelecionado = status.id;
    document.getElementById('descricaoEdit').value = status.descricao;
    document.getElementById('detalhesStatus').style.display = 'block';
  }
});

async function editarStatus() {
  const novaDescricao = document.getElementById('descricaoEdit').value;
  try {
    await axios.put(`http://localhost:3000/api/status/${idSelecionado}`, {
      descricao: novaDescricao
    });
    alert('Status atualizado com sucesso!');
    carregarStatus(); // Recarrega a lista
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
  }
}

async function excluirStatus() {
  if (confirm('Tem certeza que deseja excluir este status?')) {
    try {
      await axios.delete(`http://localhost:3000/api/status/${idSelecionado}`);
      alert('Status excluído com sucesso!');
      document.getElementById('detalhesStatus').style.display = 'none';
      carregarStatus(); // Atualiza a lista
    } catch (error) {
      console.error('Erro ao excluir status:', error);
    }
  }
}

carregarStatus();

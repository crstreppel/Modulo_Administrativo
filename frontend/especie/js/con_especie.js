let listaEspecies = [];
let especieSelecionadaId = null;

async function carregarEspecies() {
  try {
    listaEspecies = await consultarEspecies(); // Função do utils.js
    filtrarEspecies();
  } catch (error) {
        console.error('Erro ao carregar espécies:', error);
  }
}

function filtrarEspecies() {
  const filtro = document.getElementById('filtroDescricao').value.toLowerCase();
  const select = document.getElementById('listaEspecies');
  select.innerHTML = '';

  const filtradas = listaEspecies.filter(e => e.descricao.toLowerCase().includes(filtro));

  filtradas.forEach(especie => {
    const option = document.createElement('option');
    option.value = especie.id;
    option.textContent = `${especie.id} - ${especie.descricao}`;
    select.appendChild(option);
  });
}

document.getElementById('filtroDescricao').addEventListener('input', filtrarEspecies);

document.getElementById('listaEspecies').addEventListener('change', async () => {
  const select = document.getElementById('listaEspecies');
  const id = select.value;
  const especie = listaEspecies.find(e => e.id == id);
  if (especie) {
    especieSelecionadaId = especie.id;
    document.getElementById('descricaoEdit').value = especie.descricao;
    await carregarStatusSelect('#statusEdit');
    document.getElementById('statusEdit').value = especie.statusId;
    document.getElementById('detalhesEspecie').style.display = 'block';
  }
});

async function editarEspecie() {
  const novaDescricao = document.getElementById('descricaoEdit').value;
  const novoStatusId = document.getElementById('statusEdit').value;
  try {
    await axios.put(`http://localhost:3000/api/especies/${especieSelecionadaId}`, {
      descricao: novaDescricao,
      statusId: novoStatusId
    });
    alert('Espécie atualizada com sucesso!');
    carregarEspecies();
  } catch (error) {
    console.error('Erro ao atualizar espécie:', error);
  }
}

async function excluirEspecie() {
  if (confirm('Tem certeza que deseja excluir esta espécie?')) {
    try {
      await axios.delete(`http://localhost:3000/api/especies/${especieSelecionadaId}`);
      alert('Espécie excluída com sucesso!');
      document.getElementById('detalhesEspecie').style.display = 'none';
      carregarEspecies();
    } catch (error) {
      console.error('Erro ao excluir espécie:', error);
    }
  }
}

carregarEspecies();

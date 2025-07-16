document.addEventListener("DOMContentLoaded", async () => {
  await carregarStatusSelect("#status");
  configurarBotaoMapa();
  configurarAdicaoRedeSocial();

  const form = document.getElementById("form-cliente");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const bairro = document.getElementById("bairro").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const estado = document.getElementById("estado").value.trim();
    const pais = document.getElementById("pais").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const statusId = document.getElementById("status").value;
    const aceitaLembreteBanho = document.getElementById("aceita-lembrete").checked;

    // Redes sociais
    const redes = Array.from(document.getElementsByName("redesSociais[]"))
      .map(input => input.value.trim())
      .filter(link => link !== "");

    // Montar link do Google Maps
    const link_maps = gerarLinkMaps(endereco, numero, bairro, cidade);

    // Jogar no input hidden (caso esteja sendo enviado por FormData)
    document.getElementById("link_maps").value = link_maps;

    try {
      const response = await axios.post("http://localhost:3000/api/clientes", {
        nome,
        telefone,
        endereco,
        numero,
        bairro,
        cidade,
        estado,
        pais,
        cpf,
        statusId,
        aceitaLembreteBanho,
        redesSociais: redes,
        link_maps
      });

      const cliente = response.data;

      document.getElementById("cliente-cadastrado").innerHTML = `
        <div class="cliente-box">
          <h2>🎉 Cliente cadastrado com sucesso!</h2>
          <ul>
            <li><strong>ID:</strong> ${cliente.id}</li>
            <li><strong>Nome:</strong> ${cliente.nome}</li>
            <li><strong>Telefone:</strong> ${cliente.telefone}</li>
            <li><strong>Endereço:</strong> ${cliente.endereco}, Nº ${cliente.numero}</li>
            <li><strong>Bairro:</strong> ${cliente.bairro}</li>
            <li><strong>Cidade:</strong> ${cliente.cidade}</li>
            <li><strong>Estado:</strong> ${cliente.estado}</li>
            <li><strong>País:</strong> ${cliente.pais}</li>
            <li><strong>CPF:</strong> ${cliente.cpf}</li>
            <li><strong>Status ID:</strong> ${cliente.statusId}</li>
            <li><strong>Aceita Lembrete:</strong> ${cliente.aceitaLembreteBanho ? "Sim" : "Não"}</li>
            ${cliente.redesSociais?.length ? `<li><strong>Redes Sociais:</strong> ${cliente.redesSociais.join(", ")}</li>` : ""}
            <li><strong>Google Maps:</strong> <a href="${cliente.link_maps}" target="_blank">Ver localização</a></li>
          </ul>
        </div>
      `;

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      alert("Erro ao cadastrar cliente.");
    }
  });
});

// Função auxiliar: montar link do Google Maps
function gerarLinkMaps(endereco, numero, bairro, cidade) {
  const query = encodeURIComponent(`${endereco}, ${numero} - ${bairro}, ${cidade}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

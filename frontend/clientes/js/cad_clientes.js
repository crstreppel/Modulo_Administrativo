document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("form-clientes");
  const listaClientesDiv = document.getElementById("lista-clientes");
  const btnMostrarCampos = document.getElementById("btn-mostrar-campos");
  const camposExtras = document.getElementById("campos-extras");

  camposExtras.style.display = "none";

  btnMostrarCampos.addEventListener("click", () => {
    if (camposExtras.style.display === "none") {
      camposExtras.style.display = "grid";
      btnMostrarCampos.innerText = "Ocultar campos extras";
    } else {
      camposExtras.style.display = "none";
      btnMostrarCampos.innerText = "Mostrar mais opções";
    }
  });

  async function listarClientes() {
    try {
      const response = await axios.get('http://localhost:3000/api/clientes')

      const clientes = response.data;

      listaClientesDiv.innerHTML = "";

      clientes.forEach((cliente) => {
        const div = document.createElement("div");
        div.classList.add("cliente-card");

        div.innerHTML = `
          <strong>${cliente.nome}</strong><br>
          ${cliente.telefone ? `Telefone: ${cliente.telefone}<br>` : ""}
          ${cliente.endereco ? `Endereço: ${cliente.endereco}, ${cliente.numero} ${cliente.complemento || ""} - ${cliente.bairro}<br>` : ""}
          ${cliente.cidade ? `Cidade: ${cliente.cidade} - ${cliente.uf}` : ""}
        `;

        listaClientesDiv.appendChild(div);
      });
    } catch (error) {
      console.error("Erro ao listar clientes:", error);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dados = {
      nome: form.nome.value,
      telefone: form.telefone.value,
      email: form.email.value,
      cpf: form.cpf.value,
      cnpj: form.cnpj.value,
      endereco: form.endereco.value,
      numero: form.numero.value,
      bairro: form.bairro.value,
      cidade: form.cidade.value,
      uf: form.uf.value,
      pais: form.pais.value,
      complemento: form.complemento.value,
      cep: form.cep.value,
      aceitaLembreteBanho: form.aceitaLembreteBanho.checked
    };

    try {
      await axios.post("http://localhost:3000/api/clientes", dados);
      form.reset();
      listarClientes();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
    }
  });

  listarClientes();
});

// frontend/meios_pagamento/js/cad_meioDePagamento.js

import { mostrarModalConfirmacao, carregarStatusSelect } from "../js/uiHelpers.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Carregar select de status mas escondê-lo e fixar como 'Ativo'
  await carregarStatusSelect("#status", true);
  document.getElementById("status").style.display = "none";

  const form = document.getElementById("form-meioDePagamento");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const descricao = document.getElementById("descricao").value.trim();
    const statusId = document.getElementById("status").value;

    if (!descricao) return alert("Informe uma descrição.");

    // Mostrar modal de confirmação com animação
    const confirmado = await mostrarModalConfirmacao(`Tem certeza que deseja cadastrar o meio de pagamento "<strong>${descricao}</strong>"?`);
    if (!confirmado) return;

    try {
      const response = await axios.post("http://localhost:3000/api/meios-de-pagamento", {
        descricao,
        statusId,
      });

      const meioDePagamento = response.data;

      document.getElementById("meio-pagamento-cadastrado").innerHTML = `
        <div class="mt-4 p-4 bg-green-100 rounded-xl shadow text-green-800 animate-fade-in">
          <p><strong>Meio de Pagamento cadastrado com sucesso!</strong></p>
          <p>ID: ${meioDePagamento.id}</p>
          <p>Descrição: ${meioDePagamento.descricao}</p>
        </div>
      `;

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar meio de pagamento:", error);
      alert("Erro ao cadastrar meio de pagamento.");
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const btnSistema = document.getElementById('btnSistema');
  const btnLoja = document.getElementById('btnLoja');

  btnSistema.addEventListener('click', () => {
    window.location.href = '/login.html';
  });

  btnLoja.addEventListener('mouseover', () => {
    if (btnLoja.disabled) {
      btnLoja.innerText = 'Em breve 🐾';
      setTimeout(() => {
        btnLoja.innerText = 'Loja Virtual (em breve)';
      }, 1500);
    }
  });
});

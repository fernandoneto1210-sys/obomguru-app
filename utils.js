// Formatar data para padrão brasileiro
export function formatarData(data) {
  if (!data) return '';
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
}

// Formatar moeda
export function formatarMoeda(valor, simbolo = 'R$') {
  if (!valor) return `${simbolo} 0,00`;
  return `${simbolo} ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
}

// Verificar se usuário está logado
export function verificarLogin() {
  const token = localStorage.getItem('token');
  return !!token;
}

// Salvar token de login
export function salvarToken(token) {
  localStorage.setItem('token', token);
}

// Remover token (logout)
export function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// Mostrar mensagem na tela
export function mostrarMensagem(elementoId, mensagem, tipo = 'info') {
  const elemento = document.getElementById(elementoId);
  if (!elemento) return;

  elemento.textContent = mensagem;
  elemento.style.color = tipo === 'erro' ? 'red' : tipo === 'sucesso' ? 'green' : 'blue';
  elemento.style.padding = '1rem';
  elemento.style.marginTop = '1rem';
}



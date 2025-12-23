import { supabase } from "./supabase.js";

// Menu hamburger
document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
  document.getElementById('navMenu').classList.toggle('show');
});

// Carregar viagens disponíveis
async function carregarGrupos() {
  const container = document.getElementById('cardsContainer');

  try {
    const { data, error } = await supabase
      .from('viagens')
      .select(`
        id,
        nome_viagem,
        data_saida,
        data_retorno,
        destinos (
          nome,
          imagem_capa
        )
      `)
      .order('data_saida', { ascending: true });

  import { supabase } from "./supabase.js";
import { mostrarMensagem, salvarToken } from "./utils.js";

const formLogin = document.getElementById('formLogin');

formLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = e.target.email.value.trim();
  const senha = e.target.senha.value.trim();

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .single();

    if (error || !data) {
      mostrarMensagem('mensagem', 'Email ou senha incorretos.', 'erro');
      return;
    }

    // Salvar token (simulado - em produção use JWT real)
    salvarToken(data.id);

    mostrarMensagem('mensagem', 'Login realizado com sucesso!', 'sucesso');

    // Redirecionar conforme tipo de usuário
    setTimeout(() => {
      if (data.tipo === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 1000);

  } catch (erro) {
    console.error('Erro no login:', erro);
    mostrarMensagem('mensagem', 'Erro ao fazer login.', 'erro');
  }
});


import { supabase } from "./supabase.js";

const formLogin = document.getElementById('formLogin');
const mensagem = document.getElementById('mensagem');

formLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = e.target.email.value.trim();
  const senha = e.target.senha.value.trim();

  console.log('🔐 Tentando login:', email);

  try {
    // Buscar na tabela CLIENTES
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .eq('ativo', true)
      .maybeSingle();

    console.log('Resposta do Supabase:', { cliente, error });

    if (error || !cliente) {
      console.error('❌ Login falhou');
      if (mensagem) {
        mensagem.textContent = '❌ E-mail ou senha incorretos';
        mensagem.style.color = 'red';
      }
      return;
    }

    console.log('✅ Login OK:', cliente.nome);

    // Salvar sessão do cliente
    localStorage.setItem('cliente_id', cliente.id);
    localStorage.setItem('cliente_nome', cliente.nome);
    localStorage.setItem('cliente_email', cliente.email);

    if (mensagem) {
      mensagem.textContent = '✅ Login realizado com sucesso!';
      mensagem.style.color = 'green';
    }

    // Redirecionar para área do passageiro
    setTimeout(() => {
      window.location.href = 'passageiro.html';
    }, 1000);

  } catch (erro) {
    console.error('💥 Erro no login:', erro);
    if (mensagem) {
      mensagem.textContent = '❌ Erro ao fazer login. Tente novamente.';
      mensagem.style.color = 'red';
    }
  }
});

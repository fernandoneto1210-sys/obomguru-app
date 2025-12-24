import { supabase } from './supabase.js';

// ========================================
// BUSCAR VIAGEM E EXIBIR NA PÁGINA
// ========================================
async function carregarViagem() {
  const urlParams = new URLSearchParams(window.location.search);
  const viagemId = urlParams.get('id');

  console.log('🔍 ID da URL:', viagemId);

  if (!viagemId) {
    mostrarErro('ID da viagem não fornecido.');
    return;
  }

  try {
    // Buscar viagem com destino relacionado (apenas colunas que EXISTEM)
    console.log('🔄 Buscando viagem no Supabase...');

    const { data: viagem, error: viagemError } = await supabase
      .from('viagens')
      .select(`
        *,
        destinos (
          id,
          nome,
          pais
        )
      `)
      .eq('id', viagemId)
      .single();

    console.log('📦 Resposta do Supabase:', { viagem, viagemError });

    if (viagemError) {
      console.error('❌ Erro do Supabase:', viagemError);
      mostrarErro('Erro ao buscar viagem: ' + viagemError.message);
      return;
    }

    if (!viagem) {
      console.error('❌ Viagem não encontrada');
      mostrarErro('Viagem não encontrada.');
      return;
    }

    console.log('✅ Viagem encontrada:', viagem);

    // Exibir informações da viagem
    exibirViagem(viagem);

    // Buscar roteiro
    await carregarRoteiro(viagemId);

    // Buscar documentos
    await carregarDocumentos(viagemId);

    // Buscar contatos
    await carregarContatos(viagemId);

    // Buscar alertas
    await carregarAlertas(viagemId);

    console.log('✅ Página carregada com sucesso!');
  } catch (error) {
    console.error('💥 Erro geral:', error);
    mostrarErro('Erro ao carregar viagem: ' + error.message);
  }
}

// ========================================
// EXIBIR INFORMAÇÕES DA VIAGEM
// ========================================
function exibirViagem(viagem) {
  console.log('🎨 Exibindo informações da viagem...');

  const destino = viagem.destinos;

  // Nome da viagem
  const tituloEl = document.getElementById('viagem-titulo');
  if (tituloEl) {
    tituloEl.textContent = viagem.nome_viagem;
    console.log('✅ Título definido:', viagem.nome_viagem);
  }

  // Destino
  const destinoEl = document.getElementById('viagem-destino');
  if (destinoEl && destino) {
    destinoEl.textContent = `${destino.nome} - ${destino.pais}`;
    console.log('✅ Destino definido:', destino.nome);
  }

  // Datas (sem timezone, formatando manualmente)
  const datasEl = document.getElementById('viagem-datas');
  if (datasEl) {
    const saida = viagem.data_saida
      ? formatarDataISO(viagem.data_saida)
      : 'Não definida';
    const retorno = viagem.data_retorno
      ? formatarDataISO(viagem.data_retorno)
      : 'Não definida';
    datasEl.textContent = `${saida} → ${retorno}`;
    console.log('✅ Datas definidas:', saida, '→', retorno);
  }

  // Moeda (por enquanto você não tem moeda na tabela destinos,
  // então vamos só deixar um traço ou texto fixo)
  const moedaEl = document.getElementById('viagem-moeda');
  if (moedaEl) {
    moedaEl.textContent = '—';
  }

  // Dicas do destino (também ainda não existe coluna no banco)
  const dicasEl = document.getElementById('viagem-dicas');
  if (dicasEl) {
    dicasEl.textContent = 'Em breve adicionaremos dicas detalhadas deste destino.';
  }

  // Imagem de capa (também ainda não existe no banco)
  const imagemEl = document.getElementById('viagem-imagem');
  if (imagemEl) {
    imagemEl.style.display = 'none'; // por enquanto esconde
  }
}

// ========================================
// FORMATAR DATA ISO (YYYY-MM-DD → DD/MM/YYYY)
// ========================================
function formatarDataISO(dataISO) {
  // dataISO vem como "2025-03-15"
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ========================================
// CARREGAR ROTEIRO
// ========================================
async function carregarRoteiro(viagemId) {
  console.log('📅 Carregando roteiro...');

  const { data, error } = await supabase
    .from('roteiro_dias')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('dia');

  const container = document.getElementById('roteiro-lista');
  if (!container) return;

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p>Nenhum roteiro cadastrado ainda.</p>';
    console.log('ℹ️ Nenhum roteiro encontrado');
    return;
  }

  console.log('✅ Roteiro encontrado:', data.length, 'dias');

  container.innerHTML = '';
  data.forEach(dia => {
    const diaEl = document.createElement('div');
    diaEl.className = 'roteiro-dia';
    diaEl.innerHTML = `
      <h3>Dia ${dia.dia}: ${dia.titulo}</h3>
      <p>${dia.descricao}</p>
    `;
    container.appendChild(diaEl);
  });
}

// ========================================
// CARREGAR DOCUMENTOS
// ========================================
async function carregarDocumentos(viagemId) {
  console.log('📄 Carregando documentos...');

  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('created_at');

  const container = document.getElementById('documentos-lista');
  if (!container) return;

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p>Nenhum documento cadastrado ainda.</p>';
    console.log('ℹ️ Nenhum documento encontrado');
    return;
  }

  console.log('✅ Documentos encontrados:', data.length);

  container.innerHTML = '';
  data.forEach(doc => {
    const docEl = document.createElement('div');
    docEl.className = 'documento-item';
    docEl.innerHTML = `
      <h4>${doc.tipo}: ${doc.nome}</h4>
      ${doc.link ? `<p><a href="${doc.link}" target="_blank">Acessar documento</a></p>` : ''}
      ${doc.observ ? `<p>${doc.observacoes}</p>` : ''}
    `;
    container.appendChild(docEl);
  });
}

// ========================================
// CARREGAR CONTATOS
// ========================================
async function carregarContatos(viagemId) {
  console.log('📞 Carregando contatos...');

  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('created_at');

  const container = document.getElementById('contatos-lista');
  if (!container) return;

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p>Nenhum contato cadastrado ainda.</p>';
    console.log('ℹ️ Nenhum contato encontrado');
    return;
  }

  console.log('✅ Contatos encontrados:', data.length);

  container.innerHTML = '';
  data.forEach(contato => {
    const contatoEl = document.createElement('div');
    contatoEl.className = 'contato-item';
    contatoEl.innerHTML = `
      <h4>${contato.tipo}: ${contato.nome}</h4>
      ${contato.telefone ? `<p>📞 ${contato.telefone}</p>` : ''}
      ${contato.email ? `<p>📧 ${contato.email}</p>` : ''}
      ${contato.observacoes ? `<p>${contato.observacoes}</p>` : ''}
    `;
    container.appendChild(contatoEl);
  });
}

// ========================================
// CARREGAR ALERTAS
// ========================================
async function carregarAlertas(viagemId) {
  console.log('⚠️ Carregando alertas...');

  const { data, error } = await supabase
    .from('alertas')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('prioridade', { ascending: false });

  const container = document.getElementById('alertas-lista');
  if (!container) return;

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p>Nenhum alerta cadastrado ainda.</p>';
    console.log('ℹ️ Nenhum alerta encontrado');
    return;
  }

  console.log('✅ Alertas encontrados:', data.length);

  container.innerHTML = '';
  data.forEach(alerta => {
    const alertaEl = document.createElement('div');
    alertaEl.className = `alerta-item alerta-${alerta.prioridade}`;
    alertaEl.innerHTML = `
      <h4>${alerta.tipo}: ${alerta.titulo}</h4>
      <p>${alerta.mensagem}</p>
    `;
    container.appendChild(alertaEl);
  });
}

// ========================================
// MOSTRAR ERRO
// ========================================
function mostrarErro(mensagem) {
  console.error('❌ Mostrando erro:', mensagem);
  document.body.innerHTML = `
    <div style="text-align: center; padding: 50px;">
      <h1>${mensagem}</h1>
      <a href="index.html">Voltar para a página inicial</a>
    </div>
  `;
}

// ========================================
// INICIALIZAR
// ========================================
console.log('🚀 Iniciando carregamento da página...');
document.addEventListener('DOMContentLoaded', carregarViagem);

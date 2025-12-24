import { supabase } from './supabase.js';

// ========================================
// BUSCAR VIAGEM E EXIBIR NA PÁGINA
// ========================================
async function carregarViagem() {
  const urlParams = new URLSearchParams(window.location.search);
  const viagemId = urlParams.get('id');

  if (!viagemId) {
    mostrarErro('ID da viagem não fornecido.');
    return;
  }

  try {
    // Buscar viagem com destino relacionado
    const { data: viagem, error: viagemError } = await supabase
      .from('viagens')
      .select(`
        *,
        destinos (
          nome,
          pais,
          moeda,
          simbolo_moeda,
          dicas_gerais,
          imagem_capa_url
        )
      `)
      .eq('id', viagemId)
      .single();

    if (viagemError || !viagem) {
      console.error('Erro ao buscar viagem:', viagemError);
      mostrarErro('Viagem não encontrada.');
      return;
    }

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

  } catch (error) {
    console.error('Erro geral:', error);
    mostrarErro('Erro ao carregar viagem.');
  }
}

// ========================================
// EXIBIR INFORMAÇÕES DA VIAGEM
// ========================================
function exibirViagem(viagem) {
  const destino = viagem.destinos;

  // Nome da viagem
  const tituloEl = document.getElementById('viagem-titulo');
  if (tituloEl) tituloEl.textContent = viagem.nome_viagem;

  // Destino
  const destinoEl = document.getElementById('viagem-destino');
  if (destinoEl && destino) {
    destinoEl.textContent = `${destino.nome} - ${destino.pais}`;
  }

  // Datas
  const datasEl = document.getElementById('viagem-datas');
  if (datasEl) {
    const saida = viagem.data_saida
      ? new Date(viagem.data_saida).toLocaleDateString('pt-BR')
      : 'Não definida';
    const retorno = viagem.data_retorno
      ? new Date(viagem.data_retorno).toLocaleDateString('pt-BR')
      : 'Não definida';
    datasEl.textContent = `${saida} → ${retorno}`;
  }

  // Moeda
  const moedaEl = document.getElementById('viagem-moeda');
  if (moedaEl && destino) {
    moedaEl.textContent = `${destino.simbolo_moeda} ${destino.moeda}`;
  }

  // Dicas do destino
  const dicasEl = document.getElementById('viagem-dicas');
  if (dicasEl && destino && destino.dicas_gerais) {
    dicasEl.textContent = destino.dicas_gerais;
  }

  // Imagem de capa
  const imagemEl = document.getElementById('viagem-imagem');
  if (imagemEl && destino && destino.imagem_capa_url) {
    imagemEl.src = destino.imagem_capa_url;
    imagemEl.alt = destino.nome;
  }
}

// ========================================
// CARREGAR ROTEIRO
// ========================================
async function carregarRoteiro(viagemId) {
  const { data, error } = await supabase
    .from('roteiro_dias')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('dia');

  const container = document.getElementById('roteiro-lista');
  if (!container) return;

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p>Nenhum roteiro cadastrado ainda.</p>';
    return;
  }

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
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('created_at');

  const container = document.getElementById('documentos-lista');
  if (!container) return;

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p>Nenhum documento cadastrado ainda.</p>';
    return;
  }

  container.innerHTML = '';
  data.forEach(doc => {
    const docEl = document.createElement('div');
    docEl.className = 'documento-item';
    docEl.innerHTML = `
      <h4>${doc.tipo}: ${doc.nome}</h4>
      ${doc.link ? `<p><a href="${doc.link}" target="_blank">Acessar documento</a></p>` : ''}
      ${doc.observacoes ? `<p>${doc.observacoes}</p>` : ''}
    `;
    container.appendChild(docEl);
  });
}

// ========================================
// CARREGAR CONTATOS
// ========================================
async function carregarContatos(viagemId) {
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('created_at');

  const container = document.getElementById('contatos-lista');
  if (!container) return;

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p>Nenhum contato cadastrado ainda.</p>';
    return;
  }

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
  const { data, error } = await supabase
    .from('alertas')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('prioridade', { ascending: false });

  const container = document.getElementById('alertas-lista');
  if (!container) return;

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p>Nenhum alerta cadastrado ainda.</p>';
    return;
  }

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
document.addEventListener('DOMContentLoaded', carregarViagem);

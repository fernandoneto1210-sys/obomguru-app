import { supabase } from './supabase.js';

// ========================================
// CARREGAR VIAGENS E EXIBIR CARDS
// ========================================
async function carregarViagens() {
  const container = document.getElementById('cardsContainer');

  if (!container) {
    console.error('Container de cards não encontrado');
    return;
  }

  console.log('🔄 Buscando viagens no Supabase...');

  try {
    const { data: viagens, error } = await supabase
      .from('viagens')
      .select(`
        id,
        nome_viagem,
        data_saida,
        data_retorno,
        destinos (
          id,
          nome,
          pais,
          imagem_capa_url
        )
      `)
      .order('data_saida', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar viagens:', error);
      container.innerHTML = '<p>Erro ao carregar viagens.</p>';
      return;
    }

    if (!viagens || viagens.length === 0) {
      console.log('ℹ️ Nenhuma viagem encontrada');
      container.innerHTML = '<p>Nenhuma viagem disponível no momento.</p>';
      return;
    }

    console.log('✅ Viagens encontradas:', viagens.length);

    // Limpar container
    container.innerHTML = '';

    // Criar cards
    viagens.forEach(viagem => {
      const destino = viagem.destinos;

      // Formatar datas
      const dataInicio = viagem.data_saida 
        ? formatarData(viagem.data_saida) 
        : 'Data a definir';
      const dataFim = viagem.data_retorno 
        ? formatarData(viagem.data_retorno) 
        : '';

      // Imagem (com fallback)
      const imagemUrl = destino?.imagem_capa_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';

      // Criar card
      const card = document.createElement('div');
      card.className = 'viagem-card';
      card.innerHTML = `
        <img src="${imagemUrl}" alt="${destino?.nome || 'Destino'}" loading="lazy">
        <div class="card-content">
          <h3>${viagem.nome_viagem}</h3>
          <p class="card-destino">📍 ${destino?.nome || 'Destino'} - ${destino?.pais || ''}</p>
          <p class="card-datas">📅 ${dataInicio}${dataFim ? ' → ' + dataFim : ''}</p>
          <a href="viagem.html?id=${viagem.id}" class="btn-card">Ver Detalhes</a>
        </div>
      `;

      container.appendChild(card);
    });

    console.log('✅ Cards criados com sucesso!');

  } catch (error) {
    console.error('💥 Erro geral:', error);
    container.innerHTML = '<p>Erro ao carregar viagens.</p>';
  }
}

// ========================================
// FORMATAR DATA (YYYY-MM-DD → DD/MM/YYYY)
// ========================================
function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ========================================
// MENU HAMBURGER (MOBILE)
// ========================================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');

if (hamburgerBtn && navMenu) {
  hamburgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
}

// ========================================
// INICIALIZAR
// ========================================
document.addEventListener('DOMContentLoaded', carregarViagens);

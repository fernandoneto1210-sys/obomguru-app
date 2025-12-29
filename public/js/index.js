import { supabase } from './supabase.js';

// ========================================
// CARREGAR VIAGENS E EXIBIR CARDS
// ========================================
async function carregarViagens() {
  const container = document.getElementById('cardsContainer');

  if (!container) {
    console.error('❌ Container não encontrado');
    return;
  }

  console.log('🔄 Buscando viagens...');

  try {
    const { data: viagens, error } = await supabase
      .from('viagens')
      .select(`
        id,
        nome_viagem,
        data_saida,
        data_retorno,
        destinos (
          nome,
          pais,
          imagem_capa_url
        )
      `)
      .order('data_saida', { ascending: true });

    if (error) {
      console.error('❌ Erro:', error);
      container.innerHTML = '<p>Erro ao carregar viagens.</p>';
      return;
    }

    if (!viagens || viagens.length === 0) {
      console.log('ℹ️ Nenhuma viagem encontrada');
      container.innerHTML = '<p>Nenhuma viagem disponível no momento.</p>';
      return;
    }

    console.log('✅ Viagens encontradas:', viagens.length);

    container.innerHTML = '';

    viagens.forEach((viagem) => {
      const destino = viagem.destinos;

      // Imagem com fallback
      const img = destino?.imagem_capa_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';

      const card = document.createElement('div');
      card.classList.add('viagem-card');

      card.innerHTML = `
        <img src="${img}" alt="${destino?.nome || 'Destino'}" loading="lazy">
        <div class="card-content">
          <h3>${viagem.nome_viagem}</h3>
          <p class="card-destino">📍 ${destino?.nome} – ${destino?.pais}</p>
          <p class="card-datas">📅 ${formatar(viagem.data_saida)} → ${formatar(viagem.data_retorno)}</p>
          <a class="btn-card" href="viagem.html?id=${viagem.id}">Ver Detalhes</a>
        </div>
      `;

      container.appendChild(card);
    });

    console.log('✅ Cards criados!');

  } catch (error) {
    console.error('💥 Erro geral:', error);
    container.innerHTML = '<p>Erro ao carregar viagens.</p>';
  }
}

// ========================================
// FORMATAR DATA
// ========================================
function formatar(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ========================================
// MENU HAMBURGER (MOBILE)
// ========================================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');

if (hamburgerBtn && navMenu) {
  hamburgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    console.log('🍔 Menu toggled');
  });
} else {
  console.warn('⚠️ Hamburger ou Nav não encontrado');
}

// ========================================
// INICIALIZAR
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Página carregada');
  carregarViagens();
});

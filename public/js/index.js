console.log('📄 index.js carregado');

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOMContentLoaded disparado');

  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('navMenu');

  console.log('🔍 hamburger:', hamburger);
  console.log('🔍 navMenu:', nav);

  if (!hamburger || !nav) {
    console.error('❌ Não achei hamburgerBtn ou navMenu no DOM');
    return;
  }

  hamburger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    nav.classList.toggle('active');
    console.log('🍔 clique no hamburger, active?', nav.classList.contains('active'));
  });

  // só para debugar: clique direto na nav
  nav.addEventListener('click', () => {
    console.log('📌 clique dentro do nav');
  });
});
import { supabase } from './supabase.js';

// ========================================
// CARREGAR VIAGENS
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
      container.innerHTML = '<p style="text-align: center; padding: 40px;">Erro ao carregar viagens.</p>';
      return;
    }

    if (!viagens || viagens.length === 0) {
      console.log('ℹ️ Nenhuma viagem encontrada');
      container.innerHTML = '<p style="text-align: center; padding: 40px;">Nenhuma viagem disponível no momento.</p>';
      return;
    }

    console.log('✅ Viagens encontradas:', viagens.length);

    container.innerHTML = '';

    viagens.forEach((viagem) => {
      const destino = viagem.destinos;
      const img = destino?.imagem_capa_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';

      const card = document.createElement('div');
      card.classList.add('viagem-card');

      card.innerHTML = `
        <img src="${img}" alt="${destino?.nome || 'Destino'}" onerror="this.src='https://via.placeholder.com/600x300?text=Imagem+Indisponivel'">
        <div class="card-content">
          <h3>${viagem.nome_viagem}</h3>
          <p class="card-destino">📍 ${destino?.nome || 'Destino'} – ${destino?.pais || ''}</p>
          <p class="card-datas">📅 ${formatar(viagem.data_saida)} → ${formatar(viagem.data_retorno)}</p>
          <a class="btn-card" href="viagem.html?id=${viagem.id}">Ver detalhes</a>
        </div>
      `;

      container.appendChild(card);
    });

    console.log('✅ Cards criados!');

  } catch (error) {
    console.error('💥 Erro:', error);
    container.innerHTML = '<p style="text-align: center; padding: 40px;">Erro ao carregar viagens.</p>';
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
function inicializarMenu() {
  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('navMenu');

  console.log('🔍 Elementos do menu:', { hamburger, nav });

  if (!hamburger || !nav) {
    console.error('❌ Menu hamburger ou nav não encontrado!');
    return;
  }

  console.log('✅ Menu hamburger inicializado');

  // Adicionar evento de clique
  hamburger.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    nav.classList.toggle('active');

    const estaAberto = nav.classList.contains('active');
    console.log('🍔 Menu:', estaAberto ? 'ABERTO ✅' : 'FECHADO ❌');
  });

  // Fechar ao clicar fora
  document.addEventListener('click', function(e) {
    if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
      nav.classList.remove('active');
    }
  });
}

// ========================================
// INICIALIZAR TUDO
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM carregado');
    carregarViagens();
    inicializarMenu();
  });
} else {
  console.log('🚀 DOM já estava pronto');
  carregarViagens();
  inicializarMenu();
}


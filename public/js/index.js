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

      // Imagem com fallback
      const img = destino?.imagem_capa_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';

      console.log('🖼️ Imagem:', img);

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

    console.log('✅ Cards criados com sucesso!');

  } catch (error) {
    console.error('💥 Erro geral:', error);
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
// MENU HAMBURGER
// ========================================
function inicializarMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');

  if (!hamburgerBtn || !navMenu) {
    console.warn('⚠️ Hamburger ou Nav não encontrado');
    return;
  }

  console.log('✅ Menu hamburger inicializado');

  hamburgerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    navMenu.classList.toggle('active');
    console.log('🍔 Menu toggled:', navMenu.classList.contains('active'));
  });

  // Fechar menu ao clicar fora
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      navMenu.classList.remove('active');
    }
  });
}

// ========================================
// INICIALIZAR
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Página carregada');
  carregarViagens();
  inicializarMenu();
});
// ======================================================
// MENU HAMBURGER
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburgerBtn');
    const nav = document.getElementById('navMenu');

    console.log("🔍 Menu encontrado?", hamburger, nav);

    if (!hamburger || !nav) {
        console.error("❌ Elementos do menu não encontrados!");
        return;
    }

    hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        nav.classList.toggle('active');

        console.log("🍔 Toggle do menu → agora está:", 
            nav.classList.contains('active') ? "ABERTO" : "FECHADO"
        );
    });

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && e.target !== hamburger) {
            nav.classList.remove('active');
        }
    });
});


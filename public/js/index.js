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

    if (error) {
      console.error('Erro ao carregar viagens:', error);
      container.innerHTML = '<p>Erro ao carregar viagens. Tente novamente.</p>';
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = '<p>Nenhuma viagem disponível no momento.</p>';
      return;
    }

    container.innerHTML = '';

    data.forEach(viagem => {
      const card = document.createElement('div');
      card.className = 'card';

      const destino = viagem.destinos || {};
      const imagemCapa = destino.imagem_capa || 'img/default.jpg';
      const nomeDestino = destino.nome || 'Destino';

      card.innerHTML = `
        <img src="${imagemCapa}" alt="${nomeDestino}">
        <h3>${viagem.nome_viagem}</h3>
        <p>${new Date(viagem.data_saida).toLocaleDateString('pt-BR')} → ${new Date(viagem.data_retorno).toLocaleDateString('pt-BR')}</p>
        <a href="viagem.html?id=${viagem.id}" class="btn">Ver detalhes</a>
      `;

      container.appendChild(card);
    });

  } catch (erro) {
    console.error('Erro inesperado:', erro);
    container.innerHTML = '<p>Erro ao carregar viagens.</p>';
  }
}

// Carregar ao abrir a página
carregarGrupos();
